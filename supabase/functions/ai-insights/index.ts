import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeadersFor } from "../_shared/cors.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  DEFAULT_MODEL,
  capText,
} from "../_shared/llm.ts";
import { SYSTEM_PROMPTS } from "../_shared/prompts/ai-insights.ts";

type ItemType = "prompt" | "skill" | "workflow" | "prompt_kit";

const ITEM_TABLES: Record<ItemType, string> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// WHY THIS FUNCTION READS AND WRITES THE ROW ITSELF (7 October 2026)
//
// It used to analyse whatever text the browser sent and hand the summary
// back, and the browser then upserted ai_insights itself, under policies that
// let an item's owner write any insight onto their own items. So an owner
// could skip this function and post an "AI analysis" of their own choosing,
// which every visitor of a public prompt reads as Querino's. Now this function
// reads the item, checks the caller may analyse it (its owner or an admin,
// the rule the insert policy had) before anything is charged, analyses what
// the item really says, and upserts the row with the service role; the
// browser has no INSERT or UPDATE on the table any more (20261007130000).
// The item's id arrives as item_id, or as metadata.id from the site published
// before this change.

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user_id = await getCallerUserId(req);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new Response(
        JSON.stringify({ error: "Request body must be a JSON object" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const { item_type } = body ?? {};
    const itemId =
      typeof body.item_id === "string"
        ? body.item_id
        : typeof body.metadata?.id === "string"
          ? body.metadata.id
          : "";

    if (
      !item_type ||
      !["prompt", "skill", "workflow", "prompt_kit"].includes(item_type)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Valid item_type is required (prompt, skill, workflow, prompt_kit)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!UUID_RE.test(itemId)) {
      return new Response(JSON.stringify({ error: "item_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const [owner, isAdmin] = await Promise.all([
      admin.rpc("is_item_owner", {
        p_item_type: item_type,
        p_item_id: itemId,
        p_user_id: user_id,
      }),
      admin.rpc("is_admin", { _user_id: user_id }),
    ]);
    if (owner.error || isAdmin.error) {
      console.error(
        "[ai-insights] permission lookup failed:",
        owner.error ?? isAdmin.error,
      );
      return new Response(
        JSON.stringify({ error: "Could not check who may analyse this" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (owner.data !== true && isAdmin.data !== true) {
      return new Response(
        JSON.stringify({ error: "Only the owner can generate insights" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: item, error: itemError } = await admin
      .from(ITEM_TABLES[item_type as ItemType])
      .select("title, description, content, tags")
      .eq("id", itemId)
      .maybeSingle();
    if (itemError) {
      console.error("[ai-insights] item read failed:", itemError);
      return new Response(
        JSON.stringify({ error: "Could not read the item" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const { title, description, content, tags } = (item ?? {}) as {
      title?: string | null;
      description?: string | null;
      content?: string | null;
      tags?: unknown;
    };
    const contentStr = (content ?? "").toString().trim();
    if (!contentStr) {
      return new Response(
        JSON.stringify({ error: "There is no content to analyse" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await assertCredits(user_id);

    // The content was always cut here; since 2026-09-16 the other fields are
    // too, because the credit gate only checks for a balance above zero.
    const truncated = contentStr.slice(0, 12000);
    const cappedTags = Array.isArray(tags)
      ? tags
          .slice(0, 20)
          .map((t: unknown) => capText(t, 40))
          .filter((t) => t.length > 0)
      : [];
    const tagsLine =
      cappedTags.length > 0 ? `Tags: ${cappedTags.join(", ")}\n` : "";
    const userMessage = `Title: ${capText(title, 200) || "(untitled)"}
Description: ${capText(description, 2000) || "(none)"}
${tagsLine}
---
Content:
${truncated}`;

    const result = await callLovableAI({
      user_id,
      feature: `ai-insights-${item_type}`,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[item_type as ItemType] },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
      metadata: {
        artifact: item_type,
        item_id: itemId,
        content_length: contentStr.length,
      },
    });

    const summary = (result.content ?? "").trim();
    if (!summary) {
      return new Response(
        JSON.stringify({ error: "Model returned empty response" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: insight, error: saveError } = await admin
      .from("ai_insights")
      .upsert(
        {
          item_type,
          item_id: itemId,
          summary,
          tags: [],
          recommendations: [],
          quality: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "item_type,item_id" },
      )
      .select()
      .single();
    if (saveError) {
      // The call is paid for; say so rather than pretend nothing happened.
      console.error("[ai-insights] saving the insight failed:", saveError);
      return new Response(
        JSON.stringify({ error: "The analysis ran but could not be saved" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        summary,
        tags: [],
        recommendations: [],
        quality: null,
        insight,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof CreditsExhaustedError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error instanceof RateLimitedError) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, please retry shortly." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (error instanceof GatewayError) {
      console.error(
        "[ai-insights] Gateway error:",
        error.status,
        error.message,
      );
      return new Response(
        JSON.stringify({ error: "Upstream AI gateway error" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    if (
      message === "Missing Authorization bearer token" ||
      message === "Invalid auth token" ||
      message === "Empty bearer token"
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("[ai-insights] Error:", message);
    return new Response(
      JSON.stringify({ error: "Failed to generate insights" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
