import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Paths and file bodies come from the same module the queue worker uses, so
// a manual full sync writes exactly the files the worker would, and the
// worker's recorded SHAs keep pointing at real blobs afterwards.
import {
  type ArtifactType,
  buildPath,
  generateMarkdown,
  managedFolders,
} from "../_shared/githubSyncFormat.ts";

// A row from prompts, skills, workflows or prompt_kits. Only id and slug are
// read here; generateMarkdown reads the rest.
interface ArtifactRow {
  id: string;
  slug: string | null;
  title: string;
  [key: string]: unknown;
}

interface GitHubFile {
  artifactType: ArtifactType;
  artifactId: string;
  path: string;
  content: string;
  sha?: string;
}

interface GitHubTreeItem {
  path: string;
  mode: "100644" | "100755" | "040000" | "160000" | "120000";
  type: "blob" | "tree" | "commit";
  sha: string | null;
}

interface GitHubTreeEntry {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string | null; // null = delete file
}

// GitHub API helpers
async function getRef(
  owner: string,
  repo: string,
  branch: string,
  token: string,
): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    // 409 means empty repo, 404 means branch doesn't exist
    if (response.status === 409 || response.status === 404) {
      console.log(
        "Repository is empty or branch doesn't exist, will create initial commit",
      );
      return null;
    }
    console.error("Failed to get ref:", error);
    throw new Error(`Failed to get branch ref: ${response.status}`);
  }

  const data = await response.json();
  return data.object.sha;
}

async function getTree(
  owner: string,
  repo: string,
  treeSha: string,
  token: string,
): Promise<GitHubTreeItem[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    console.error("Failed to get tree:", await response.text());
    return [];
  }

  const data = await response.json();
  return data.tree || [];
}

