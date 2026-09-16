// Edge Function: backfill-embeddings
//
// Iterates over prompts/skills/workflows/prompt_kits where embedding IS NULL,
// generates embeddings via OpenAI text-embedding-3-small (1536 dim) and
// writes them via the update_embedding RPC. Returns per-type counts.
//
// WHY THIS RUNS ON A SCHEDULE NOW (23 August 2026)
//
// Nothing in this project ever generated an embedding when an artifact was
// written. Not the web hooks, not create_skill in the MCP server, not a
// trigger. The only two ways a row ever got one were an admin pressing the
// button on the Admin page and the Refresh button on an artifact.
//
// Every semantic RPC filters `published = true AND embedding IS NOT NULL`, so
// a published artifact with no embedding is simply absent from concept search
// and nothing anywhere says so. When this comment was written that was 40 of
// the 62 rows with no embedding, 38 of them public prompts.
//
// So the guard is no longer "an admin remembered". A BEFORE UPDATE trigger
// clears the embedding whenever title, description or content changes, new
// rows start out NULL, and pg_cron calls this function every two minutes to
// fill whatever is NULL. That catches every write path there is, including
// ones nobody has written yet, because the condition lives in the database
// rather than in each caller.
//
// Which is why this is no longer admin-only: pg_cron reaches it with
// X-Internal-Key and no bearer token at all.
//
// A ROW THAT CANNOT BE EMBEDDED IS RETIRED (16 September 2026)
//
// A row the provider refuses for its own text (empty, or too many tokens) used
// to be reclaimed every two minutes, for ever. Each such failure now costs the
// row one of MAX_EMBEDDING_ATTEMPTS, recorded with the error by
// record_embedding_failure, and a row that has used them all is no longer
// selected. A failure that says nothing about the text (no credit, a rate
// limit, a timeout) is recorded but costs no attempt, so an outage cannot
// retire the backlog. Editing the text resets the count.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getServiceClient } from "../_shared/llm.ts";
import {
  isMachineCaller,
  requireMachineOrAdmin,
} from "../_shared/internalAuth.ts";
import {
  createEmbedding,
  embeddableText,
  embeddingProviders,
  NoEmbeddingProviderError,
} from "../_shared/embeddings.ts";

/** After this many failures that blame the text, a row is left alone. */
const MAX_EMBEDDING_ATTEMPTS = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ItemType = "prompt" | "skill" | "workflow" | "prompt_kit";

interface TableConfig {
  table: string;
  itemType: ItemType;
  textFields: string[]; // concatenated for embedding input
  /** The flag the semantic RPCs filter on. prompts spells it differently. */
  publishedColumn: string;
}

