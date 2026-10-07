// AI moderation queue worker.
//
// Triggered by pg_cron every 2 minutes. Machine-only: every item it processes
// is a paid call to the AI gateway, so an open endpoint here is a bill anyone
// can run up (see _shared/internalAuth.ts).

import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireMachineOrAdmin } from "../_shared/internalAuth.ts";
import { resolveConfig, type DbLike } from "../_shared/llm-config.ts";
import { callProvider } from "../_shared/llm-providers.ts";
import {
  PROVIDER_SECRETS,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
  getCallSiteMeta,
} from "../_shared/llm-registry.ts";
import { SYSTEM_PROMPT as systemPrompt } from "../_shared/prompts/ai-moderate-content.ts";
import {
  classificationWindows,
  combineClassifications,
  planAttempt,
  statusAfterFailure,
  violationEmail,
  type AIClassification,
} from "../_shared/moderationQueue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// The same endpoint and sender notify-admin uses. Until 2026-09-16 this mail
// went through the Lovable connector gateway from onboarding@resend.dev, a
// sender Resend only honours for test mail.
const RESEND_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Querino <support@querino.ai>";
const BATCH_SIZE = 5;
// The attempt limit lives in _shared/moderationQueue.ts with the reason it is
// counted before the call rather than after.
//
// The platform kills a function at 150 s. One classification is a short
// forced tool call, so a provider that has not answered in 45 s is not going
// to, and holding on to it for the transport's 110 s let a batch of five run
// far past the kill. After TICK_DEADLINE_MS no new row is started, and the
// rows not yet begun go back to 'pending' untouched. The deadline leaves room
// for the last row started: up to 45 s of classifying (its slices run side by
// side) and then, on a violation, up to two mails at a user lookup plus 15 s
// each. At 90 s that last row could end near 165 s, and the kill lost its
// mails (2026-10-07).
const CLASSIFY_TIMEOUT_MS = 45_000;
const TICK_DEADLINE_MS = 55_000;
const CONFIDENCE_AUTO_UNPUBLISH = 0.85;
const STRIKE_THRESHOLD = 5;

interface QueueItem {
  id: string;
  item_type: string;
  item_id: string;
  // The author: what the row is checked against before anything is enforced.
  user_id: string;
  // Who wrote the text under review (a teammate can edit a team artifact).
  // Struck and mailed instead of the author since 2026-10-07; null on older
  // rows and on rows filed by moderate-content, which are the author's own.
  editor_id?: string | null;
  // More than one person changed the text while the review was pending: a
  // violation is still taken down, but nobody is struck automatically.
  editors_mixed?: boolean | null;
  content_snapshot: string;
  retry_count: number;
}

// Where each moderated type lives, which columns hold its text and its
// writer, and what enforcing a violation writes. Since 2026-10-07 a comment
// has its own queue row keyed by its own id (20261007120400), so it is here
// too; it is not deleted, because its replies would cascade with it, but its
// text is replaced with a notice.
const COMMENT_REMOVED = "[This comment was removed by moderation.]";
const MODERATED: Record<
  string,
  {
    table: string;
    author: string;
    text: string[];
    enforce: Record<string, unknown>;
  }
> = {
  prompt: {
    table: "prompts",
    author: "author_id",
    text: ["title", "description", "content"],
    enforce: { is_public: false },
  },
  skill: {
    table: "skills",
    author: "author_id",
    text: ["title", "description", "content"],
    enforce: { published: false },
  },
  prompt_kit: {
    table: "prompt_kits",
    author: "author_id",
    text: ["title", "description", "content"],
    enforce: { published: false },
  },
  workflow: {
    table: "workflows",
    author: "author_id",
    text: ["title", "description", "content"],
    enforce: { published: false },
  },
  comment: {
    table: "comments",
    author: "user_id",
    text: ["content"],
    enforce: { content: COMMENT_REMOVED },
  },
};

interface ArtifactRow {
  title: string | null;
  // The live text, every text column joined.
  text: string;
  author_id: string | null;
}

