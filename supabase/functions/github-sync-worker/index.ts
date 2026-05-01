// GitHub Auto-Sync Worker
// Processes pending entries in github_sync_queue and pushes/deletes files
// in the owner's GitHub repository (personal or team) via the Contents API.
//
// Triggered by pg_cron every ~30s. No JWT verification (called via cron),
// uses SUPABASE_SERVICE_ROLE_KEY internally.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 3;

type ArtifactType = "prompt" | "skill" | "workflow" | "prompt_kit";
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
}

interface GitHubSettings {
  scope: "user" | "team";
  target_id: string;
  repo: string; // owner/repo
  branch: string;
  folder: string;
  token: string;
}

// ---------------- Markdown generation ----------------

function yamlValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(", ")}]`;
  }
  if (value === null || value === undefined) return '""';
  if (typeof value === "string") {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return String(value);
}

function buildFrontmatter(fields: Record<string, unknown>): string {
  const lines = Object.entries(fields).map(
    ([k, v]) => `${k}: ${yamlValue(v)}`,
  );
  return `---\n${lines.join("\n")}\n---\n`;
}

function generateMarkdown(type: ArtifactType, row: Record<string, any>): string {
  const common = {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    tags: row.tags ?? [],
    language: row.language ?? "en",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (type === "prompt") {
    const fm = buildFrontmatter({
      ...common,
      is_public: row.is_public ?? false,
    });
    return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n## Prompt Content\n\n\`\`\`\n${row.content ?? ""}\n\`\`\`\n`;
  }
  if (type === "skill") {
    const fm = buildFrontmatter({
      ...common,
      published: row.published ?? false,
    });
    return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n## Skill Content\n\n${row.content ?? ""}\n`;
  }
  if (type === "workflow") {
    const fm = buildFrontmatter({
      ...common,
      published: row.published ?? false,
    });
    return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n## Workflow\n\n${row.content ?? ""}\n`;
  }
  // prompt_kit
  const fm = buildFrontmatter({
    ...common,
    published: row.published ?? false,
  });
  return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n${row.content ?? ""}\n`;
}

function folderForType(type: ArtifactType): string {
  return {
    prompt: "prompts",
    skill: "skills",
    workflow: "workflows",
    prompt_kit: "prompt-kits",
  }[type];
}

function buildPath(
  baseFolder: string,
  type: ArtifactType,
  row: { slug?: string | null; id: string },
): string {
  const slug = row.slug && row.slug.length > 0 ? row.slug : row.id;
  const shortId = row.id.slice(0, 8);
  const file = `${slug}-${shortId}.md`;
  const subFolder = folderForType(type);
  const trimmed = (baseFolder || "").replace(/^\/+|\/+$/g, "");
  return trimmed ? `${trimmed}/${subFolder}/${file}` : `${subFolder}/${file}`;
}

// ---------------- GitHub Contents API ----------------

function utf8ToBase64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
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
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${path} failed: ${res.status} ${await res.text()}`);
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
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { sha: data.content.sha };
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
    },
  );
  if (!res.ok && res.status !== 404 && res.status !== 422) {
    throw new Error(`GitHub DELETE ${path} failed: ${res.status} ${await res.text()}`);
  }
}

// ---------------- Settings & token loading ----------------

async function loadGitHubSettings(
  supabase: ReturnType<typeof createClient>,
  ownerUserId: string | null,
  teamId: string | null,
): Promise<GitHubSettings | null> {
  if (teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("id, github_repo, github_branch, github_folder")
      .eq("id", teamId)
      .maybeSingle();
    if (!team || !team.github_repo) return null;

    const { data: cred } = await supabase
      .from("user_credentials")
      .select("credential_value")
      .eq("team_id", teamId)
      .eq("credential_type", "github_token")
      .maybeSingle();
    if (!cred?.credential_value) return null;

    return {
      scope: "team",
      target_id: teamId,
      repo: team.github_repo,
      branch: team.github_branch || "main",
      folder: team.github_folder || "",
      token: cred.credential_value,
    };
  }

  if (!ownerUserId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_sync_enabled, github_repo, github_branch, github_folder")
    .eq("id", ownerUserId)
    .maybeSingle();
  if (!profile?.github_sync_enabled || !profile?.github_repo) return null;

  const { data: cred } = await supabase
    .from("user_credentials")
    .select("credential_value")
    .eq("user_id", ownerUserId)
    .is("team_id", null)
    .eq("credential_type", "github_token")
    .maybeSingle();
  if (!cred?.credential_value) return null;

  return {
    scope: "user",
    target_id: ownerUserId,
    repo: profile.github_repo,
    branch: profile.github_branch || "main",
    folder: profile.github_folder || "",
    token: cred.credential_value,
  };
}

// ---------------- Artifact loading ----------------

const TABLE_FOR_TYPE: Record<ArtifactType, string> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
};

