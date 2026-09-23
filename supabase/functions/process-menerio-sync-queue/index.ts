// Menerio sync queue worker.
//
// Triggered by pg_cron every 2 minutes (every minute until 2026-09-11). Machine-only: it opens a service-role
// client, sends users' artifacts to their Menerio hosts with their stored API
// keys, and deletes completed queue rows (see _shared/internalAuth.ts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireMachineCaller } from "../_shared/internalAuth.ts";
import { publicUrlFor, tableFor } from "../_shared/artifactRoutes.ts";
import { assertMenerioBaseUrl } from "../_shared/menerioUrl.ts";
import { readMenerioApiKey } from "../_shared/menerioKey.ts";

// A Menerio that does not answer within this window fails the row, which
// the queue retries (see fail_menerio_sync_queue_row); without it a hung
// connection held the whole tick.
const MENERIO_TIMEOUT_MS = 15_000;

// The platform kills a function at 150 s, and ten rows that each wait out the
// 15 s timeout (plus the reads around it) can come close. A killed tick left
// its rows in 'processing', and the stale re-claim then counted a failure for
// each one that was never tried. After this many milliseconds no new row is
// started; the rest go back to 'pending' or 'delete_pending' with their
// retry_count as it was.
const TICK_DEADLINE_MS = 100_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // The tick's clock starts with the request, before anything is claimed.
  const startedAt = Date.now();

  // Machine-only. Before this check, anyone could force a sync on demand.
  const denied = await requireMachineCaller(req, corsHeaders);
  if (denied) return denied;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 1. Claim up to 10 rows in ONE statement (finding M4).
    //
    // This used to be a SELECT followed by a separate UPDATE, and the job runs
    // on a fixed schedule. A slow tick left a gap in which the next tick selected the
    // same rows and sent the same artifact to Menerio a second time.
    // claim_menerio_sync_queue does the select and the status change together
    // under FOR UPDATE SKIP LOCKED, so an overlapping tick skips them and takes
    // the next ten instead. It also re-claims rows abandoned in 'processing' by
    // a tick that died, which the old SELECT could never see again.
    const { data: queue, error: claimErr } = await adminClient.rpc(
      "claim_menerio_sync_queue",
      { batch_size: 10 },
    );

    if (claimErr) {
      console.error("claiming the queue failed:", claimErr.message);
      return json({ error: claimErr.message }, 500);
    }
    if (!queue || queue.length === 0) {
      return json({ processed: 0 });
    }

    let processed = 0;
    let failed = 0;
    let released = 0;

    // 2. Process each claimed entry
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (Date.now() - startedAt > TICK_DEADLINE_MS) {
        const rest = queue.slice(i);
        await releaseUnstarted(adminClient, rest);
        released = rest.length;
        console.warn(
          `Tick deadline reached; released ${rest.length} unstarted row(s)`,
        );
        break;
      }
      try {
        // Check the user has an active menerio integration. A read error is
        // thrown, not treated as "no integration": until 2026-09-16 a
        // transient database failure here marked the row completed with
        // "skipped", and the artifact was never sent. Thrown, it lands in
        // failed, and claim_menerio_sync_queue hands it back after a backoff
        // of 1, 2, 4 and 8 minutes, until it has failed five times (the fifth
        // failure is the last; its 16-minute wait is never used). Until
        // 2026-09-23 the claim never looked at failed rows, so "gets another
        // turn" was only true on paper.
        const { data: integration, error: integrationErr } = await adminClient
          .from("menerio_integration")
          .select("*")
          .eq("user_id", item.user_id)
          .eq("is_active", true)
          .maybeSingle();

        if (integrationErr) {
          throw new Error(
            `reading menerio_integration: ${integrationErr.message}`,
          );
        }

        if (!integration) {
          await markCompleted(
            adminClient,
            item.id,
            "skipped: no active integration",
          );
          processed++;
          continue;
        }

        // auto_sync governs only what the database queued on its own when an
        // artifact changed. A row the user queued with the sync button
        // (source 'manual') and a delete marker for an artifact that was
        // already in Menerio are sent whatever auto_sync says; until
        // 2026-09-23 both were skipped when auto_sync was off, so the bulk
        // sync button did nothing for exactly the users who sync by hand.
        const autoQueuedSync =
          item.source === "trigger" && item.status !== "delete_pending";
        if (autoQueuedSync && integration.auto_sync !== true) {
          await markCompleted(
            adminClient,
            item.id,
            "skipped: auto-sync is off",
          );
          processed++;
          continue;
        }

        // Check if artifact_type is in sync_artifact_types
        if (!integration.sync_artifact_types?.includes(item.artifact_type)) {
          await markCompleted(
            adminClient,
            item.id,
            "skipped: artifact type not in sync list",
          );
          processed++;
          continue;
        }

        // The base URL column is user-writable through PostgREST, so it is
        // checked against the one Menerio host before any request carries
        // this user's API key to it (see _shared/menerioUrl.ts).
        let menerioBase: string;
        try {
          menerioBase = assertMenerioBaseUrl(integration.menerio_base_url);
        } catch (urlErr) {
          console.warn(
            `menerio_integration ${integration.id}: ${urlErr instanceof Error ? urlErr.message : urlErr}`,
          );
          throw new Error("The Menerio address on this account is not allowed");
        }

        // The column is blank since the key moved into Vault; a failed read
        // throws, and the row gets another turn.
        integration.menerio_api_key = await readMenerioApiKey(
          adminClient,
          item.user_id,
        );

        if (item.status === "delete_pending") {
          // Handle delete: send "deleted" update to Menerio
          await handleDelete(adminClient, integration, menerioBase, item);
        } else {
          // Handle sync: render and send to Menerio
          await handleSync(adminClient, integration, menerioBase, item);
        }

        await adminClient
          .from("menerio_sync_queue")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        processed++;
      } catch (err) {
        // An artifact deleted between queueing and this tick has nothing left
        // to send; its own delete trigger queues the delete marker. Retrying
        // it five times only filled the log.
        if (err instanceof ArtifactGone) {
          await markCompleted(adminClient, item.id, `skipped: ${err.message}`);
          processed++;
          continue;
        }
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        // One statement counts the failure and sets the backoff, and keeps a
        // delete a delete (status delete_failed) for the next claim.
        const { error: failErr } = await callRpc(
          adminClient,
          "fail_menerio_sync_queue_row",
          { p_id: item.id, p_error: errMsg },
        );
        if (failErr) {
          console.error(
            `recording the failure of queue row ${item.id} failed:`,
            failErr.message,
          );
        }
        failed++;
      }
    }

    // 3. Clean up completed entries older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await adminClient
      .from("menerio_sync_queue")
      .delete()
      .eq("status", "completed")
      .lt("processed_at", cutoff);

    return json({ processed, failed, released, total: queue.length });
  } catch (err) {
    console.error("process-menerio-sync-queue error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});

// Thrown by handleSync when the row names an artifact that no longer exists.
class ArtifactGone extends Error {
  constructor(artifactId: string) {
    super(`artifact ${artifactId} no longer exists`);
    this.name = "ArtifactGone";
  }
}

// The service client has no Database type, so supabase-js types every rpc
// argument object as `undefined`; this says what the call really takes. The
// client is typed loosely for the reason given in _shared/menerioKey.ts.
interface RpcClient {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ error: { message: string } | null }>;
}

async function callRpc(
  client: unknown,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ error: { message: string } | null }> {
  // Called as a method, so supabase-js keeps its `this`.
  return await (client as RpcClient).rpc(fn, args);
}

// The service client is created without the generated Database type and the
// table name is chosen at run time, so supabase-js resolves the row to `never`
// and every column read is a type error. All four artifact tables carry the
// two columns this worker decides on, so it names them once.
interface SyncableArtifact {
  id: string;
  author_id: string;
  [column: string]: unknown;
}

async function handleSync(
  adminClient: ReturnType<typeof createClient>,
  integration: any,
  menerioBase: string,
  item: any,
) {
  const tableName = tableFor(item.artifact_type);

  const { data, error } = await adminClient
    .from(tableName)
    .select("*")
    .eq("id", item.artifact_id)
    .maybeSingle();

  const artifact = data as SyncableArtifact | null;

  // A read error is retried; only a clean "no such row" means the artifact is
  // gone.
  if (error) {
    throw new Error(
      `reading ${tableName} ${item.artifact_id}: ${error.message}`,
    );
  }
  if (!artifact) {
    throw new ArtifactGone(item.artifact_id);
  }

  // The queue row names an artifact by id and the insert policy used to check
  // only that user_id was the caller's own, so anyone could queue anyone
  // else's private artifact into their own Menerio. The policy now checks
  // ownership too (migration 20260908120300), and this is the second lock on
  // the same door: a row that names someone else's artifact is never sent.
  if (artifact.author_id !== item.user_id) {
    throw new Error(
      `Artifact ${item.artifact_id} does not belong to the user who queued it`,
    );
  }

  const notePayload = buildNotePayload(item.artifact_type, artifact);

  const menerioUrl = `${menerioBase}/receive-note`;
  const res = await fetch(menerioUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": integration.menerio_api_key,
    },
    body: JSON.stringify(notePayload),
    signal: AbortSignal.timeout(MENERIO_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Menerio returned ${res.status}: ${errText}`);
  }

  const menerioData = await res.json();

  // Update artifact sync fields
  await adminClient
    .from(tableName)
    .update({
      menerio_synced: true,
      menerio_note_id: menerioData.note_id || null,
      menerio_synced_at: new Date().toISOString(),
    })
    .eq("id", item.artifact_id);

  // Update integration last_sync_at
  await adminClient
    .from("menerio_integration")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", integration.id);
}

async function handleDelete(
  adminClient: ReturnType<typeof createClient>,
  integration: any,
  menerioBase: string,
  item: any,
) {
  // Send a "deleted" marker to Menerio
  const notePayload = {
    source_id: item.artifact_id,
    title: `[Gelöscht] ${item.artifact_type}`,
    entity_type: item.artifact_type,
    tags: [item.artifact_type, "gelöscht"],
    related: [],
    structured_fields: {
      artifact_type: item.artifact_type,
      deleted: true,
    },
    source_url: "",
    body: "[Gelöscht] Dieses Artefakt wurde in Querino gelöscht.",
  };

  const menerioUrl = `${menerioBase}/receive-note`;
  const res = await fetch(menerioUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": integration.menerio_api_key,
    },
    body: JSON.stringify(notePayload),
    signal: AbortSignal.timeout(MENERIO_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Menerio delete sync returned ${res.status}: ${errText}`);
  }

  await res.json();
}

