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
} from "../_shared/llm-registry.ts";
import { SYSTEM_PROMPT as systemPrompt } from "../_shared/prompts/ai-moderate-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const CONFIDENCE_AUTO_UNPUBLISH = 0.85;
const STRIKE_THRESHOLD = 5;

interface QueueItem {
  id: string;
  item_type: string;
  item_id: string;
  user_id: string;
  content_snapshot: string;
  retry_count: number;
}

interface AIClassification {
  safe: boolean;
  category: string;
  confidence: number;
  reason: string;
}

// Where each moderated artifact type lives and which column takes it off the
// public site. A comment has no row of its own, so it is not in this map and
// the worker never unpublishes anything for it.
const ARTIFACT_TABLES: Record<
  string,
  { table: string; unpublish: Record<string, boolean> }
> = {
  prompt: { table: "prompts", unpublish: { is_public: false } },
  skill: { table: "skills", unpublish: { published: false } },
  prompt_kit: { table: "prompt_kits", unpublish: { published: false } },
  workflow: { table: "workflows", unpublish: { published: false } },
};

interface ArtifactRow {
  title: string | null;
  author_id: string | null;
}

async function classifyContent(content: string): Promise<AIClassification> {
  // Deliberately no credit gate. This runs from cron or an admin button, the
  // cost is the platform's, and gating it on some user's balance would mean
  // moderation stops the moment that user runs dry.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { effective } = await resolveConfig(
    admin as unknown as DbLike,
    "ai-moderate-content",
    "default",
    {
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      systemPrompt,
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
        content: `Analyze this content for policy violations:\n\n${content.substring(0, 4000)}`,
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
  });

  // Shaped like the gateway response so the rest of this function is unchanged.
  const data = { choices: [{ message: { tool_calls: result.tool_calls } }] };
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("No tool call in AI response");
  }

  return JSON.parse(toolCall.function.arguments) as AIClassification;
}

// The title and author of the artifact a queue row points at. Null when the
// type has no table (a comment) or the row is gone.
async function loadArtifact(
  serviceClient: SupabaseClient,
  itemType: string,
  itemId: string,
): Promise<ArtifactRow | null> {
  const target = ARTIFACT_TABLES[itemType];
  if (!target) return null;
  const { data } = await serviceClient
    .from(target.table)
    .select("title, author_id")
    .eq("id", itemId)
    .maybeSingle();
  return (data as ArtifactRow | null) ?? null;
}