async function loadArtifact(
  supabase: ReturnType<typeof createClient>,
  type: ArtifactType,
  id: string,
): Promise<Record<string, any> | null> {
  const table = TABLE_FOR_TYPE[type];
  const { data } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  return (data as Record<string, any> | null) ?? null;
}

// ---------------- Main worker ----------------

async function processQueue(
  supabase: ReturnType<typeof createClient>,
): Promise<{ processed: number; done: number; failed: number; skipped: number }> {
  const { data: pending, error: fetchErr } = await supabase
    .from("github_sync_queue")
    .select("*")
    .in("status", ["pending", "failed"])
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) throw new Error(`Failed to fetch queue: ${fetchErr.message}`);
  if (!pending || pending.length === 0) {
    return { processed: 0, done: 0, failed: 0, skipped: 0 };
  }

  const latestByArtifact = new Map<string, QueueRow>();
  const supersededIds: string[] = [];
  for (const row of pending as QueueRow[]) {
    const key = `${row.artifact_type}:${row.artifact_id}`;
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

  for (const job of latestByArtifact.values()) {
    await supabase
      .from("github_sync_queue")
      .update({ status: "processing", attempts: job.attempts + 1 })
      .eq("id", job.id);

    try {
      const settings = await loadGitHubSettings(
        supabase,
        job.owner_user_id,
        job.team_id,
      );

      if (!settings) {
        await supabase
          .from("github_sync_queue")
          .update({ status: "skipped", last_error: "github_sync_not_configured" })
          .eq("id", job.id);
        skipped++;
        continue;
      }

      if (job.operation === "delete") {
        const { data: state } = await supabase
          .from("github_sync_state")
          .select("path, sha")
          .eq("artifact_type", job.artifact_type)
          .eq("artifact_id", job.artifact_id)
          .eq("target_scope", settings.scope)
          .eq("target_id", settings.target_id)
          .maybeSingle();

        let path = state?.path as string | undefined;
        let sha = state?.sha as string | undefined;

        if (!path) {
          const slug = (job.payload?.slug as string | undefined) ?? null;
          if (slug) {
            path = buildPath(settings.folder, job.artifact_type, {
              slug,
              id: job.artifact_id,
            });
          }
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
            await ghDeleteFile(
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
        const { data: state } = await supabase
          .from("github_sync_state")
          .select("path, sha")
          .eq("artifact_type", job.artifact_type)
          .eq("artifact_id", job.artifact_id)
          .eq("target_scope", settings.scope)
          .eq("target_id", settings.target_id)
          .maybeSingle();
        if (state?.path && state?.sha) {
          await ghDeleteFile(
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

      const newPath = buildPath(settings.folder, job.artifact_type, {
        slug: artifact.slug,
        id: artifact.id,
      });
      const markdown = generateMarkdown(job.artifact_type, artifact);

      const { data: oldState } = await supabase
        .from("github_sync_state")
        .select("path, sha")
        .eq("artifact_type", job.artifact_type)
        .eq("artifact_id", job.artifact_id)
        .eq("target_scope", settings.scope)
        .eq("target_id", settings.target_id)
        .maybeSingle();

      if (oldState?.path && oldState.path !== newPath && oldState.sha) {
        try {
          await ghDeleteFile(
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

      let currentSha: string | undefined;
      if (oldState?.path === newPath && oldState.sha) {
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

      const { sha: newSha } = await ghPutFile(
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
      const newAttempts = job.attempts + 1;
      await supabase
        .from("github_sync_queue")
        .update({
          status: newAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
          last_error: message.slice(0, 500),
        })
        .eq("id", job.id);
      failed++;
    }
  }

  return {
    processed: latestByArtifact.size,
    done,
    failed,
    skipped,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const result = await processQueue(supabase);
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