// The classifier answers through a forced tool call, but a forced tool call
// is still model output: the arguments can be prose, null, a string, or an
// object missing a field. Anything short of the promised shape is a
// classification failure, and throwing here sends the row down the retry
// path rather than letting `undefined >= 0.85` decide someone's strike.
function parseClassification(raw: string): AIClassification {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Classifier tool arguments are not valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Classifier tool arguments are not an object");
  }
  const args = parsed as Record<string, unknown>;
  if (typeof args.safe !== "boolean") {
    throw new Error("Classifier returned no boolean safe flag");
  }
  if (
    typeof args.confidence !== "number" ||
    !Number.isFinite(args.confidence)
  ) {
    throw new Error("Classifier returned no finite confidence");
  }
  if (typeof args.category !== "string") {
    throw new Error("Classifier returned no category string");
  }
  return {
    safe: args.safe,
    category: args.category,
    confidence: Math.min(1, Math.max(0, args.confidence)),
    reason: typeof args.reason === "string" ? args.reason : "",
  };
}

async function classifyWindow(content: string): Promise<AIClassification> {
  // Deliberately no credit gate. This runs from cron or an admin button, the
  // cost is the platform's, and gating it on some user's balance would mean
  // moderation stops the moment that user runs dry.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { effective, source } = await resolveConfig(
    admin as unknown as DbLike,
    "ai-moderate-content",
    "default",
    {
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      systemPrompt,
      // The registry budget, unless an admin set one: a classification is a
      // short forced tool call, and an uncapped one is charged in full.
      maxTokens: getCallSiteMeta("ai-moderate-content")?.maxOutputTokens,
    },
  );

  const secretName = PROVIDER_SECRETS[effective.provider];
  const apiKey = Deno.env.get(secretName);
  if (!apiKey) {
    throw new Error(
      `${secretName} is not configured, which ai-moderate-content needs`,
    );
  }

  const result = await callProvider({
    provider: effective.provider,
    model: effective.model,
    apiKey,
    temperature: effective.temperature,
    maxTokens: effective.max_tokens,
    messages: [
      { role: "system", content: effective.system_prompt ?? systemPrompt },
      {
        role: "user",
        content: `Analyze this content for policy violations:\n\n${content}`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "classify_content",
          description: "Return the content moderation classification result.",
          parameters: {
            type: "object",
            properties: {
              safe: {
                type: "boolean",
                description:
                  "true if content is safe, false if it violates policies",
              },
              category: {
                type: "string",
                enum: ["none", "sexual", "hate", "malware", "pii", "injection"],
                description: "The violation category, or 'none' if safe",
              },
              confidence: {
                type: "number",
                description: "Confidence score from 0.0 to 1.0",
              },
              reason: {
                type: "string",
                description: "Brief explanation of the classification decision",
              },
            },
            required: ["safe", "category", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
    ],
    toolChoice: { type: "function", function: { name: "classify_content" } },
    signal: AbortSignal.timeout(CLASSIFY_TIMEOUT_MS),
  });

  // Best-effort spend record, the way llm.ts does it for user calls. No user
  // id: this is the platform's own spend, and the ledger's admin view puts a
  // row with no user in its machine bucket. Until 2026-09-16 this call site
  // paid the provider and wrote nothing down. Never blocks the classification.
  try {
    const { error } = await admin.rpc("record_llm_usage", {
      p_user_id: null,
      p_idempotency_key: crypto.randomUUID(),
      p_feature: "ai-moderate-content",
      p_provider: effective.provider,
      p_model: result.model,
      p_prompt_tokens: result.usage.prompt_tokens,
      p_completion_tokens: result.usage.completion_tokens,
      p_total_tokens: result.usage.total_tokens,
      p_metadata: { config_source: source },
    });
    if (error) {
      console.error("[ai-moderate-content] record_llm_usage error:", error);
    }
  } catch (e) {
    console.error("[ai-moderate-content] usage logging threw:", e);
  }

  const toolCall = result.tool_calls[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("No tool call in AI response");
  }

  return parseClassification(toolCall.function.arguments);
}

// Every slice of the text, classified side by side so a long artifact takes
// one provider round trip rather than eight, then one verdict. A slice that
// fails fails the whole row, which goes down the retry path. The note says
// how much was read when the text is longer than the slices reach.
async function classifyContent(
  text: string,
): Promise<{ classification: AIClassification; note: string }> {
  const { windows, coveredChars, totalChars } = classificationWindows(text);
  const results = await Promise.all(windows.map((w) => classifyWindow(w)));
  const classification = combineClassifications(results);
  const note =
    coveredChars < totalChars
      ? ` (read the first ${coveredChars} of ${totalChars} characters)`
      : "";
  return { classification, note };
}

// The current text and writer of the row a queue item points at. Null when
// the type is unknown or the row is gone. A read failure is neither: it
// throws, so the item takes the retry path instead of being marked reviewed
// for something that is still live.
async function loadArtifact(
  serviceClient: SupabaseClient,
  itemType: string,
  itemId: string,
): Promise<ArtifactRow | null> {
  const target = MODERATED[itemType];
  if (!target) return null;
  const { data, error } = await serviceClient
    .from(target.table)
    .select([...target.text, target.author].join(", "))
    .eq("id", itemId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load ${itemType} ${itemId}: ${error.message}`);
  }
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;
  const text = target.text
    .map((c) => row[c])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join("\n\n");
  return {
    title: typeof row.title === "string" ? row.title : null,
    text,
    author_id: (row[target.author] as string | null) ?? null,
  };
}

async function enforceViolation(
  serviceClient: SupabaseClient,
  itemType: string,
  itemId: string,
): Promise<void> {
  const target = MODERATED[itemType];
  if (!target) return;
  const { error } = await serviceClient
    .from(target.table)
    .update(target.enforce)
    .eq("id", itemId);
  if (error) {
    throw new Error(
      `Failed to enforce on ${itemType} ${itemId}: ${error.message}`,
    );
  }
}

// Every queue update goes through here so a failed write is never mistaken
// for a done one. supabase-js hands the failure back in `error` and does not
// throw, which until 2026-09-16 meant a row whose final status never landed
// counted as processed.
async function updateQueueRow(
  serviceClient: SupabaseClient,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await serviceClient
    .from("moderation_review_queue")
    .update(patch)
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to update queue row ${id}: ${error.message}`);
  }
}

// One statement in the database, so overlapping ticks cannot each read the
// same count and write the same count plus one.
async function incrementStrike(
  serviceClient: SupabaseClient,
  userId: string,
): Promise<{ strikeCount: number; suspended: boolean }> {
  const { data, error } = await serviceClient.rpc("increment_user_strike", {
    p_user_id: userId,
    p_threshold: STRIKE_THRESHOLD,
  });
  if (error) {
    // The artifact is already unpublished and the event logged, so a retry
    // would classify and charge again. Report it and move on instead.
    console.error("Failed to record strike for", userId, error);
    return { strikeCount: 0, suspended: false };
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    { strike_count: number; suspended: boolean } | undefined;
  return {
    strikeCount: row?.strike_count ?? 0,
    suspended: row?.suspended ?? false,
  };
}

async function sendViolationEmail(
  userId: string,
  itemType: string,
  title: string | null,
  category: string,
  serviceClient: SupabaseClient,
) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  // Get user email from auth
  const {
    data: { user },
    error: userErr,
  } = await serviceClient.auth.admin.getUserById(userId);
  if (userErr || !user?.email) {
    console.warn("No email found for user", userId, userErr ?? "");
    return;
  }

  // The title is the author's own text; violationEmail escapes it.
  const { subject, html } = violationEmail({ itemType, title, category });

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      // A hung mail provider must not hold the tick past the platform's kill.
      signal: AbortSignal.timeout(15_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        "Resend refused the violation email:",
        res.status,
        detail.slice(0, 500),
      );
      return;
    }
    console.log("Violation email sent to user", userId);
  } catch (emailErr) {
    console.error("Failed to send violation email:", emailErr);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // The tick's clock starts with the request, before anything is claimed.
  const startedAt = Date.now();

  // Each hit spends money at the AI gateway, so the caller is either the
  // pg_cron job holding the shared secret or a signed-in admin pressing
  // "trigger AI review" in ModerationPanel.tsx. Never the public.
  const denied = await requireMachineOrAdmin(req, corsHeaders);
  if (denied) return denied;

  try {
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Claim a batch in one statement. Rows come back already marked
    // 'processing', so a second tick (or the admin button pressed twice)
    // cannot pick up the same row and classify, strike and email it again.
    // Rows stuck in 'processing' for ten minutes are handed out again.
    const { data: claimedItems, error: fetchError } = await serviceClient.rpc(
      "claim_moderation_review_queue",
      { batch_size: BATCH_SIZE },
    );

    if (fetchError) {
      console.error("Failed to claim queue rows:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch queue" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pendingItems = (claimedItems ?? []) as QueueItem[];

    if (pendingItems.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending items" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Processing ${pendingItems.length} items from AI moderation queue`,
    );

    let processed = 0;
    let violations = 0;
    let errors = 0;
    let released = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];

      if (Date.now() - startedAt > TICK_DEADLINE_MS) {
        // Nothing was tried for these, so nothing is counted: they go back
        // to 'pending' as they were. Only rows still 'processing' are
        // touched, in case the stale window already gave one to another tick.
        const rest = pendingItems.slice(i).map((r) => r.id);
        const { error: releaseErr } = await serviceClient
          .from("moderation_review_queue")
          .update({ status: "pending", claimed_at: null })
          .in("id", rest)
          .eq("status", "processing");
        if (releaseErr) {
          console.error("Failed to release unstarted rows:", releaseErr);
        }
        released = rest.length;
        console.warn(`Tick deadline reached; released ${rest.length} row(s)`);
        break;
      }

      // A row the claim handed out again after a killed tick comes back with
      // the attempt this worker wrote before it died (see
      // _shared/moderationQueue.ts). One that has used them all is closed
      // here, without another paid call.
      const plan = planAttempt(item.retry_count);
      if (plan.giveUp) {
        const { error: giveUpErr } = await serviceClient
          .from("moderation_review_queue")
          .update({
            status: "error",
            ai_reason:
              "gave up: every attempt ended without a result (the worker was stopped before it could record one)",
          })
          .eq("id", item.id);
        if (giveUpErr) {
          console.error(`Failed to close queue row ${item.id}:`, giveUpErr);
        }
        errors++;
        continue;
      }

      try {
        // Counted before anything is paid for, so a tick killed during the
        // call below still leaves the attempt on the row.
        await updateQueueRow(serviceClient, item.id, {
          retry_count: plan.attempt,
        });

        // Classify what the artifact says NOW, not what the client said it
        // said. The queue row is filed by moderate-content with a snapshot
        // the client assembled, so until 2026-09-16 a benign snapshot filed
        // against a real item id kept the real content from ever being read.
        // The snapshot is only used for a type with no table here.
        let artifact: ArtifactRow | null = null;
        let text = item.content_snapshot ?? "";

        if (MODERATED[item.item_type] && item.item_id) {
          artifact = await loadArtifact(
            serviceClient,
            item.item_type,
            item.item_id,
          );

          if (!artifact) {
            // Deleted before review. Nothing to unpublish, so nothing to pay
            // a classifier for.
            console.log(
              `Item ${item.id}: ${item.item_type} ${item.item_id} no longer exists, nothing to review`,
            );
            await updateQueueRow(serviceClient, item.id, {
              status: "reviewed",
              ai_category: "none",
              ai_confidence: null,
              ai_reason:
                "Not classified: the artifact was deleted before review",
              reviewed_at: new Date().toISOString(),
            });
            processed++;
            continue;
          }

          // The row is filed by moderate-content from the caller's JWT, and
          // the caller must not be able to get someone else's artifact taken
          // down. A row that can never be enforced is not worth a paid call.
          if (artifact.author_id !== item.user_id) {
            console.warn(
              `Item ${item.id}: user ${item.user_id} is not the author of ${item.item_type} ${item.item_id}, skipping`,
            );
            await updateQueueRow(serviceClient, item.id, {
              status: "reviewed",
              ai_category: "none",
              ai_confidence: null,
              ai_reason: `Not enforced: queue row user ${item.user_id} is not the author of this ${item.item_type}, so it was not classified`,
              reviewed_at: new Date().toISOString(),
            });
            processed++;
            continue;
          }

          if (artifact.text) text = artifact.text;
        }

        const { classification, note } = await classifyContent(text);
        // The editor answers for the text, not the author of what they edited
        // (20261007120300). When several people edited it, nobody can be
        // named, so nobody is struck: the newest may only have fixed a typo.
        const offender = item.editors_mixed
          ? null
          : (item.editor_id ?? item.user_id);
        console.log(
          `Item ${item.id}: safe=${classification.safe}, category=${classification.category}, confidence=${classification.confidence}`,
        );

        if (
          !classification.safe &&
          classification.confidence >= CONFIDENCE_AUTO_UNPUBLISH
        ) {
          // HIGH confidence violation: auto-unpublish. Every write below
          // throws on failure, so a half-done enforcement goes back to the
          // queue instead of counting as done.
          await enforceViolation(serviceClient, item.item_type, item.item_id);
          const title = artifact?.title ?? null;

          // Log moderation event
          const { error: eventErr } = await serviceClient
            .from("moderation_events")
            .insert({
              user_id: offender ?? item.user_id,
              action: "ai_review",
              item_type: item.item_type,
              item_id: item.item_id,
              flagged_content: text.substring(0, 500),
              matched_words: [classification.reason],
              category: classification.category,
              result: "blocked",
              tier: "ai",
            });
          if (eventErr) {
            throw new Error(
              `Failed to log moderation event: ${eventErr.message}`,
            );
          }

          // The row gets its final status BEFORE the strike and the email.
          // Anything that fails after this line must not send the row back
          // to pending, because the next claim would strike and email again.
          await updateQueueRow(serviceClient, item.id, {
            status: "violation",
            ai_category: classification.category,
            ai_confidence: classification.confidence,
            ai_reason: classification.reason + note,
            reviewed_at: new Date().toISOString(),
          });
          violations++;

          try {
            if (offender) {
              const strike = await incrementStrike(serviceClient, offender);
              if (strike.suspended) {
                console.log(
                  `User ${offender} suspended after ${strike.strikeCount} strikes`,
                );
              }
            } else {
              console.warn(
                `Item ${item.id}: several people edited this text, so no strike was given`,
              );
            }

            // The writer, and the author too when a teammate's edit took the
            // author's artifact off the site.
            for (const recipient of new Set([
              offender ?? item.user_id,
              item.user_id,
            ])) {
              await sendViolationEmail(
                recipient,
                item.item_type,
                title,
                classification.category,
                serviceClient,
              );
            }
          } catch (lateErr) {
            // Logged, never retried: the artifact is unpublished and the row
            // is final, and a retry would classify, strike and email again.
            console.error(
              `Item ${item.id}: strike or email failed after the row was marked:`,
              lateErr,
            );
          }
        } else {
          // Safe or low confidence: mark as reviewed
          await updateQueueRow(serviceClient, item.id, {
            status: "reviewed",
            ai_category: classification.category || "none",
            ai_confidence: classification.confidence,
            ai_reason: classification.reason + note,
            reviewed_at: new Date().toISOString(),
          });
        }

        processed++;
      } catch (itemErr) {
        console.error(`Error processing item ${item.id}:`, itemErr);

        // Back to 'pending' so the next claim picks it up again, or 'error'
        // once this was the last attempt. The attempt was already counted
        // above; writing it again here covers the case where that write is
        // what failed.
        const { error: retryErr } = await serviceClient
          .from("moderation_review_queue")
          .update({
            status: statusAfterFailure(plan.attempt),
            retry_count: plan.attempt,
            ai_reason:
              itemErr instanceof Error ? itemErr.message : "Unknown error",
          })
          .eq("id", item.id);
        if (retryErr) {
          // Nothing left to do but say so: the row stays 'processing' and the
          // claim function hands it out again after ten minutes.
          console.error(`Failed to reschedule queue row ${item.id}:`, retryErr);
        }

        errors++;
      }
    }

    console.log(
      `AI moderation complete: ${processed} processed, ${violations} violations, ${errors} errors, ${released} released`,
    );

    return new Response(
      JSON.stringify({ processed, violations, errors, released }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("AI moderation error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
