// GitHub Auto-Sync Worker
// Processes pending entries in github_sync_queue and pushes/deletes files
// in the owner's GitHub repository (personal or team) via the Contents API.
//
// Triggered by pg_cron every 2 minutes. Machine-only: it opens a service-role
// client and pushes users' artifacts with their stored GitHub tokens, so the
// caller has to prove it is one of our jobs (see _shared/internalAuth.ts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireMachineCaller } from "../_shared/internalAuth.ts";
// Paths and file bodies are shared with the manual github-sync function, so
// the two can never disagree about which files are theirs.
import {
  type ArtifactType,
  buildPath,
  generateMarkdown,
  TABLE_FOR_TYPE,
} from "../_shared/githubSyncFormat.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

// The service client is created without the generated Database type, so
// supabase-js types every `.rpc` argument object as `undefined` and every
// result as `never`. That is a gap in the typing, not in the call, and casting
// at each site would spread the same cast over the file. One helper says what
// these calls really take and return.
function callRpc<T>(
  client: ReturnType<typeof createClient>,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data: T | null; error: { message: string } | null }> {
  // .bind(client), not a bare reference: supabase-js reads this.rest inside
  // rpc(), so calling it detached threw "Cannot read properties of undefined
  // (reading 'rest')" and every run of this job returned 500.
  const rpc = client.rpc.bind(client) as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: T | null; error: { message: string } | null }>;
  return rpc(fn, args);
}

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 3;
// GitHub that does not answer within this window fails the attempt, which the
// queue retries. Without it one hung connection held the whole tick until the
// platform killed the isolate, and every row it had claimed sat in
// 'processing' until the stale window let it go.
const GITHUB_TIMEOUT_MS = 15_000;
// The platform kills a function at 150 s. A batch of 25 jobs that each wait
// out a few 15 s timeouts can run far past that, and every row the killed
// tick still held came back later with an attempt counted that never
// happened. After this many milliseconds no new job is started; the rows not
// yet begun go back to 'pending' with their attempt handed back. One job
// already running can still take several GitHub calls, which is what the
// remaining 50 s are for.
const TICK_DEADLINE_MS = 100_000;

type Operation = "upsert" | "delete";

interface QueueRow {
  id: string;
  artifact_type: ArtifactType;
  artifact_id: string;
  operation: Operation;
  owner_user_id: string | null;
  team_id: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  created_at: string;
}

interface GitHubSettings {
  scope: "user" | "team";
  target_id: string;
  repo: string; // owner/repo
  branch: string;
  folder: string;
  token: string;
}

// ---------------- GitHub Contents API ----------------

function utf8ToBase64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

