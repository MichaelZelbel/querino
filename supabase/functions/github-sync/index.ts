import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Prompt {
  id: string;
  title: string;
  slug: string | null;
  description: string;
  content: string;
  category: string;
  tags: string[] | null;
  is_public: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
  updated_at: string;
}

interface Skill {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  content: string;
  category: string | null;
  tags: string[] | null;
  published: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
  updated_at: string;
}

interface Workflow {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  json: Record<string, unknown>;
  category: string | null;
  tags: string[] | null;
  published: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
  updated_at: string;
}

interface GitHubFile {
  path: string;
  content: string;
  sha?: string;
}

interface GitHubTreeItem {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string;
}

// Generate markdown content with YAML frontmatter
function generatePromptMarkdown(prompt: Prompt): string {
  const frontmatter = {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    tags: prompt.tags || [],
    is_public: prompt.is_public ?? false,
    rating_avg: prompt.rating_avg ?? 0,
    rating_count: prompt.rating_count ?? 0,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at,
  };

  return `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
    }
    if (typeof value === "string" && (value.includes(":") || value.includes('"'))) {
      return `${key}: "${value.replace(/"/g, '\\"')}"`;
    }
    return `${key}: ${value}`;
  })
  .join("\n")}
---

# ${prompt.title}

${prompt.description}

## Prompt Content

\`\`\`
${prompt.content}
\`\`\`
`;
}

function generateSkillMarkdown(skill: Skill): string {
  const frontmatter = {
    id: skill.id,
    title: skill.title,
    description: skill.description || "",
    category: skill.category || "general",
    tags: skill.tags || [],
    published: skill.published ?? false,
    rating_avg: skill.rating_avg ?? 0,
    rating_count: skill.rating_count ?? 0,
    created_at: skill.created_at,
    updated_at: skill.updated_at,
  };

  return `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
    }
    if (typeof value === "string" && (value.includes(":") || value.includes('"'))) {
      return `${key}: "${value.replace(/"/g, '\\"')}"`;
    }
    return `${key}: ${value}`;
  })
  .join("\n")}
---

# ${skill.title}

${skill.description || ""}

## Skill Content

${skill.content}
`;
}

function generateWorkflowMarkdown(workflow: Workflow): string {
  const frontmatter = {
    id: workflow.id,
    title: workflow.title,
    description: workflow.description || "",
    category: workflow.category || "general",
    tags: workflow.tags || [],
    published: workflow.published ?? false,
    rating_avg: workflow.rating_avg ?? 0,
    rating_count: workflow.rating_count ?? 0,
    created_at: workflow.created_at,
    updated_at: workflow.updated_at,
  };

  return `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
    }
    if (typeof value === "string" && (value.includes(":") || value.includes('"'))) {
      return `${key}: "${value.replace(/"/g, '\\"')}"`;
    }
    return `${key}: ${value}`;
  })
  .join("\n")}
---

# ${workflow.title}

${workflow.description || ""}

## Workflow Definition

\`\`\`json
${JSON.stringify(workflow.json, null, 2)}
\`\`\`
`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// GitHub API helpers
async function getRef(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    // 409 means empty repo, 404 means branch doesn't exist
    if (response.status === 409 || response.status === 404) {
      console.log("Repository is empty or branch doesn't exist, will create initial commit");
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
  token: string
): Promise<GitHubTreeItem[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
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
  token: string
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
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create blob:", error);
    throw new Error(`Failed to create blob: ${response.status}`);
  }

  const data = await response.json();
  return data.sha;
}

