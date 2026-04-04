import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Auth {
  userId: string;
  authHeader: string;
}

function authedClient(auth: Auth) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth.authHeader } },
  });
}

async function authenticate(req: Request): Promise<Auth> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Missing authorization token");

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) throw new Error("Invalid token");

  return { userId: data.user.id, authHeader };
}

// ── Tool definitions ────────────────────────────────────────────────

function buildMcpServer(auth: Auth) {
  const mcpServer = new McpServer({
    name: "querino-mcp",
    version: "1.0.0",
  });

  const sb = authedClient(auth);

  // ── PROMPTS ───────────────────────────────────────────────────────

  mcpServer.tool("list_prompts", {
    description: "List your prompts (most recent first). Optional limit (default 20, max 100).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max items to return" },
        offset: { type: "number", description: "Offset for pagination" },
      },
    },
    handler: async ({ limit, offset }: { limit?: number; offset?: number }) => {
      const l = Math.min(limit ?? 20, 100);
      const o = offset ?? 0;
      const { data, error } = await sb
        .from("prompts")
        .select("id, title, category, tags, is_public, rating_avg, rating_count, language, created_at, updated_at")
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(o, o + l - 1);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("search_prompts", {
    description: "Search your prompts by keyword in title or description.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Search keyword" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      const { data, error } = await sb
        .from("prompts")
        .select("id, title, category, tags, is_public, language, updated_at")
        .eq("author_id", auth.userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("get_prompt", {
    description: "Get full details of a prompt by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Prompt UUID" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { data, error } = await sb
        .from("prompts")
        .select("*")
        .eq("id", id)
        .eq("author_id", auth.userId)
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("create_prompt", {
    description: "Create a new prompt.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        is_public: { type: "boolean" },
        language: { type: "string", description: "Language code, e.g. en, de" },
      },
      required: ["title", "description", "content", "category"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { data, error } = await sb
        .from("prompts")
        .insert({
          title: input.title as string,
          description: input.description as string,
          content: input.content as string,
          category: input.category as string,
          tags: (input.tags as string[]) ?? [],
          is_public: (input.is_public as boolean) ?? false,
          language: (input.language as string) ?? "en",
          author_id: auth.userId,
        })
        .select("id, title, slug")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Created prompt: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("update_prompt", {
    description: "Update an existing prompt by ID. Only supply fields you want to change.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        is_public: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { id, ...updates } = input;
      const { data, error } = await sb
        .from("prompts")
        .update(updates)
        .eq("id", id as string)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("delete_prompt", {
    description: "Delete a prompt by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { error } = await sb
        .from("prompts")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Deleted prompt ${id}` }] };
    },
  });

  // ── SKILLS ────────────────────────────────────────────────────────

  mcpServer.tool("list_skills", {
    description: "List your skills (most recent first).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    handler: async ({ limit, offset }: { limit?: number; offset?: number }) => {
      const l = Math.min(limit ?? 20, 100);
      const o = offset ?? 0;
      const { data, error } = await sb
        .from("skills")
        .select("id, title, category, tags, published, language, rating_avg, rating_count, created_at, updated_at")
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(o, o + l - 1);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("search_skills", {
    description: "Search your skills by keyword.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      const { data, error } = await sb
        .from("skills")
        .select("id, title, category, tags, published, language, updated_at")
        .eq("author_id", auth.userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("get_skill", {
    description: "Get full details of a skill by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { data, error } = await sb
        .from("skills")
        .select("*")
        .eq("id", id)
        .eq("author_id", auth.userId)
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("create_skill", {
    description: "Create a new skill.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["title", "content"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { data, error } = await sb
        .from("skills")
        .insert({
          title: input.title as string,
          description: (input.description as string) ?? null,
          content: input.content as string,
          category: (input.category as string) ?? null,
          tags: (input.tags as string[]) ?? [],
          published: (input.published as boolean) ?? false,
          language: (input.language as string) ?? "en",
          author_id: auth.userId,
        })
        .select("id, title, slug")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Created skill: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("update_skill", {
    description: "Update an existing skill by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { id, ...updates } = input;
      const { data, error } = await sb
        .from("skills")
        .update(updates)
        .eq("id", id as string)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("delete_skill", {
    description: "Delete a skill by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { error } = await sb
        .from("skills")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Deleted skill ${id}` }] };
    },
  });

  // ── WORKFLOWS ─────────────────────────────────────────────────────

  mcpServer.tool("list_workflows", {
    description: "List your workflows (most recent first).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    handler: async ({ limit, offset }: { limit?: number; offset?: number }) => {
      const l = Math.min(limit ?? 20, 100);
      const o = offset ?? 0;
      const { data, error } = await sb
        .from("workflows")
        .select("id, title, category, tags, published, language, rating_avg, rating_count, created_at, updated_at")
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(o, o + l - 1);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("search_workflows", {
    description: "Search your workflows by keyword.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      const { data, error } = await sb
        .from("workflows")
        .select("id, title, category, tags, published, language, updated_at")
        .eq("author_id", auth.userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("get_workflow", {
    description: "Get full details of a workflow by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { data, error } = await sb
        .from("workflows")
        .select("*")
        .eq("id", id)
        .eq("author_id", auth.userId)
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("create_workflow", {
    description: "Create a new workflow.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        json: { type: "object", description: "Structured workflow data (JSON)" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["title"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { data, error } = await sb
        .from("workflows")
        .insert({
          title: input.title as string,
          description: (input.description as string) ?? null,
          content: (input.content as string) ?? null,
          json: (input.json ?? {}) as Record<string, unknown>,
          category: (input.category as string) ?? null,
          tags: (input.tags as string[]) ?? [],
          published: (input.published as boolean) ?? false,
          language: (input.language as string) ?? "en",
          author_id: auth.userId,
        })
        .select("id, title, slug")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Created workflow: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("update_workflow", {
    description: "Update an existing workflow by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        json: { type: "object" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { id, ...updates } = input;
      const { data, error } = await sb
        .from("workflows")
        .update(updates)
        .eq("id", id as string)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("delete_workflow", {
    description: "Delete a workflow by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { error } = await sb
        .from("workflows")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Deleted workflow ${id}` }] };
    },
  });

  // ── CLAWS ─────────────────────────────────────────────────────────

  mcpServer.tool("list_claws", {
    description: "List your claws (most recent first).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    handler: async ({ limit, offset }: { limit?: number; offset?: number }) => {
      const l = Math.min(limit ?? 20, 100);
      const o = offset ?? 0;
      const { data, error } = await sb
        .from("claws")
        .select("id, title, category, tags, published, source, language, rating_avg, rating_count, created_at, updated_at")
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(o, o + l - 1);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("search_claws", {
    description: "Search your claws by keyword.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      const { data, error } = await sb
        .from("claws")
        .select("id, title, category, tags, published, source, language, updated_at")
        .eq("author_id", auth.userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("get_claw", {
    description: "Get full details of a claw by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { data, error } = await sb
        .from("claws")
        .select("*")
        .eq("id", id)
        .eq("author_id", auth.userId)
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("create_claw", {
    description: "Create a new claw.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        skill_md_content: { type: "string", description: "SKILL.md content" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        source: { type: "string", description: "clawbot, antigravity, or generic" },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["title"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { data, error } = await sb
        .from("claws")
        .insert({
          title: input.title as string,
          description: (input.description as string) ?? null,
          content: (input.content as string) ?? null,
          skill_md_content: (input.skill_md_content as string) ?? null,
          category: (input.category as string) ?? null,
          tags: (input.tags as string[]) ?? [],
          source: (input.source as string) ?? "clawbot",
          published: (input.published as boolean) ?? false,
          language: (input.language as string) ?? "en",
          author_id: auth.userId,
        })
        .select("id, title, slug")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Created claw: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("update_claw", {
    description: "Update an existing claw by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        skill_md_content: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        source: { type: "string" },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { id, ...updates } = input;
      const { data, error } = await sb
        .from("claws")
        .update(updates)
        .eq("id", id as string)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("delete_claw", {
    description: "Delete a claw by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { error } = await sb
        .from("claws")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Deleted claw ${id}` }] };
    },
  });

  // ── COLLECTIONS ───────────────────────────────────────────────────

  mcpServer.tool("list_collections", {
    description: "List your collections.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
    handler: async ({ limit }: { limit?: number }) => {
      const { data, error } = await sb
        .from("collections")
        .select("id, title, description, is_public, created_at, updated_at")
        .eq("owner_id", auth.userId)
        .order("updated_at", { ascending: false })
        .limit(limit ?? 20);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("get_collection", {
    description: "Get a collection and its items by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { data: col, error: colErr } = await sb
        .from("collections")
        .select("*")
        .eq("id", id)
        .eq("owner_id", auth.userId)
        .single();
      if (colErr) return { content: [{ type: "text", text: `Error: ${colErr.message}` }] };

      const { data: items } = await sb
        .from("collection_items")
        .select("id, item_id, item_type, sort_order")
        .eq("collection_id", id)
        .order("sort_order");

      return { content: [{ type: "text", text: JSON.stringify({ ...col, items }, null, 2) }] };
    },
  });

  mcpServer.tool("create_collection", {
    description: "Create a new collection.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        is_public: { type: "boolean" },
      },
      required: ["title"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { data, error } = await sb
        .from("collections")
        .insert({
          title: input.title as string,
          description: (input.description as string) ?? null,
          is_public: (input.is_public as boolean) ?? false,
          owner_id: auth.userId,
        })
        .select("id, title")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Created collection: ${JSON.stringify(data)}` }] };
    },
  });

  mcpServer.tool("delete_collection", {
    description: "Delete a collection by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { error } = await sb
        .from("collections")
        .delete()
        .eq("id", id)
        .eq("owner_id", auth.userId);
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Deleted collection ${id}` }] };
    },
  });

  // ── PROFILE ───────────────────────────────────────────────────────

  mcpServer.tool("get_my_profile", {
    description: "Get your profile information.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const { data, error } = await sb
        .from("profiles")
        .select("id, display_name, bio, website, twitter, github, avatar_url, plan_type, created_at")
        .eq("id", auth.userId)
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  });

  mcpServer.tool("update_my_profile", {
    description: "Update your profile. Only supply fields you want to change.",
    inputSchema: {
      type: "object",
      properties: {
        display_name: { type: "string" },
        bio: { type: "string" },
        website: { type: "string" },
        twitter: { type: "string" },
        github: { type: "string" },
      },
    },
    handler: async (input: Record<string, unknown>) => {
      const { data, error } = await sb
        .from("profiles")
        .update(input)
        .eq("id", auth.userId)
        .select("id, display_name")
        .single();
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return { content: [{ type: "text", text: `Updated profile: ${JSON.stringify(data)}` }] };
    },
  });

  return mcpServer;
}

// ── Hono app ────────────────────────────────────────────────────────

const app = new Hono();

// CORS preflight
app.options("/*", (c) => {
  return c.newResponse(null, 204, corsHeaders);
});

// Health check
app.get("/mcp-server/health", (c) => {
  return c.json({ status: "ok" }, 200, corsHeaders);
});
app.get("/mcp-server", (c) => {
  return c.json({
    name: "querino-mcp",
    version: "1.0.0",
    description: "Querino MCP Server — manage prompts, skills, workflows, claws and collections.",
    health: "ok",
  }, 200, corsHeaders);
});

// MCP endpoint
app.all("/mcp-server/mcp", async (c) => {
  try {
    const auth = await authenticate(c.req.raw);
    const mcpServer = buildMcpServer(auth);
    const transport = new StreamableHttpTransport();
    const response = await (transport as any).handleRequest(c.req.raw, mcpServer);

    // Add CORS headers to the response
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders)) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    return c.json({ error: msg }, 401, corsHeaders);
  }
});

Deno.serve(app.fetch);
