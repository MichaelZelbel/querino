// Edge Function: generate-embedding
// Replaces the n8n embedding webhook. Calls OpenAI text-embedding-3-small
// (1536 dim — matches existing vector(1536) columns), optionally writes the
// embedding into the artefact table directly, and logs token usage.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCallerUserId, getServiceClient } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dim — DO NOT change without DB migration
const EMBEDDING_DIMENSIONS = 1536;
const MAX_INPUT_CHARS = 8000;

type ItemType = "prompt" | "skill" | "workflow" | "claw";
const VALID_TYPES: ItemType[] = ["prompt", "skill", "workflow", "claw"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth
    let userId: string;
    try {
      userId = await getCallerUserId(req);
    } catch (e) {
      return json({ error: "Unauthorized", details: String(e) }, 401);
    }

    // 2. Input
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text : "";
    const itemType = body?.itemType as ItemType | undefined;
    const itemId = body?.itemId as string | undefined;

    if (!text.trim()) {
      return json({ error: "Missing 'text'" }, 400);
    }
    if (itemType && !VALID_TYPES.includes(itemType)) {
      return json({ error: `Invalid itemType. Must be one of: ${VALID_TYPES.join(", ")}` }, 400);
    }
    if ((itemType && !itemId) || (!itemType && itemId)) {
      return json({ error: "itemType and itemId must be provided together" }, 400);
    }

    // 3. Call OpenAI
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return json({ error: "OPENAI_API_KEY not configured" }, 500);
    }

    const trimmed = text.slice(0, MAX_INPUT_CHARS);
    const oaResp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: trimmed,
      }),
    });

    if (!oaResp.ok) {
      const errText = await oaResp.text().catch(() => "");
      console.error("[generate-embedding] OpenAI error:", oaResp.status, errText);
      return json({ error: "Embedding provider error", status: oaResp.status, details: errText }, 502);
    }

    const oaJson = await oaResp.json() as {
      data?: Array<{ embedding?: number[] }>;
      usage?: { prompt_tokens?: number; total_tokens?: number };
      model?: string;
    };

    const embedding = oaJson.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      return json({ error: "Invalid embedding response", got: embedding?.length ?? null }, 502);
    }

    // 4. Token logging (best-effort — never block response)
    const promptTokens = Number(oaJson.usage?.prompt_tokens ?? 0);
    const totalTokens = Number(oaJson.usage?.total_tokens ?? promptTokens);
    const sb = getServiceClient();

    try {
      const { error: logErr } = await sb.rpc("record_llm_usage", {
        p_user_id: userId,
        p_idempotency_key: crypto.randomUUID(),
        p_feature: "embedding",
        p_provider: "openai",
        p_model: oaJson.model || EMBEDDING_MODEL,
        p_prompt_tokens: promptTokens,
        p_completion_tokens: 0,
        p_total_tokens: totalTokens,
        p_metadata: { itemType: itemType ?? null, itemId: itemId ?? null },
      });
      if (logErr) console.error("[generate-embedding] record_llm_usage error:", logErr);
    } catch (e) {
      console.error("[generate-embedding] usage logging threw:", e);
    }

    // 5. Optional: persist into the right artefact table
    let written = false;
    if (itemType && itemId) {
      const embeddingStr = `[${embedding.join(",")}]`;
      const { error: updErr } = await sb.rpc("update_embedding", {
        p_item_type: itemType,
        p_item_id: itemId,
        p_embedding: embeddingStr,
      });
      if (updErr) {
        console.error("[generate-embedding] update_embedding error:", updErr);
        return json({
          error: "Failed to persist embedding",
          details: updErr.message,
          embedding,
          dimensions: EMBEDDING_DIMENSIONS,
          written: false,
        }, 500);
      }
      written = true;
    }

    return json({
      embedding,
      dimensions: EMBEDDING_DIMENSIONS,
      model: oaJson.model || EMBEDDING_MODEL,
      tokens: totalTokens,
      written,
    }, 200);
  } catch (e) {
    console.error("[generate-embedding] unhandled:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