async function unpublishArtifact(
  serviceClient: SupabaseClient,
  itemType: string,
  itemId: string,
): Promise<void> {
  const target = ARTIFACT_TABLES[itemType];
  if (!target) return;
  await serviceClient
    .from(target.table)
    .update(target.unpublish)
    .eq("id", itemId);
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
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("Resend not configured, skipping email notification");
    return;
  }

  // Get user email from auth
  const {
    data: { user },
  } = await serviceClient.auth.admin.getUserById(userId);
  if (!user?.email) {
    console.warn("No email found for user", userId);
    return;
  }

  const categoryLabels: Record<string, string> = {
    sexual: "Inappropriate content",
    hate: "Hateful or abusive content",
    malware: "Potentially malicious content",
    pii: "Personal information detected",
    injection: "Prompt injection attempt",
  };

  const categoryLabel = categoryLabels[category] || "Content policy violation";
  const artifactTitle = title || "Untitled";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a;">Your ${itemType} has been unpublished</h2>
      <p>Hi,</p>
      <p>Our automated content review found that your ${itemType} <strong>"${artifactTitle}"</strong> may violate our <a href="https://querino.ai/community-guidelines">Community Guidelines</a>.</p>
      <p><strong>Category:</strong> ${categoryLabel}</p>
      <p>Your artifact has been set to private. You can still access and edit it in your library.</p>
      <p>If you believe this is a mistake, please contact us at <a href="mailto:support@querino.ai">support@querino.ai</a> and we'll review it manually.</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">The Querino Team</p>
    </div>
  `;

  try {
    await fetch(`${RESEND_GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Querino <onboarding@resend.dev>",
        to: [user.email],
        subject: `Your ${itemType} "${artifactTitle}" has been unpublished`,
        html,
      }),
    });
    console.log("Violation email sent to", user.email);
  } catch (emailErr) {
    console.error("Failed to send violation email:", emailErr);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    for (const item of pendingItems) {
      try {
        const classification = await classifyContent(item.content_snapshot);
        console.log(
          `Item ${item.id}: safe=${classification.safe}, category=${classification.category}, confidence=${classification.confidence}`,
        );

        if (
          !classification.safe &&
          classification.confidence >= CONFIDENCE_AUTO_UNPUBLISH
        ) {
          // HIGH confidence violation: auto-unpublish. First make sure the
          // artifact really belongs to the user the queue row names. The row
          // is filed by moderate-content from the caller's JWT, and the caller
          // must not be able to get someone else's artifact taken down.
          const artifact = await loadArtifact(
            serviceClient,
            item.item_type,
            item.item_id,
          );

          if (artifact && artifact.author_id !== item.user_id) {
            console.warn(
              `Item ${item.id}: user ${item.user_id} is not the author of ${item.item_type} ${item.item_id}, skipping`,
            );
            await serviceClient
              .from("moderation_review_queue")
              .update({
                status: "reviewed",
                ai_category: classification.category,
                ai_confidence: classification.confidence,
                ai_reason: `Not enforced: queue row user ${item.user_id} is not the author of this ${item.item_type}. AI said: ${classification.reason}`,
                reviewed_at: new Date().toISOString(),
              })
              .eq("id", item.id);
            processed++;
            continue;
          }

          await unpublishArtifact(serviceClient, item.item_type, item.item_id);
          const title = artifact?.title ?? null;

          // Log moderation event
          await serviceClient.from("moderation_events").insert({
            user_id: item.user_id,
            action: "ai_review",
            item_type: item.item_type,
            item_id: item.item_id,
            flagged_content: item.content_snapshot.substring(0, 500),
            matched_words: [classification.reason],
            category: classification.category,
            result: "blocked",
            tier: "ai",
          });

          // Increment strike
          const strike = await incrementStrike(serviceClient, item.user_id);
          if (strike.suspended) {
            console.log(
              `User ${item.user_id} suspended after ${strike.strikeCount} strikes`,
            );
          }

          // Send email
          await sendViolationEmail(
            item.user_id,
            item.item_type,
            title,
            classification.category,
            serviceClient,
          );

          // Update queue item
          await serviceClient
            .from("moderation_review_queue")
            .update({
              status: "violation",
              ai_category: classification.category,
              ai_confidence: classification.confidence,
              ai_reason: classification.reason,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          violations++;
        } else {
          // Safe or low confidence: mark as reviewed
          await serviceClient
            .from("moderation_review_queue")
            .update({
              status: "reviewed",
              ai_category: classification.category || "none",
              ai_confidence: classification.confidence,
              ai_reason: classification.reason,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }

        processed++;
      } catch (itemErr) {
        console.error(`Error processing item ${item.id}:`, itemErr);
        const newRetryCount = item.retry_count + 1;

        // Back to 'pending' so the next claim picks it up again, or 'error'
        // once it has failed MAX_RETRIES times.
        await serviceClient
          .from("moderation_review_queue")
          .update({
            status: newRetryCount >= MAX_RETRIES ? "error" : "pending",
            retry_count: newRetryCount,
            ai_reason:
              itemErr instanceof Error ? itemErr.message : "Unknown error",
          })
          .eq("id", item.id);

        errors++;
      }
    }

    console.log(
      `AI moderation complete: ${processed} processed, ${violations} violations, ${errors} errors`,
    );

    return new Response(JSON.stringify({ processed, violations, errors }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI moderation error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
