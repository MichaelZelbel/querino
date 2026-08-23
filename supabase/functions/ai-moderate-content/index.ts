// AI moderation queue worker.
//
// Triggered by pg_cron every 2 minutes. Machine-only: every item it processes
// is a paid call to the AI gateway, so an open endpoint here is a bill anyone
// can run up (see _shared/internalAuth.ts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireMachineOrAdmin } from "../_shared/internalAuth.ts";
import { resolveConfig, type DbLike } from "../_shared/llm-config.ts";
import { callProvider } from "../_shared/llm-providers.ts";
import { PROVIDER_SECRETS, DEFAULT_PROVIDER, DEFAULT_MODEL } from "../_shared/llm-registry.ts";
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
    throw new Error(`${secretName} is not configured, which ai-moderate-content needs`);
  }

  const result = await callProvider({
    provider: effective.provider,
    model: effective.model,
    apiKey,
    temperature: effective.temperature,
    maxTokens: effective.max_tokens,
    messages: [
      { role: "system", content: effective.system_prompt ?? systemPrompt },
      { role: "user", content: `Analyze this content for policy violations:\n\n${content.substring(0, 4000)}` },
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
              safe: { type: "boolean", description: "true if content is safe, false if it violates policies" },
              category: { type: "string", enum: ["none", "sexual", "hate", "malware", "pii", "injection"], description: "The violation category, or 'none' if safe" },
              confidence: { type: "number", description: "Confidence score from 0.0 to 1.0" },
              reason: { type: "string", description: "Brief explanation of the classification decision" },
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

async function unpublishArtifact(
  serviceClient: ReturnType<typeof createClient>,
  itemType: string,
  itemId: string
): Promise<string | null> {
  // Get artifact title for the email
  let title: string | null = null;

  if (itemType === "prompt") {
    const { data } = await serviceClient
      .from("prompts")
      .select("title")
      .eq("id", itemId)
      .maybeSingle();
    title = data?.title || null;
    await serviceClient
      .from("prompts")
      .update({ is_public: false })
      .eq("id", itemId);
  } else if (itemType === "skill") {
    const { data } = await serviceClient
      .from("skills")
      .select("title")
      .eq("id", itemId)
      .maybeSingle();
    title = data?.title || null;
    await serviceClient
      .from("skills")
      .update({ published: false })
      .eq("id", itemId);
  } else if (itemType === "prompt_kit") {
    const { data } = await serviceClient
      .from("prompt_kits")
      .select("title")
      .eq("id", itemId)
      .maybeSingle();
    title = data?.title || null;
    await serviceClient
      .from("prompt_kits")
      .update({ published: false })
      .eq("id", itemId);
  } else if (itemType === "workflow") {
    const { data } = await serviceClient
      .from("workflows")
      .select("title")
      .eq("id", itemId)
      .maybeSingle();
    title = data?.title || null;
    await serviceClient
      .from("workflows")
      .update({ published: false })
      .eq("id", itemId);
  }

  return title;
}

async function incrementStrike(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: existing } = await serviceClient
    .from("user_suspensions")
    .select("id, strike_count")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const newStrikes = existing.strike_count + 1;
    const shouldSuspend = newStrikes >= STRIKE_THRESHOLD;
    await serviceClient
      .from("user_suspensions")
      .update({
        strike_count: newStrikes,
        suspended: shouldSuspend,
        suspended_at: shouldSuspend ? new Date().toISOString() : null,
        suspension_reason: shouldSuspend
          ? `Auto-suspended after ${newStrikes} content violations (AI moderation)`
          : null,
      })
      .eq("id", existing.id);
  } else {
    await serviceClient.from("user_suspensions").insert({
      user_id: userId,
      strike_count: 1,
      suspended: false,
    });
  }
}

async function sendViolationEmail(
  userId: string,
  itemType: string,
  title: string | null,
  category: string,
  serviceClient: ReturnType<typeof createClient>
) {
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("Resend not configured, skipping email notification");
    return;
  }

  // Get user email from auth
  const { data: { user } } = await serviceClient.auth.admin.getUserById(userId);
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
      <p style="color: #666; font-size: 14px; margin-top: 30px;">— The Querino Team</p>
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

    // Fetch pending items
    const { data: pendingItems, error: fetchError } = await serviceClient
      .from("moderation_review_queue")
      .select("id, item_type, item_id, user_id, content_snapshot, retry_count")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("Failed to fetch queue:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch queue" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingItems || pendingItems.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending items" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${pendingItems.length} items from AI moderation queue`);

    let processed = 0;
    let violations = 0;
    let errors = 0;

    for (const item of pendingItems as QueueItem[]) {
      try {
        const classification = await classifyContent(item.content_snapshot);
        console.log(`Item ${item.id}: safe=${classification.safe}, category=${classification.category}, confidence=${classification.confidence}`);

        if (!classification.safe && classification.confidence >= CONFIDENCE_AUTO_UNPUBLISH) {
          // HIGH confidence violation → auto-unpublish
          const title = await unpublishArtifact(serviceClient, item.item_type, item.item_id);

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
          await incrementStrike(serviceClient, item.user_id);

          // Send email
          await sendViolationEmail(
            item.user_id,
            item.item_type,
            title,
            classification.category,
            serviceClient
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
          // Safe or low confidence → mark as reviewed
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

        await serviceClient
          .from("moderation_review_queue")
          .update({
            status: newRetryCount >= MAX_RETRIES ? "error" : "pending",
            retry_count: newRetryCount,
            ai_reason: itemErr instanceof Error ? itemErr.message : "Unknown error",
          })
          .eq("id", item.id);

        errors++;
      }
    }

    console.log(`AI moderation complete: ${processed} processed, ${violations} violations, ${errors} errors`);

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