function buildNotePayload(artifactType: string, artifact: any) {
  const tags = [
    artifactType,
    ...(artifact.tags || []),
    ...(artifact.category ? [artifact.category] : []),
  ].filter(Boolean);

  const isPublic =
    artifactType === "prompt" ? artifact.is_public : artifact.published;

  const structuredFields: Record<string, unknown> = {
    artifact_type: artifactType,
    title: artifact.title,
    category: artifact.category || null,
    slug: artifact.slug || null,
    is_public: !!isPublic,
    rating_avg: artifact.rating_avg || 0,
    rating_count: artifact.rating_count || 0,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
  };

  if (artifactType === "workflow" && artifact.json) {
    structuredFields.has_structured_data = true;
  }

  const body = buildBody(artifactType, artifact);
  const sourceUrl = publicUrlFor(artifactType, artifact.slug || artifact.id);

  return {
    source_id: artifact.id,
    title: artifact.title,
    entity_type: artifactType,
    tags,
    related: [],
    structured_fields: structuredFields,
    source_url: sourceUrl,
    body,
  };
}

function buildBody(type: string, a: Record<string, unknown>): string {
  const tagsStr = (a.tags as string[] | null)?.join(", ") || "—";
  const ratingStr = `${a.rating_avg || 0}/5 (${a.rating_count || 0} Bewertungen)`;
  const isPublic = type === "prompt" ? a.is_public : a.published;
  const publicLabel = isPublic ? "Ja" : "Nein";

  const lines: string[] = [`# ${a.title}`];

  switch (type) {
    case "prompt":
      lines.push(
        `\n**Typ:** Prompt`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Öffentlich:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `**Kopien:** ${a.copies_count || 0}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Prompt-Text\n\n${a.content || "—"}`,
      );
      break;
    case "skill":
      lines.push(
        `\n**Typ:** Skill`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Skill-Inhalt\n\n${a.content || "—"}`,
      );
      break;
    case "prompt_kit":
      lines.push(
        `\n**Typ:** Prompt Kit`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Prompt-Kit-Inhalt\n\n${a.content || "—"}`,
      );
      break;
    case "workflow":
      lines.push(
        `\n**Typ:** Workflow`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Workflow-Inhalt\n\n${a.content || "—"}`,
      );
      break;
  }

  return lines.join("\n");
}

// Rows a tick claimed but never started go back to where the claim took them
// from: the claim hands each one back as 'pending' or 'delete_pending', so
// that is the status it gets. retry_count is left alone, because nothing was
// tried. Only rows still in a processing state are touched, in case the stale
// window already gave one to another tick.
async function releaseUnstarted(
  client: unknown,
  items: Array<{ id: string; status: string }>,
) {
  // The same typing gap as callRpc: without the Database type supabase-js
  // types the update argument as `never`, so the chain is named here.
  const queueTable = () =>
    (client as ReturnType<typeof createClient>).from(
      "menerio_sync_queue",
    ) as unknown as {
      update(values: Record<string, unknown>): {
        in(
          column: string,
          values: string[],
        ): {
          eq(
            column: string,
            value: string,
          ): PromiseLike<{ error: { message: string } | null }>;
        };
      };
    };
  const groups: Array<[string, string, string[]]> = [
    [
      "pending",
      "processing",
      items.filter((r) => r.status !== "delete_pending").map((r) => r.id),
    ],
    [
      "delete_pending",
      "delete_processing",
      items.filter((r) => r.status === "delete_pending").map((r) => r.id),
    ],
  ];
  for (const [status, claimedAs, ids] of groups) {
    if (ids.length === 0) continue;
    const { error } = await queueTable()
      .update({ status, claimed_at: null })
      .in("id", ids)
      .eq("status", claimedAs);
    if (error) {
      console.error(
        `releasing ${ids.length} queue row(s) failed:`,
        error.message,
      );
    }
  }
}

async function markCompleted(client: unknown, id: string, note: string) {
  await (client as ReturnType<typeof createClient>)
    .from("menerio_sync_queue")
    .update({
      status: "completed",
      error_message: note,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