const TABLES: TableConfig[] = [
  {
    table: "prompts",
    itemType: "prompt",
    textFields: ["title", "description", "content"],
    publishedColumn: "is_public",
  },
  {
    table: "skills",
    itemType: "skill",
    textFields: ["title", "description", "content"],
    publishedColumn: "published",
  },
  {
    table: "workflows",
    itemType: "workflow",
    textFields: ["title", "description", "content"],
    publishedColumn: "published",
  },
  {
    table: "prompt_kits",
    itemType: "prompt_kit",
    textFields: ["title", "description", "content"],
    publishedColumn: "published",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth: pg_cron with the shared secret, or a signed-in admin pressing
    //    the button. verify_jwt is false for this function because the job
    //    sends no bearer token, so this guard is the only guard.
    const denied = await requireMachineOrAdmin(req, corsHeaders);
    if (denied) return denied;

    const sb = getServiceClient();

    // 2. Who pays, if anyone.
    //
    //    record_llm_usage debits the caller's AI allowance. The scheduled job
    //    has no caller to debit, and charging an author's credits for making
    //    their own published artifact findable would be wrong anyway: this is
    //    platform plumbing, not a feature they asked for. So the cron path
    //    records nothing.
    //
    //    A human admin pressing the button is still charged, because that is
    //    what it did before and they chose to spend it.
    const chargeTo = (await isMachineCaller(req))
      ? null
      : await adminUserId(req);

    // 3. Parse options
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;
    const maxItems = Math.min(Number(body?.maxItems) || 200, 500);
    const onlyType = body?.itemType as ItemType | undefined;

    const tablesToRun = onlyType
      ? TABLES.filter((t) => t.itemType === onlyType)
      : TABLES;

    // 4. Count missing per table
    const counts: Record<string, { missing: number; retired: number }> = {};
    for (const cfg of TABLES) {
      const { count } = await sb
        .from(cfg.table)
        .select("id", { count: "exact", head: true })
        .is("embedding", null);
      const { count: retired } = await sb
        .from(cfg.table)
        .select("id", { count: "exact", head: true })
        .is("embedding", null)
        .gte("embedding_attempts", MAX_EMBEDDING_ATTEMPTS);
      counts[cfg.itemType] = { missing: count ?? 0, retired: retired ?? 0 };
    }

    if (dryRun) {
      return json({ dryRun: true, counts }, 200);
    }

    // 5. Somewhere to send the text.
    //    Named in the 500 so an empty balance on one account cannot read the
    //    same as a missing key; see _shared/embeddings.ts.
    if (embeddingProviders().length === 0) {
      return json(
        {
          error:
            "No embedding provider configured (OPENAI_API_KEY or OPENROUTER_API_KEY)",
        },
        500,
      );
    }

    // 6. Process
    //
    //    Two runs can overlap: pg_cron fires every two minutes and the admin
    //    button fires whenever it is pressed. Both used to select the same
    //    NULL rows in the same order and pay for every embedding twice.
    //
    //    There is no lock RPC and no claim column, and a migration is out of
    //    scope here, so the claim is a conditional UPDATE on updated_at, a
    //    column every one of these tables already bumps on any update
    //    (update_embedding included, through the updated_at triggers). A row
    //    is ours only if our UPDATE ... WHERE embedding IS NULL AND
    //    updated_at < now() - lease actually changed it. Under Postgres's
    //    default READ COMMITTED the second runner's UPDATE waits on the row
    //    lock, re-checks its WHERE against the committed row, sees the fresh
    //    updated_at and matches nothing. The lease is longer than one
    //    embedding call and shorter than the cron interval, so a row that was
    //    just written waits at most one extra tick. Touching updated_at wakes
    //    no sync: the Menerio and GitHub triggers only compare text and
    //    metadata columns, and the embedding trigger only nulls on text
    //    changes.
    const CLAIM_LEASE_MS = 90_000;
    const claimCutoff = new Date(Date.now() - CLAIM_LEASE_MS).toISOString();
    const claimable = `updated_at.is.null,updated_at.lt.${claimCutoff}`;

    const results: Record<
      string,
      {
        processed: number;
        succeeded: number;
        failed: number;
        /** Claimed by an overlapping run, or written too recently to claim. */
        skipped: number;
        errors: string[];
      }
    > = {};
    // Which providers actually answered. Reported so a failover to the backup
    // account shows up here rather than only on the bill.
    const providersUsed = new Set<string>();
    let totalProcessed = 0;
    const errorsCap = 5;

    for (const cfg of tablesToRun) {
      const r = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[],
      };
      results[cfg.itemType] = r;

      const remaining = maxItems - totalProcessed;
      if (remaining <= 0) break;

      const selectCols = ["id", ...cfg.textFields].join(", ");
      // Published first. Only a published row is reachable by semantic search,
      // so if a run cannot finish the backlog, the half it does finish should
      // be the half anyone can actually miss. Only rows old enough to claim,
      // so a slot is not spent on a row another run is embedding right now.
      const { data: rows, error: selErr } = await sb
        .from(cfg.table)
        .select(selectCols)
        .is("embedding", null)
        .lt("embedding_attempts", MAX_EMBEDDING_ATTEMPTS)
        .or(claimable)
        .order(cfg.publishedColumn, { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(remaining);

      if (selErr) {
        r.errors.push(`select: ${selErr.message}`);
        continue;
      }

      for (const row of (rows ?? []) as Array<Record<string, unknown>>) {
        if (totalProcessed >= maxItems) break;

        // The claim. Zero rows back means another run got here first, or
        // the row was rewritten since we selected it; either way not ours.
        const { data: claimed, error: claimErr } = await sb
          .from(cfg.table)
          .update({ updated_at: new Date().toISOString() })
          .eq("id", row.id)
          .is("embedding", null)
          .lt("embedding_attempts", MAX_EMBEDDING_ATTEMPTS)
          .or(claimable)
          .select("id");
        if (claimErr) {
          r.failed++;
          if (r.errors.length < errorsCap)
            r.errors.push(`${row.id}: claim ${claimErr.message}`);
          continue;
        }
        if (!claimed || claimed.length === 0) {
          r.skipped++;
          continue;
        }

        r.processed++;
        totalProcessed++;

        const text = embeddableText(row, cfg.textFields);

        if (!text.trim()) {
          r.failed++;
          if (r.errors.length < errorsCap)
            r.errors.push(`${row.id}: empty text`);
          await recordFailure(sb, cfg.itemType, row.id, "empty text", true);
          continue;
        }

        try {
          const result = await createEmbedding(text);
          const { embedding } = result;
          providersUsed.add(result.provider);

          const embeddingStr = `[${embedding.join(",")}]`;
          const { error: updErr } = await sb.rpc("update_embedding", {
            p_item_type: cfg.itemType,
            p_item_id: row.id,
            p_embedding: embeddingStr,
          });
          if (updErr) {
            r.failed++;
            if (r.errors.length < errorsCap)
              r.errors.push(`${row.id}: update_embedding ${updErr.message}`);
            await recordFailure(
              sb,
              cfg.itemType,
              row.id,
              `update_embedding: ${updErr.message}`,
              false,
            );
            continue;
          }

          // Token logging — best-effort, and only for a human who chose this.
          try {
            if (!chargeTo) throw new Error("no one to charge");
            const promptTokens = result.promptTokens;
            const totalTokens = result.totalTokens;
            await sb.rpc("record_llm_usage", {
              p_user_id: chargeTo,
              p_idempotency_key: crypto.randomUUID(),
              p_feature: "embedding-backfill",
              p_provider: result.provider,
              p_model: result.model,
              p_prompt_tokens: promptTokens,
              p_completion_tokens: 0,
              p_total_tokens: totalTokens,
              p_metadata: {
                itemType: cfg.itemType,
                itemId: row.id,
                backfill: true,
              },
            });
          } catch (_) {
            /* ignore */
          }

          r.succeeded++;
        } catch (e) {
          r.failed++;
          if (r.errors.length < errorsCap)
            r.errors.push(`${row.id}: ${String(e).slice(0, 120)}`);
          await recordFailure(
            sb,
            cfg.itemType,
            row.id,
            String(e),
            e instanceof NoEmbeddingProviderError && e.rowFault,
          );
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

    return json(
      {
        success: true,
        processed: totalProcessed,
        maxItems,
        providers: [...providersUsed],
        results,
        remaining: remainingCounts,
      },
      200,
    );
  } catch (e) {
    console.error("[backfill-embeddings] unhandled:", e);
    return json({ error: "Internal error", details: String(e) }, 500);
  }
});

/**
 * Write a failure onto the row. Best-effort: if this write fails the row is
 * simply tried again next tick, which is what happened before it existed.
 */
async function recordFailure(
  sb: ReturnType<typeof getServiceClient>,
  itemType: ItemType,
  itemId: unknown,
  message: string,
  counts: boolean,
): Promise<void> {
  const { error } = await sb.rpc("record_embedding_failure", {
    p_item_type: itemType,
    p_item_id: itemId,
    p_error: message.slice(0, 500),
    p_counts: counts,
  });
  if (error) {
    console.error(
      `[backfill-embeddings] record_embedding_failure ${itemType} ${itemId}:`,
      error,
    );
  }
}

/**
 * The user id behind a bearer token, or null if there is not one.
 *
 * requireMachineOrAdmin has already decided this caller may proceed; this only
 * works out who to bill. It never decides access, so a null here means "nobody
 * to charge", never "let them in".
 */
async function adminUserId(req: Request): Promise<string | null> {
  const token = (
    req.headers.get("Authorization") ??
    req.headers.get("authorization") ??
    ""
  )
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return null;

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