// The Contents API answers 409 or 422 when the `sha` sent with a PUT or a
// DELETE is not the blob currently at that path. The recorded SHA in
// github_sync_state goes stale whenever anything else touches the file: the
// manual github-sync, a push from the user's own machine, an earlier attempt
// of this same job that reached GitHub but died before recording. Callers
// catch this one error type, ask GitHub for the current SHA and try once
// more; every other failure is thrown as is.
class GitHubShaMismatch extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function ghGetFile(
  repo: string,
  path: string,
  branch: string,
  token: string,
): Promise<{ sha: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `GitHub GET ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  return { sha: data.sha };
}

async function ghPutFile(
  repo: string,
  path: string,
  branch: string,
  content: string,
  message: string,
  token: string,
  existingSha?: string,
): Promise<{ sha: string }> {
  const body: Record<string, unknown> = {
    message,
    content: utf8ToBase64(content),
    branch,
  };
  if (existingSha) body.sha = existingSha;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    },
  );
  if (res.status === 409 || res.status === 422) {
    throw new GitHubShaMismatch(
      res.status,
      `GitHub PUT ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  if (!res.ok) {
    throw new Error(
      `GitHub PUT ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  return { sha: data.content.sha };
}

/**
 * PUT with the given SHA, and if GitHub says that SHA is stale, once more
 * with whatever is there now. A path that vanished in between is created.
 */
async function ghPutFileFresh(
  repo: string,
  path: string,
  branch: string,
  content: string,
  message: string,
  token: string,
  existingSha?: string,
): Promise<{ sha: string }> {
  try {
    return await ghPutFile(
      repo,
      path,
      branch,
      content,
      message,
      token,
      existingSha,
    );
  } catch (e) {
    if (!(e instanceof GitHubShaMismatch)) throw e;
    console.warn(
      `Stale SHA for ${path} (${e.status}), refetching and retrying`,
    );
    const fresh = await ghGetFile(repo, path, branch, token);
    return await ghPutFile(
      repo,
      path,
      branch,
      content,
      message,
      token,
      fresh?.sha,
    );
  }
}

async function ghDeleteFile(
  repo: string,
  path: string,
  branch: string,
  sha: string,
  message: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, sha, branch }),
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    },
  );
  // Only a 2xx or a 404 means the file is gone. Until 2026-09-16 a 422 was
  // treated as success too, so a stale SHA "deleted" nothing, the state row
  // was removed anyway, and the file stayed in the repository for good.
  if (res.ok || res.status === 404) return;
  if (res.status === 409 || res.status === 422) {
    throw new GitHubShaMismatch(
      res.status,
      `GitHub DELETE ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  throw new Error(
    `GitHub DELETE ${path} failed: ${res.status} ${await res.text()}`,
  );
}

/**
 * DELETE with the given SHA, and if GitHub says that SHA is stale, once more
 * with the current one. A path that is already gone counts as deleted.
 */
async function ghDeleteFileFresh(
  repo: string,
  path: string,
  branch: string,
  sha: string,
  message: string,
  token: string,
): Promise<void> {
  try {
    await ghDeleteFile(repo, path, branch, sha, message, token);
  } catch (e) {
    if (!(e instanceof GitHubShaMismatch)) throw e;
    console.warn(
      `Stale SHA for ${path} (${e.status}), refetching and retrying`,
    );
    const fresh = await ghGetFile(repo, path, branch, token);
    if (!fresh) return;
    await ghDeleteFile(repo, path, branch, fresh.sha, message, token);
  }
}

// ---------------- Settings & token loading ----------------

// Returns null only when the settings really are missing: no team repository,
// sync switched off, no stored token. A failed read throws, so the row takes
// the normal retry path. Until 2026-09-23 every read error here was dropped,
// and a database or Vault hiccup marked the row 'skipped' with
// "github_sync_not_configured": that change never reached GitHub.
async function loadGitHubSettings(
  supabase: ReturnType<typeof createClient>,
  ownerUserId: string | null,
  teamId: string | null,
): Promise<GitHubSettings | null> {
  if (teamId) {
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("id, github_repo, github_branch, github_folder")
      .eq("id", teamId)
      .maybeSingle();
    if (teamErr) throw new Error(`reading team ${teamId}: ${teamErr.message}`);
    if (!team || !team.github_repo) return null;

    // Encrypted at rest in Vault; read_user_credential is the only way in and
    // it is service-role only (finding H3).
    const { data: teamToken, error: teamTokenErr } = await callRpc<string>(
      supabase,
      "read_user_credential",
      { _credential_type: "github_token", _team_id: teamId },
    );
    if (teamTokenErr) {
      throw new Error(
        `reading the GitHub token of team ${teamId}: ${teamTokenErr.message}`,
      );
    }
    if (!teamToken) return null;

    return {
      scope: "team",
      target_id: teamId,
      repo: team.github_repo,
      branch: team.github_branch || "main",
      folder: team.github_folder || "",
      token: teamToken as string,
    };
  }

  if (!ownerUserId) return null;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("github_sync_enabled, github_repo, github_branch, github_folder")
    .eq("id", ownerUserId)
    .maybeSingle();
  if (profileErr) {
    throw new Error(`reading profile ${ownerUserId}: ${profileErr.message}`);
  }
  if (!profile?.github_sync_enabled || !profile?.github_repo) return null;

  const { data: ownerToken, error: ownerTokenErr } = await callRpc<string>(
    supabase,
    "read_user_credential",
    { _credential_type: "github_token", _user_id: ownerUserId },
  );
  if (ownerTokenErr) {
    throw new Error(
      `reading the GitHub token of ${ownerUserId}: ${ownerTokenErr.message}`,
    );
  }
  if (!ownerToken) return null;

  return {
    scope: "user",
    target_id: ownerUserId,
    repo: profile.github_repo,
    branch: profile.github_branch || "main",
    folder: profile.github_folder || "",
    token: ownerToken as string,
  };
}

// ---------------- Artifact loading ----------------

// Returns null only when the artifact really is gone. A failed read throws:
// until 2026-09-23 the error was dropped, a transient database failure looked
// like "not found", and the cleanup branch deleted the user's file from GitHub.
async function loadArtifact(
  supabase: ReturnType<typeof createClient>,
  type: ArtifactType,
  id: string,
): Promise<Record<string, any> | null> {
  const table = TABLE_FOR_TYPE[type];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`reading ${table} ${id}: ${error.message}`);
  return (data as Record<string, any> | null) ?? null;
}

// The recorded file of one artifact in one target, or null when there is
// none. A failed read throws for the same reason as loadArtifact: "no record"
// and "could not read the record" lead to different writes on GitHub.
async function loadSyncState(
  supabase: ReturnType<typeof createClient>,
  job: QueueRow,
  settings: GitHubSettings,
): Promise<{ path: string | null; sha: string | null } | null> {
  const { data, error } = await supabase
    .from("github_sync_state")
    .select("path, sha")
    .eq("artifact_type", job.artifact_type)
    .eq("artifact_id", job.artifact_id)
    .eq("target_scope", settings.scope)
    .eq("target_id", settings.target_id)
    .maybeSingle();
  if (error) throw new Error(`reading github_sync_state: ${error.message}`);
  return (data as { path: string | null; sha: string | null } | null) ?? null;
}

// Rows claimed by a tick that ran out of time go back to 'pending' untouched:
// the claim counted an attempt for each, and none was made, so it is handed
// back. Only rows still in 'processing' are touched, in case the stale window
// already gave one to another tick.
async function releaseUnstarted(
  supabase: ReturnType<typeof createClient>,
  jobs: QueueRow[],
): Promise<void> {
  for (const job of jobs) {
    const { error } = await supabase
      .from("github_sync_queue")
      .update({
        status: "pending",
        attempts: Math.max(job.attempts - 1, 0),
        claimed_at: null,
      })
      .eq("id", job.id)
      .eq("status", "processing");
    if (error) {
      console.error(`releasing queue row ${job.id} failed:`, error.message);
    }
  }
}

// Queue order, and within the same instant an upsert before a delete. When an
// artifact moves to another owner, the trigger queues a delete for the old
// target and an upsert for the new one in the same statement, so both carry
// the same created_at. If the delete ran first and both targets use the same
// repository path, it removed the file before the upsert recorded it as the
// new owner's, and the "leave the file alone" check below never saw it.
function queueOrder(a: QueueRow, b: QueueRow): number {
  const byTime = Date.parse(a.created_at) - Date.parse(b.created_at);
  if (byTime !== 0) return byTime;
  if (a.operation !== b.operation) return a.operation === "upsert" ? -1 : 1;
  return 0;
}

// ---------------- Main worker ----------------

async function processQueue(
  supabase: ReturnType<typeof createClient>,
  startedAt: number,
): Promise<{
  processed: number;
  done: number;
  failed: number;
  skipped: number;
  released: number;
}> {
  // One SQL call claims the batch: it flips the rows to 'processing', bumps
  // attempts and stamps claimed_at inside a single statement with
  // FOR UPDATE SKIP LOCKED. The cron fires every 2 min (every 30 s until 2026-09-11) and a push to GitHub can
  // take longer than that, so before this two overlapping ticks could both
  // select the same 'pending' rows and push the same file twice. The claim
  // also picks up 'processing' rows whose claimed_at is older than the RPC's
  // stale window, which is how a job whose isolate died gets another turn
  // instead of sitting in 'processing' forever.
  const { data: claimed, error: fetchErr } = await callRpc<QueueRow[]>(
    supabase,
    "claim_github_sync_queue",
    { batch_size: BATCH_SIZE, max_attempts: MAX_ATTEMPTS },
  );

  if (fetchErr) throw new Error(`Failed to claim queue: ${fetchErr.message}`);
  if (!claimed || claimed.length === 0) {
    return { processed: 0, done: 0, failed: 0, skipped: 0, released: 0 };
  }

  // "Newest row wins" needs the rows in queue order, and the claim's
  // UPDATE ... RETURNING promises no order at all. Until 2026-09-23 an older
  // row could supersede a newer one and push stale content.
  //
  // The key includes the target (the team, or the user when there is no
  // team): when an artifact moves between owners the trigger queues a delete
  // for the old target and an upsert for the new one, and both have to run.
  const ordered = [...claimed].sort(queueOrder);
  const latestByArtifact = new Map<string, QueueRow>();
  const supersededIds: string[] = [];
  for (const row of ordered) {
    const target = row.team_id
      ? `team:${row.team_id}`
      : `user:${row.owner_user_id}`;
    const key = `${row.artifact_type}:${row.artifact_id}:${target}`;
    const existing = latestByArtifact.get(key);
    if (!existing) {
      latestByArtifact.set(key, row);
    } else {
      supersededIds.push(existing.id);
      latestByArtifact.set(key, row);
    }
  }
  if (supersededIds.length > 0) {
    await supabase
      .from("github_sync_queue")
      .update({ status: "done", last_error: "superseded" })
      .in("id", supersededIds);
  }

  let done = 0;
  let failed = 0;
  let skipped = 0;
  let released = 0;

  // The Map keeps the order in which each key was first seen, and a key's
  // newest row can be later than another key's; the jobs are sorted again so
  // they run in queue order with the upsert-before-delete tie-break.
  const jobs = [...latestByArtifact.values()].sort(queueOrder);

  // The claim already marked every row 'processing' and counted the attempt,
  // so there is nothing to write before starting on a job.
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (Date.now() - startedAt > TICK_DEADLINE_MS) {
      const rest = jobs.slice(i);
      await releaseUnstarted(supabase, rest);
      released = rest.length;
      console.warn(
        `Tick deadline reached; released ${rest.length} unstarted row(s)`,
      );
      break;
    }
    try {
      const settings = await loadGitHubSettings(
        supabase,
        job.owner_user_id,
        job.team_id,
      );

      if (!settings) {
        await supabase
          .from("github_sync_queue")
          .update({
            status: "skipped",
            last_error: "github_sync_not_configured",
          })
          .eq("id", job.id);
        skipped++;
        continue;
      }

      if (job.operation === "delete") {
        const state = await loadSyncState(supabase, job, settings);

        let path = state?.path ?? undefined;
        let sha = state?.sha ?? undefined;

        if (!path) {
          const slug = (job.payload?.slug as string | undefined) ?? null;
          if (slug) {
            path = buildPath(settings.folder, job.artifact_type, {
              slug,
              id: job.artifact_id,
            });
          }
        }

        // When an artifact moves between a user and a team (or two teams)
        // whose settings point at the same repository and folder, the old
        // path and the new one are the same file. If the new owner's upsert
        // already recorded it, deleting here would remove the artifact from
        // GitHub altogether, so the file is left alone.
        //
        // GitHub treats "Owner/Repo" and "owner/repo" as the same repository,
        // and the two settings pages store whatever was typed, so the
        // repository is compared case-insensitively here rather than with an
        // exact match in the query.
        if (path) {
          const { data: others, error: othersErr } = await supabase
            .from("github_sync_state")
            .select("target_scope, target_id, repo")
            .eq("artifact_type", job.artifact_type)
            .eq("artifact_id", job.artifact_id)
            .eq("branch", settings.branch)
            .eq("path", path);
          if (othersErr) {
            throw new Error(`reading github_sync_state: ${othersErr.message}`);
          }
          const repo = settings.repo.toLowerCase();
          const heldByAnotherOwner = (
            (others ?? []) as Array<{
              target_scope: string;
              target_id: string;
              repo: string | null;
            }>
          ).some(
            (o) =>
              (o.repo ?? "").toLowerCase() === repo &&
              (o.target_scope !== settings.scope ||
                o.target_id !== settings.target_id),
          );
          if (heldByAnotherOwner) path = undefined;
        }

        if (path) {
          if (!sha) {
            const existing = await ghGetFile(
              settings.repo,
              path,
              settings.branch,
              settings.token,
            );
            sha = existing?.sha;
          }
          if (sha) {
            await ghDeleteFileFresh(
              settings.repo,
              path,
              settings.branch,
              sha,
              `Querino: delete ${job.artifact_type} ${job.artifact_id}`,
              settings.token,
            );
          }
        }

        await supabase
          .from("github_sync_state")
          .delete()
          .eq("artifact_type", job.artifact_type)
          .eq("artifact_id", job.artifact_id)
          .eq("target_scope", settings.scope)
          .eq("target_id", settings.target_id);

        await supabase
          .from("github_sync_queue")
          .update({ status: "done", last_error: null })
          .eq("id", job.id);
        done++;
        continue;
      }

      const artifact = await loadArtifact(
        supabase,
        job.artifact_type,
        job.artifact_id,
      );
      if (!artifact) {
        const state = await loadSyncState(supabase, job, settings);
        if (state?.path && state?.sha) {
          await ghDeleteFileFresh(
            settings.repo,
            state.path,
            settings.branch,
            state.sha,
            `Querino: cleanup missing ${job.artifact_type} ${job.artifact_id}`,
            settings.token,
          );
          await supabase
            .from("github_sync_state")
            .delete()
            .eq("artifact_type", job.artifact_type)
            .eq("artifact_id", job.artifact_id)
            .eq("target_scope", settings.scope)
            .eq("target_id", settings.target_id);
        }
        await supabase
          .from("github_sync_queue")
          .update({ status: "done", last_error: "artifact_not_found" })
          .eq("id", job.id);
        done++;
        continue;
      }

      // enqueue_github_sync was callable by any signed-in user until the
      // 2026-09-08 migration revoked it, so a queue row may name an artifact
      // its owner_user_id or team_id never owned. Pushing it would write
      // someone else's content into this owner's repository. The artifact
      // itself says who owns it, so it is checked before anything reaches
      // GitHub.
      const belongsToOwner = job.team_id
        ? artifact.team_id === job.team_id
        : artifact.author_id === job.owner_user_id &&
          (artifact.team_id === null || artifact.team_id === undefined);
      if (!belongsToOwner) {
        await supabase
          .from("github_sync_queue")
          .update({
            status: "skipped",
            last_error: "artifact does not belong to the queued owner",
          })
          .eq("id", job.id);
        skipped++;
        continue;
      }

      const newPath = buildPath(settings.folder, job.artifact_type, {
        slug: artifact.slug,
        id: artifact.id,
      });
      const markdown = generateMarkdown(job.artifact_type, artifact);

      const oldState = await loadSyncState(supabase, job, settings);

      if (oldState?.path && oldState.path !== newPath && oldState.sha) {
        try {
          await ghDeleteFileFresh(
            settings.repo,
            oldState.path,
            settings.branch,
            oldState.sha,
            `Querino: rename ${job.artifact_type} ${job.artifact_id}`,
            settings.token,
          );
        } catch (e) {
          console.warn("Rename delete failed (continuing):", e);
        }
      }

      // The recorded SHA is trusted on the first attempt only. job.attempts
      // is this attempt's number, so anything above 1 means the last try
      // failed, and a stale recorded SHA is the likeliest reason; asking
      // GitHub costs one GET and never answers 409.
      let currentSha: string | undefined;
      if (oldState?.path === newPath && oldState.sha && job.attempts <= 1) {
        currentSha = oldState.sha;
      } else {
        const existing = await ghGetFile(
          settings.repo,
          newPath,
          settings.branch,
          settings.token,
        );
        currentSha = existing?.sha;
      }

      const { sha: newSha } = await ghPutFileFresh(
        settings.repo,
        newPath,
        settings.branch,
        markdown,
        `Querino: sync ${job.artifact_type} ${artifact.title ?? artifact.id}`,
        settings.token,
        currentSha,
      );

      await supabase.from("github_sync_state").upsert(
        {
          artifact_type: job.artifact_type,
          artifact_id: job.artifact_id,
          target_scope: settings.scope,
          target_id: settings.target_id,
          repo: settings.repo,
          branch: settings.branch,
          path: newPath,
          sha: newSha,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "artifact_type,artifact_id,target_scope,target_id" },
      );

      await supabase
        .from("github_sync_queue")
        .update({ status: "done", last_error: null })
        .eq("id", job.id);
      done++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Job ${job.id} failed:`, message);
      // job.attempts is the value after the claim incremented it, so it is
      // this attempt's number, not the previous one's.
      //
      // A retry waits 2^attempts minutes (2, then 4); claim_github_sync_queue
      // skips a row until its next_attempt_at has passed. Until 2026-09-23 a
      // failed row was handed straight back at the next tick, so a GitHub
      // outage of a few minutes used all three attempts.
      const nextAttemptAt = new Date(
        Date.now() + 2 ** Math.min(job.attempts, 10) * 60_000,
      ).toISOString();
      const { error: failErr } = await supabase
        .from("github_sync_queue")
        .update({
          status: job.attempts >= MAX_ATTEMPTS ? "failed" : "pending",
          last_error: message.slice(0, 500),
          next_attempt_at: nextAttemptAt,
        })
        .eq("id", job.id);
      if (failErr) {
        console.error(
          `recording the failure of queue row ${job.id} failed:`,
          failErr.message,
        );
      }
      failed++;
    }
  }

  return {
    processed: latestByArtifact.size - released,
    done,
    failed,
    skipped,
    released,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // The tick's clock starts with the request, before anything is claimed.
  const startedAt = Date.now();

  // Machine-only. Before this check, anyone could drain the queue on demand.
  const denied = await requireMachineCaller(req, corsHeaders);
  if (denied) return denied;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const result = await processQueue(supabase, startedAt);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Worker error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