async function createBlob(
  owner: string,
  repo: string,
  content: string,
  token: string,
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: btoa(unescape(encodeURIComponent(content))),
        encoding: "base64",
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create blob:", error);
    throw new Error(`Failed to create blob: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

async function createTreeWithDeletions(
  owner: string,
  repo: string,
  baseTree: string | null,
  entries: GitHubTreeEntry[],
  token: string,
): Promise<string> {
  const body: Record<string, unknown> = { tree: entries };
  if (baseTree) {
    body.base_tree = baseTree;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create tree:", error);
    throw new Error(`Failed to create tree: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

async function createCommit(
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string | null,
  token: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    message,
    tree: treeSha,
  };

  if (parentSha) {
    body.parents = [parentSha];
  } else {
    body.parents = [];
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create commit:", error);
    throw new Error(`Failed to create commit: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

async function updateRef(
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
  token: string,
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: commitSha,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to update ref:", error);
    throw new Error(`Failed to update ref: ${response.status}`);
  }
}

async function createRef(
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
  token: string,
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: commitSha,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create ref:", error);
    throw new Error(`Failed to create ref: ${response.status}`);
  }
}

// For empty repos, use the Contents API to create files one by one
async function createFileViaContentsApi(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  token: string,
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create file via Contents API:", error);
    throw new Error(`Failed to create file: ${response.status}`);
  }
}

// Initialize empty repo with a README to enable Git Data API
async function initializeEmptyRepo(
  owner: string,
  repo: string,
  branch: string,
  token: string,
): Promise<string> {
  console.log("Initializing empty repository with README...");

  const readmeContent = `# Querino Sync

This repository is synced from [Querino](https://querino.ai).

## Structure

- \`prompts/\` - AI prompts
- \`prompt-kits/\` - Prompt kits (bundles of prompts)
- \`skills/\` - AI skills  
- \`workflows/\` - AI workflows

Each file contains YAML frontmatter with metadata and the content in Markdown format.
`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Initialize repository for Querino sync",
        content: btoa(unescape(encodeURIComponent(readmeContent))),
        branch,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to initialize repo:", error);
    throw new Error(`Failed to initialize repository: ${response.status}`);
  }

  const data = await response.json();
  return data.commit.sha;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth and RLS-protected queries
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for fetching team credentials (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { teamId, testConnection } = body;

    // Get settings based on personal or team sync
    let githubToken: string | null = null;
    let githubRepo: string | null = null;
    let githubBranch = "main";
    let githubFolder = "";

    if (teamId) {
      // Team sync - verify user is a team member first
      const { data: membership, error: memberError } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError || !membership) {
        console.error("Team membership check failed:", memberError);
        return new Response(
          JSON.stringify({ error: "You are not a member of this team" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Get team settings
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("github_repo, github_branch, github_folder")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        console.error("Team fetch error:", teamError);
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // The token is encrypted at rest in Supabase Vault, so it is read through
      // read_user_credential rather than selected from the table (finding H3).
      // The service-role client is what makes it readable at all, and it is
      // also what lets any team member reach the team's token.
      const { data: teamToken, error: credError } = await supabaseAdmin.rpc(
        "read_user_credential",
        { _credential_type: "github_token", _team_id: teamId },
      );

      if (credError) {
        console.error("Credential fetch error:", credError);
      }

      githubToken = (teamToken as string | null) || null;
      githubRepo = team.github_repo;
      githubBranch = team.github_branch || "main";
      githubFolder = team.github_folder || "";
    } else {
      // Personal sync - get profile settings
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("github_repo, github_branch, github_folder")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Same as the team branch: the value is in Vault, and only the service
      // role can decrypt it. user.id came from the caller's JWT a few lines
      // above, so scoping the admin client to it is the same guarantee RLS
      // was giving, without leaving a decryptable token where a browser could
      // ever select it.
      const { data: userToken, error: credError } = await supabaseAdmin.rpc(
        "read_user_credential",
        { _credential_type: "github_token", _user_id: user.id },
      );

      if (credError) {
        console.error("Credential fetch error:", credError);
      }

      githubToken = (userToken as string | null) || null;
      githubRepo = profile.github_repo;
      githubBranch = profile.github_branch || "main";
      githubFolder = profile.github_folder || "";
    }

    // Validate settings
    if (!githubToken) {
      return new Response(
        JSON.stringify({
          error:
            "GitHub token not configured. Please add your Personal Access Token in Settings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!githubRepo) {
      return new Response(
        JSON.stringify({
          error:
            "GitHub repository not configured. Please add your repository in Settings.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const [owner, repo] = githubRepo.split("/");
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "Invalid repository format. Use owner/repo" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Test connection only - verify we can access the repo
    if (testConnection) {
      try {
        // Try to get repo info instead of branch ref (works for empty repos too)
        const repoResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );

        if (!repoResponse.ok) {
          throw new Error(`Cannot access repository: ${repoResponse.status}`);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Connection successful" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (error) {
        console.error("Connection test failed:", error);
        return new Response(
          JSON.stringify({
            error:
              "Failed to connect to repository. Check your token and repository settings.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Fetch all artefacts
    console.log("Fetching artefacts for user:", user.id, "teamId:", teamId);

    let prompts: ArtifactRow[] = [];
    let skills: ArtifactRow[] = [];
    let workflows: ArtifactRow[] = [];
    let promptKits: ArtifactRow[] = [];

    if (teamId) {
      // Team artefacts
      const [promptsResult, skillsResult, workflowsResult, kitsResult] =
        await Promise.all([
          supabase.from("prompts").select("*").eq("team_id", teamId),
          supabase.from("skills").select("*").eq("team_id", teamId),
          supabase.from("workflows").select("*").eq("team_id", teamId),
          (supabase.from("prompt_kits") as any)
            .select("*")
            .eq("team_id", teamId),
        ]);

      prompts = (promptsResult.data as ArtifactRow[]) || [];
      skills = (skillsResult.data as ArtifactRow[]) || [];
      workflows = (workflowsResult.data as ArtifactRow[]) || [];
      promptKits = (kitsResult.data as ArtifactRow[]) || [];
    } else {
      // Personal artefacts
      const [promptsResult, skillsResult, workflowsResult, kitsResult] =
        await Promise.all([
          supabase
            .from("prompts")
            .select("*")
            .eq("author_id", user.id)
            .is("team_id", null),
          supabase
            .from("skills")
            .select("*")
            .eq("author_id", user.id)
            .is("team_id", null),
          supabase
            .from("workflows")
            .select("*")
            .eq("author_id", user.id)
            .is("team_id", null),
          (supabase.from("prompt_kits") as any)
            .select("*")
            .eq("author_id", user.id)
            .is("team_id", null),
        ]);

      prompts = (promptsResult.data as ArtifactRow[]) || [];
      skills = (skillsResult.data as ArtifactRow[]) || [];
      workflows = (workflowsResult.data as ArtifactRow[]) || [];
      promptKits = (kitsResult.data as ArtifactRow[]) || [];
    }

    console.log(
      `Found ${prompts.length} prompts, ${skills.length} skills, ${workflows.length} workflows, ${promptKits.length} prompt kits`,
    );

    if (
      prompts.length === 0 &&
      skills.length === 0 &&
      workflows.length === 0 &&
      promptKits.length === 0
    ) {
      return new Response(
        JSON.stringify({ success: true, message: "No artefacts to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Prepare files. Every path and body comes from _shared/githubSyncFormat,
    // which is what the queue worker writes too. Before 2026-09-08 this
    // function named files after the title, so it never recognised the
    // worker's `<slug>-<shortid>.md` files as its own and deleted them all.
    const files: GitHubFile[] = [];
    const byType: Array<[ArtifactType, ArtifactRow[]]> = [
      ["prompt", prompts],
      ["skill", skills],
      ["workflow", workflows],
      ["prompt_kit", promptKits],
    ];
    for (const [type, rows] of byType) {
      for (const row of rows) {
        files.push({
          artifactType: type,
          artifactId: row.id,
          path: buildPath(githubFolder, type, { slug: row.slug, id: row.id }),
          content: generateMarkdown(type, row),
        });
      }
    }

    console.log(`Preparing to commit ${files.length} files`);

    // Get current commit SHA (null if empty repo)
    let currentCommitSha = await getRef(owner, repo, githubBranch, githubToken);
    console.log("Current commit SHA:", currentCommitSha);

    // If repo is empty, initialize it first with a README
    if (!currentCommitSha) {
      console.log("Empty repository detected, initializing...");
      currentCommitSha = await initializeEmptyRepo(
        owner,
        repo,
        githubBranch,
        githubToken,
      );
      console.log("Repository initialized, new commit SHA:", currentCommitSha);
    }

    // Get current tree to find files to delete in our managed folders
    const existingTree = await getTree(
      owner,
      repo,
      currentCommitSha!,
      githubToken,
    );
    const managedPaths = managedFolders(githubFolder);

    // Find existing files in our managed folders that should be deleted
    const existingManagedFiles = existingTree.filter(
      (item) =>
        item.type === "blob" &&
        managedPaths.some((mp) => item.path.startsWith(mp)),
    );
    console.log(
      `Found ${existingManagedFiles.length} existing files in managed folders`,
    );

    // Build a set of new file paths for quick lookup
    const newFilePaths = new Set(files.map((f) => f.path));

    // Create tree entries: deletions first (sha: null), then new files
    const treeEntries: GitHubTreeEntry[] = [];

    // Add deletion entries for files that no longer exist or have different paths
    for (const existingFile of existingManagedFiles) {
      if (!newFilePaths.has(existingFile.path)) {
        console.log(`Will delete: ${existingFile.path}`);
        treeEntries.push({
          path: existingFile.path,
          mode: "100644",
          type: "blob",
          sha: null, // null sha = delete
        });
      }
    }

    // Create blobs for all new files
    const blobPromises = files.map(async (file) => {
      const sha = await createBlob(owner, repo, file.content, githubToken!);
      return {
        artifactType: file.artifactType,
        artifactId: file.artifactId,
        path: file.path,
        sha,
      };
    });

    const blobs = await Promise.all(blobPromises);
    console.log("Created blobs:", blobs.length);

    // Add new file entries
    for (const blob of blobs) {
      treeEntries.push({
        path: blob.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }

    console.log(
      `Tree entries: ${treeEntries.filter((e) => e.sha === null).length} deletions, ${blobs.length} additions`,
    );

    // Create new tree with deletions and additions
    const treeSha = await createTreeWithDeletions(
      owner,
      repo,
      currentCommitSha,
      treeEntries,
      githubToken,
    );
    console.log("Created tree:", treeSha);

    // Create commit
    const now = new Date().toISOString();
    const commitMessage = `Sync from Querino (${now.split("T")[0]})

Updated:
- ${prompts.length} prompt(s)
- ${skills.length} skill(s)
- ${workflows.length} workflow(s)
- ${promptKits.length} prompt kit(s)

Synced by: ${user.email}`;

    const newCommitSha = await createCommit(
      owner,
      repo,
      commitMessage,
      treeSha,
      currentCommitSha,
      githubToken,
    );
    console.log("Created commit:", newCommitSha);

    // Update branch ref
    await updateRef(owner, repo, githubBranch, newCommitSha, githubToken);
    console.log("Updated branch ref");

    // Tell the queue worker what is in the repository now. github_sync_state
    // is the worker's memory of which path and blob each artifact lives at;
    // it has no client policies, so only the service-role client can write
    // it. Without this, the worker's next upsert would send the SHA of a blob
    // this commit just replaced and GitHub would answer 409 three times.
    //
    // The blob SHA from the Git Data API is the same value the Contents API
    // reports as content.sha, so the worker can hand it straight back.
    const targetScope = teamId ? "team" : "user";
    const targetId = teamId ? String(teamId) : user.id;
    const stateRows = blobs.map((b) => ({
      artifact_type: b.artifactType,
      artifact_id: b.artifactId,
      target_scope: targetScope,
      target_id: targetId,
      repo: githubRepo,
      branch: githubBranch,
      path: b.path,
      sha: b.sha,
      last_synced_at: now,
    }));
    if (stateRows.length > 0) {
      const { error: stateErr } = await supabaseAdmin
        .from("github_sync_state")
        .upsert(stateRows, {
          onConflict: "artifact_type,artifact_id,target_scope,target_id",
        });
      if (stateErr) {
        console.error("Failed to record github_sync_state:", stateErr);
      }
    }

    // Anything this target had a state row for that was not written just now
    // was deleted from the tree above (it is under a managed folder and not in
    // newFilePaths), so its row would only ever point at a missing blob.
    const { data: staleState, error: staleErr } = await supabaseAdmin
      .from("github_sync_state")
      .select("id, artifact_type, artifact_id")
      .eq("target_scope", targetScope)
      .eq("target_id", targetId);
    if (staleErr) {
      console.error("Failed to read github_sync_state:", staleErr);
    } else {
      const written = new Set(
        blobs.map((b) => `${b.artifactType}:${b.artifactId}`),
      );
      const staleIds = (staleState ?? [])
        .filter(
          (row: { artifact_type: string; artifact_id: string }) =>
            !written.has(`${row.artifact_type}:${row.artifact_id}`),
        )
        .map((row: { id: string }) => row.id);
      if (staleIds.length > 0) {
        const { error: delErr } = await supabaseAdmin
          .from("github_sync_state")
          .delete()
          .in("id", staleIds);
        if (delErr) {
          console.error("Failed to prune github_sync_state:", delErr);
        }
      }
    }

    // Update last synced timestamp
    if (teamId) {
      await supabase
        .from("teams")
        .update({ github_last_synced_at: now })
        .eq("id", teamId);
    } else {
      await supabase
        .from("profiles")
        .update({ github_last_synced_at: now })
        .eq("id", user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${prompts.length} prompts, ${skills.length} skills, ${workflows.length} workflows, ${promptKits.length} prompt kits`,
        commitSha: newCommitSha,
        filesUpdated: files.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("GitHub sync error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