async function createTree(
  owner: string,
  repo: string,
  baseTree: string | null,
  files: { path: string; sha: string }[],
  token: string
): Promise<string> {
  const tree = files.map((file) => ({
    path: file.path,
    mode: "100644" as const,
    type: "blob" as const,
    sha: file.sha,
  }));

  const body: Record<string, unknown> = { tree };
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
    }
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
  token: string
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
    }
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
  token: string
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
    }
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
  token: string
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
    }
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
  token: string
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
    }
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
  token: string
): Promise<string> {
  console.log("Initializing empty repository with README...");
  
  const readmeContent = `# Querino Sync

This repository is synced from [Querino](https://querino.lovable.app).

## Structure

- \`prompts/\` - AI prompts
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
    }
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
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
      // Team sync
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("github_token_encrypted, github_repo, github_branch, github_folder")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        console.error("Team fetch error:", teamError);
        return new Response(JSON.stringify({ error: "Team not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      githubToken = team.github_token_encrypted;
      githubRepo = team.github_repo;
      githubBranch = team.github_branch || "main";
      githubFolder = team.github_folder || "";
    } else {
      // Personal sync
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("github_token_encrypted, github_repo, github_branch, github_folder")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      githubToken = profile.github_token_encrypted;
      githubRepo = profile.github_repo;
      githubBranch = profile.github_branch || "main";
      githubFolder = profile.github_folder || "";
    }

    // Validate settings
    if (!githubToken) {
      return new Response(
        JSON.stringify({ error: "GitHub token not configured. Please add your Personal Access Token in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!githubRepo) {
      return new Response(
        JSON.stringify({ error: "GitHub repository not configured. Please add your repository in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [owner, repo] = githubRepo.split("/");
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "Invalid repository format. Use owner/repo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          }
        );
        
        if (!repoResponse.ok) {
          throw new Error(`Cannot access repository: ${repoResponse.status}`);
        }
        
        return new Response(
          JSON.stringify({ success: true, message: "Connection successful" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Connection test failed:", error);
        return new Response(
          JSON.stringify({ error: "Failed to connect to repository. Check your token and repository settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch all artefacts
    console.log("Fetching artefacts for user:", user.id, "teamId:", teamId);

    let prompts: Prompt[] = [];
    let skills: Skill[] = [];
    let workflows: Workflow[] = [];

    if (teamId) {
      // Team artefacts
      const [promptsResult, skillsResult, workflowsResult] = await Promise.all([
        supabase.from("prompts").select("*").eq("team_id", teamId),
        supabase.from("skills").select("*").eq("team_id", teamId),
        supabase.from("workflows").select("*").eq("team_id", teamId),
      ]);

      prompts = (promptsResult.data as Prompt[]) || [];
      skills = (skillsResult.data as Skill[]) || [];
      workflows = (workflowsResult.data as Workflow[]) || [];
    } else {
      // Personal artefacts
      const [promptsResult, skillsResult, workflowsResult] = await Promise.all([
        supabase.from("prompts").select("*").eq("author_id", user.id).is("team_id", null),
        supabase.from("skills").select("*").eq("author_id", user.id).is("team_id", null),
        supabase.from("workflows").select("*").eq("author_id", user.id).is("team_id", null),
      ]);

      prompts = (promptsResult.data as Prompt[]) || [];
      skills = (skillsResult.data as Skill[]) || [];
      workflows = (workflowsResult.data as Workflow[]) || [];
    }

    console.log(`Found ${prompts.length} prompts, ${skills.length} skills, ${workflows.length} workflows`);

    if (prompts.length === 0 && skills.length === 0 && workflows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No artefacts to sync" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare files
    const files: GitHubFile[] = [];
    const basePath = githubFolder ? `${githubFolder}/` : "";

    // Generate prompt files
    for (const prompt of prompts) {
      const filename = prompt.slug || slugify(prompt.title);
      files.push({
        path: `${basePath}prompts/${filename}.md`,
        content: generatePromptMarkdown(prompt),
      });
    }

    // Generate skill files
    for (const skill of skills) {
      const filename = skill.slug || slugify(skill.title);
      files.push({
        path: `${basePath}skills/${filename}.md`,
        content: generateSkillMarkdown(skill),
      });
    }

    // Generate workflow files
    for (const workflow of workflows) {
      const filename = workflow.slug || slugify(workflow.title);
      files.push({
        path: `${basePath}workflows/${filename}.md`,
        content: generateWorkflowMarkdown(workflow),
      });
    }

    console.log(`Preparing to commit ${files.length} files`);

    // Get current commit SHA (null if empty repo)
    let currentCommitSha = await getRef(owner, repo, githubBranch, githubToken);
    console.log("Current commit SHA:", currentCommitSha);

    // If repo is empty, initialize it first with a README
    if (!currentCommitSha) {
      console.log("Empty repository detected, initializing...");
      currentCommitSha = await initializeEmptyRepo(owner, repo, githubBranch, githubToken);
      console.log("Repository initialized, new commit SHA:", currentCommitSha);
    }

    // Create blobs for all files
    const blobPromises = files.map(async (file) => {
      const sha = await createBlob(owner, repo, file.content, githubToken!);
      return { path: file.path, sha };
    });

    const blobs = await Promise.all(blobPromises);
    console.log("Created blobs:", blobs.length);

    // Create new tree
    const treeSha = await createTree(owner, repo, currentCommitSha, blobs, githubToken);
    console.log("Created tree:", treeSha);

    // Create commit
    const now = new Date().toISOString();
    const commitMessage = `Sync from Querino (${now.split("T")[0]})

Updated:
- ${prompts.length} prompt(s)
- ${skills.length} skill(s)
- ${workflows.length} workflow(s)

Synced by: ${user.email}`;

    const newCommitSha = await createCommit(
      owner,
      repo,
      commitMessage,
      treeSha,
      currentCommitSha,
      githubToken
    );
    console.log("Created commit:", newCommitSha);

    // Update branch ref
    await updateRef(owner, repo, githubBranch, newCommitSha, githubToken);
    console.log("Updated branch ref");

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
        message: `Successfully synced ${prompts.length} prompts, ${skills.length} skills, ${workflows.length} workflows`,
        commitSha: newCommitSha,
        filesUpdated: files.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GitHub sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
