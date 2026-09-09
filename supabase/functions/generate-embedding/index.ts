// Edge Function: generate-embedding
// Replaces the n8n embedding webhook. Embeds text as text-embedding-3-small
// (1536 dim — matches existing vector(1536) columns) through whichever
// provider in _shared/embeddings.ts answers, optionally writes the embedding
// into the artefact table directly, and logs token usage.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeadersFor } from "../_shared/cors.ts";
import {
  assertCredits,
  CreditsExhaustedError,
  getCallerUserId,
  getServiceClient,
} from "../_shared/llm.ts";
import {
  createEmbedding,
  EMBEDDING_DIMENSIONS,
  type EmbeddingResult,
} from "../_shared/embeddings.ts";

// EMBEDDING_MODEL, EMBEDDING_DIMENSIONS and MAX_INPUT_CHARS now live in
// _shared/embeddings.ts, so the two functions that embed cannot disagree.

type ItemType = "prompt" | "skill" | "workflow" | "prompt_kit";
const VALID_TYPES: ItemType[] = ["prompt", "skill", "workflow", "prompt_kit"];

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (payload: unknown, status: number) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
      return json(
        {
          error: `Invalid itemType. Must be one of: ${VALID_TYPES.join(", ")}`,
        },
        400,
      );
    }
    if ((itemType && !itemId) || (!itemType && itemId)) {
      return json(
        { error: "itemType and itemId must be provided together" },
        400,
      );
    }

    // 3. Credit gate — usage is ledgered below, but without this check a
    // zero-balance user could loop the endpoint and drive OpenAI spend
    // indefinitely. Callers (semantic merge) fall back to keyword search.
    try {
      await assertCredits(userId);
    } catch (e) {
      if (e instanceof CreditsExhaustedError) {
        return json({ error: e.message, code: "credits_exhausted" }, 402);
      }
      throw e;
    }

    // 4. Turn it into a vector, whichever provider is answering today.
    //
    //    This used to call OpenAI directly. On 23 August the OpenAI balance hit
    //    zero and every call here returned 429, which the semantic-merge caller
    //    catches and turns into an empty list on purpose, so concept search on
    //    the website silently became keyword search. _shared/embeddings.ts
    //    tries each configured provider before giving up.
    let result: EmbeddingResult;
    try {
      result = await createEmbedding(text);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.error("[generate-embedding] no provider could answer:", detail);
      return json({ error: "Embedding provider error", details: detail }, 502);
    }

    const embedding = result.embedding;

    // 4. Token logging (best-effort — never block response)
    const promptTokens = result.promptTokens;
    const totalTokens = result.totalTokens;
    const sb = getServiceClient();

    try {
      const { error: logErr } = await sb.rpc("record_llm_usage", {
        p_user_id: userId,
        p_idempotency_key: crypto.randomUUID(),
        p_feature: "embedding",
        p_provider: result.provider,
        p_model: result.model,
        p_prompt_tokens: promptTokens,
        p_completion_tokens: 0,
        p_total_tokens: totalTokens,
        p_metadata: { itemType: itemType ?? null, itemId: itemId ?? null },
      });
      if (logErr)
        console.error("[generate-embedding] record_llm_usage error:", logErr);
    } catch (e) {
      console.error("[generate-embedding] usage logging threw:", e);
    }

    // 5. Optional: persist into the right artefact table.
    //    update_embedding() is SECURITY DEFINER with no ownership check and is
    //    no longer callable by `authenticated`, so the ownership check lives
    //    here: you may only rewrite the vector of your own artefact.
    let written = false;
    if (itemType && itemId) {
      const TABLES: Record<ItemType, string> = {
        prompt: "prompts",
        skill: "skills",
        workflow: "workflows",
        prompt_kit: "prompt_kits",
      };
      const { data: owner, error: ownErr } = await sb
        .from(TABLES[itemType])
        .select("author_id")
        .eq("id", itemId)
        .maybeSingle();

      if (ownErr) {
        console.error("[generate-embedding] ownership lookup failed:", ownErr);
        return json({ error: "Failed to verify ownership" }, 500);
      }
      if (!owner) {
        return json({ error: "Item not found" }, 404);
      }
      if (owner.author_id !== userId) {
        return json({ error: "Forbidden: you do not own this item" }, 403);
      }

      const embeddingStr = `[${embedding.join(",")}]`;
      const { error: updErr } = await sb.rpc("update_embedding", {
        p_item_type: itemType,
        p_item_id: itemId,
        p_embedding: embeddingStr,
      });
      if (updErr) {
        console.error("[generate-embedding] update_embedding error:", updErr);
        return json(
          {
            error: "Failed to persist embedding",
            details: updErr.message,
            embedding,
            dimensions: EMBEDDING_DIMENSIONS,
            written: false,
          },
          500,
        );
      }
      written = true;
    }

    return json(
      {
        embedding,
        dimensions: EMBEDDING_DIMENSIONS,
        model: result.model,
        tokens: totalTokens,
        written,
      },
      200,
    );
  } catch (e) {
    // The detail stays in the logs. It used to be returned to the caller, and
    // an unhandled error here carries provider messages and configuration
    // names that a caller has no business reading.
    console.error("[generate-embedding] unhandled:", e);
    return json({ error: "Internal error" }, 500);
  }
});
