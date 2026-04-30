// Edge Function: backfill-embeddings (admin-only)
// Iterates over prompts/skills/workflows/prompt_kits where embedding IS NULL,
// generates embeddings via OpenAI text-embedding-3-small (1536 dim) and
// writes them via the update_embedding RPC. Returns per-type counts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCallerUserId, getServiceClient } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_INPUT_CHARS = 8000;

type ItemType = "prompt" | "skill" | "workflow" | "prompt_kit";

interface TableConfig {
  table: string;
  itemType: ItemType;
  textFields: string[]; // concatenated for embedding input
}

const TABLES: TableConfig[] = [
  { table: "prompts", itemType: "prompt", textFields: ["title", "description", "content"] },
  { table: "skills", itemType: "skill", textFields: ["title", "description", "content"] },
  { table: "workflows", itemType: "workflow", textFields: ["title", "description", "content"] },
  { table: "prompt_kits", itemType: "prompt_kit", textFields: ["title", "description", "content"] },
];

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

    const sb = getServiceClient();

    // 2. Admin check
    const { data: isAdminData, error: adminErr } = await sb.rpc("is_admin", { _user_id: userId });
    if (adminErr || !isAdminData) {
      return json({ error: "Forbidden — admin only" }, 403);
    }

    // 3. Parse options
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;
    const maxItems = Math.min(Number(body?.maxItems) || 200, 500);
    const onlyType = body?.itemType as ItemType | undefined;

    const tablesToRun = onlyType ? TABLES.filter((t) => t.itemType === onlyType) : TABLES;

    // 4. Count missing per table
    const counts: Record<string, { missing: number }> = {};
    for (const cfg of TABLES) {
      const { count } = await sb
        .from(cfg.table)
        .select("id", { count: "exact", head: true })
        .is("embedding", null);
      counts[cfg.itemType] = { missing: count ?? 0 };
    }

    if (dryRun) {
      return json({ dryRun: true, counts }, 200);
    }

    // 5. OpenAI key
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return json({ error: "OPENAI_API_KEY not configured" }, 500);
    }

    // 6. Process
    const results: Record<string, { processed: number; succeeded: number; failed: number; errors: string[] }> = {};
    let totalProcessed = 0;
    const errorsCap = 5;

    for (const cfg of tablesToRun) {
      const r = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };
      results[cfg.itemType] = r;

      const remaining = maxItems - totalProcessed;
      if (remaining <= 0) break;

      const selectCols = ["id", ...cfg.textFields].join(", ");
      const { data: rows, error: selErr } = await sb
        .from(cfg.table)
        .select(selectCols)
        .is("embedding", null)
        .limit(remaining);

      if (selErr) {
        r.errors.push(`select: ${selErr.message}`);
        continue;
      }

      for (const row of (rows ?? []) as Array<Record<string, unknown>>) {
        if (totalProcessed >= maxItems) break;
        r.processed++;
        totalProcessed++;

        const text = cfg.textFields
          .map((f) => (row[f] ? String(row[f]) : ""))
          .filter(Boolean)
          .join("\n\n")
          .slice(0, MAX_INPUT_CHARS);

        if (!text.trim()) {
          r.failed++;
          if (r.errors.length < errorsCap) r.errors.push(`${row.id}: empty text`);
          continue;
        }

        try {
          const oaResp = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
          });

          if (!oaResp.ok) {
            const errText = await oaResp.text().catch(() => "");
            r.failed++;
            if (r.errors.length < errorsCap) r.errors.push(`${row.id}: openai ${oaResp.status} ${errText.slice(0, 120)}`);
            continue;
          }

          const oaJson = await oaResp.json() as {
            data?: Array<{ embedding?: number[] }>;
            usage?: { prompt_tokens?: number; total_tokens?: number };
            model?: string;
          };

          const embedding = oaJson.data?.[0]?.embedding;
          if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
            r.failed++;
            if (r.errors.length < errorsCap) r.errors.push(`${row.id}: bad embedding length ${embedding?.length}`);
            continue;
          }

          const embeddingStr = `[${embedding.join(",")}]`;
          const { error: updErr } = await sb.rpc("update_embedding", {
            p_item_type: cfg.itemType,
            p_item_id: row.id,
            p_embedding: embeddingStr,
          });
          if (updErr) {
            r.failed++;
            if (r.errors.length < errorsCap) r.errors.push(`${row.id}: update_embedding ${updErr.message}`);
            continue;
          }

          // Token logging — best-effort
          try {
            const promptTokens = Number(oaJson.usage?.prompt_tokens ?? 0);
            const totalTokens = Number(oaJson.usage?.total_tokens ?? promptTokens);
            await sb.rpc("record_llm_usage", {
              p_user_id: userId,
              p_idempotency_key: crypto.randomUUID(),
              p_feature: "embedding-backfill",
              p_provider: "openai",
              p_model: oaJson.model || EMBEDDING_MODEL,
              p_prompt_tokens: promptTokens,
              p_completion_tokens: 0,
              p_total_tokens: totalTokens,
              p_metadata: { itemType: cfg.itemType, itemId: row.id, backfill: true },
            });
          } catch (_) { /* ignore */ }

          r.succeeded++;
        } catch (e) {
          r.failed++;
          if (r.errors.length < errorsCap) r.errors.push(`${row.id}: ${String(e).slice(0, 120)}`);
        }
      }
    }

    // 7. Recount remaining
    const remainingCounts: Record<string, number> = {};
    for (const cfg of TABLES) {
      const { count } = await sb
        .from(cfg.table)
        .select("id", { count: "exact", head: true })
        .is("embedding", null);
      remainingCounts[cfg.itemType] = count ?? 0;
    }

    return json({
      success: true,
      processed: totalProcessed,
      maxItems,
      results,
      remaining: remainingCounts,
    }, 200);
  } catch (e) {
    console.error("[backfill-embeddings] unhandled:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
