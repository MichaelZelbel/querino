import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "@supabase/supabase-js";
import {
  allTermsFilters,
  anyTermFilter,
  tokenizeSearchQuery,
} from "../_shared/postgrestFilter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept, mcp-session-id, mcp-protocol-version, x-brain-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Long-lived MCP token prefixes recognised by the server.
// Anything else (e.g. Supabase session JWTs starting with "ey") is rejected.
const MCP_TOKEN_PREFIXES = ["qrn_mcp_", "mnr_mcp_"];

interface Auth {
  userId: string;
}

// Service-role client. We deliberately bypass RLS here and enforce ownership
// in every tool by filtering on author_id = auth.userId, and column access
// in every update_* tool with pickDeclared below.
function authedClient(_auth: Auth) {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

async function authenticate(req: Request): Promise<Auth> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Missing authorization token");

  // Only long-lived MCP tokens are accepted. Reject Supabase session JWTs etc.
  const isMcpToken = MCP_TOKEN_PREFIXES.some((p) => token.startsWith(p));
  if (!isMcpToken) {
    throw new Error(
      "Invalid token. Expected a long-lived Querino MCP token (qrn_mcp_… or mnr_mcp_…). " +
        "Generate one in Settings → MCP Server.",
    );
  }

  const tokenHash = await sha256Hex(token);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.rpc("lookup_mcp_token", {
    p_token_hash: tokenHash,
  });
  if (error) throw new Error("Token lookup failed");

  const userId = data as string | null;
  if (!userId) throw new Error("Invalid, revoked, or expired token");

  return { userId };
}

// ── Input hygiene ───────────────────────────────────────────────────

// mcp-lite 0.10 hands a tool whatever keys the caller sent; it does not check
// them against the tool's inputSchema. And the client below holds the
// service-role key, so neither row-level security nor the column grants sit
// between a stray key and the SET list, and the profile guard trigger only
// fires for a real auth.uid(). The whitelist here IS the authorization: an
// update touches the columns its tool declares and nothing else. Each list
// mirrors that tool's inputSchema minus `id`, so keep the two together.
const UPDATABLE = {
  prompts: [
    "title",
    "description",
    "content",
    "category",
    "tags",
    "is_public",
    "language",
  ],
  skills: [
    "title",
    "description",
    "content",
    "category",
    "tags",
    "published",
    "language",
  ],
  workflows: [
    "title",
    "description",
    "content",
    "json",
    "category",
    "tags",
    "published",
    "language",
  ],
  prompt_kits: [
    "title",
    "description",
    "content",
    "category",
    "tags",
    "published",
    "language",
  ],
  profiles: ["display_name", "bio", "website", "twitter", "github"],
} as const;

/** The declared keys of `input`, or null when none of them was given. */
function pickDeclared(
  input: Record<string, unknown>,
  allowed: readonly string[],
): Record<string, unknown> | null {
  const picked: Record<string, unknown> = {};
  for (const key of allowed) {
    if (input[key] !== undefined) picked[key] = input[key];
  }
  return Object.keys(picked).length > 0 ? picked : null;
}

/**
 * The row window for every list_* tool. A negative offset is a PostgREST
 * error, a limit of ten thousand is a response nobody asked to read, and
 * list_collections used to have no cap at all. Limit ends up in 1..100,
 * offset at 0 or more, and anything that is not a number falls back to the
 * defaults.
 */
function pageWindow(
  limit: unknown,
  offset: unknown,
): { from: number; to: number } {
  const l = Math.min(Math.max(Math.floor(Number(limit)) || 20, 1), 100);
  const o = Math.max(Math.floor(Number(offset)) || 0, 0);
  return { from: o, to: o + l - 1 };
}

// ── Tool definitions ────────────────────────────────────────────────

function buildMcpServer(auth: Auth) {
  const mcpServer = new McpServer({
    name: "querino-mcp",
    version: "1.0.0",
  });

  const sb = authedClient(auth);

  // Every table below keeps its text in the same three columns, and an agent
  // looking for "the skill about grilling me" has no idea which of the three
  // holds the word it remembers. Searching all three costs nothing here and
  // is what the command palette already does on the website.
  const SEARCH_COLUMNS = ["title", "description", "content"] as const;

  /**
   * The body of every search_* tool.
   *
   * Two passes, because an empty answer is the one answer an agent cannot
   * check: first "every word appears somewhere", then, only if that found
   * nothing, "any word appears somewhere". A near miss the caller can reject
   * beats a clean "nothing found" it will repeat as fact.
   *
   * Ownership is filtered here rather than by RLS, because this client holds
   * the service-role key. `published` is deliberately not filtered: these
   * tools search the caller's own shelf, drafts included.
   */
  const runSearch = async (table: string, columns: string, query: string) => {
    const select = () =>
      sb
        .from(table)
        .select(columns)
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .limit(30);

    let strict = select();
    for (const filter of allTermsFilters(SEARCH_COLUMNS, query)) {
      strict = strict.or(filter);
    }

    const { data, error } = await strict;
    if (error)
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    if (data && data.length > 0) {
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    const loose = anyTermFilter(SEARCH_COLUMNS, query);
    // One term is already its own loose pass, and a blank query has no terms
    // at all; sending `or=()` in either case would be a parse error.
    if (!loose || tokenizeSearchQuery(query).length < 2) {
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      };
    }

    const { data: partial, error: partialError } = await select().or(loose);
    if (partialError) {
      return {
        content: [{ type: "text", text: `Error: ${partialError.message}` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(partial ?? [], null, 2) }],
    };
  };

  // ── PROMPTS ───────────────────────────────────────────────────────

  mcpServer.tool("list_prompts", {
    description:
      "List your prompts (most recent first). Optional limit (default 20, max 100).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max items to return" },
        offset: { type: "number", description: "Offset for pagination" },
      },
    },
    handler: async ({ limit, offset }: { limit?: number; offset?: number }) => {
      const { from, to } = pageWindow(limit, offset);
      const { data, error } = await sb
        .from("prompts")
        .select(
          "id, title, category, tags, is_public, rating_avg, rating_count, language, created_at, updated_at",
        )
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(from, to);
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  mcpServer.tool("search_prompts", {
    description:
      "Search your prompts by keyword in title, description or content. " +
      'Multiple words are matched as separate keywords; "quote a phrase" to keep it together. ' +
      "Searches everything you own, drafts and private items included.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Search keywords" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      return await runSearch(
        "prompts",
        "id, title, category, tags, is_public, language, updated_at",
        query,
      );
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [
          { type: "text", text: `Created prompt: ${JSON.stringify(data)}` },
        ],
      };
    },
  });

  mcpServer.tool("update_prompt", {
    description:
      "Update an existing prompt by ID. Only supply fields you want to change.",
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
      const id = input.id as string;
      const updates = pickDeclared(input, UPDATABLE.prompts);
      if (!updates)
        return {
          content: [{ type: "text", text: "Error: no updatable fields given" }],
        };
      const { data, error } = await sb
        .from("prompts")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }],
      };
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
      const { data, error } = await sb
        .from("prompts")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id");
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      if (!data || data.length === 0)
        return {
          content: [
            {
              type: "text",
              text: `Error: no prompt ${id} in your library, nothing was deleted`,
            },
          ],
        };
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
      const { from, to } = pageWindow(limit, offset);
      const { data, error } = await sb
        .from("skills")
        .select(
          "id, title, category, tags, published, language, rating_avg, rating_count, created_at, updated_at",
        )
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(from, to);
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  mcpServer.tool("search_skills", {
    description:
      "Search your skills by keyword in title, description or content. " +
      'Multiple words are matched as separate keywords; "quote a phrase" to keep it together. ' +
      "Searches everything you own, drafts and unpublished skills included.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Search keywords" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      return await runSearch(
        "skills",
        "id, title, category, tags, published, language, updated_at",
        query,
      );
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [
          { type: "text", text: `Created skill: ${JSON.stringify(data)}` },
        ],
      };
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
      const id = input.id as string;
      const updates = pickDeclared(input, UPDATABLE.skills);
      if (!updates)
        return {
          content: [{ type: "text", text: "Error: no updatable fields given" }],
        };
      const { data, error } = await sb
        .from("skills")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }],
      };
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
      const { data, error } = await sb
        .from("skills")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id");
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      if (!data || data.length === 0)
        return {
          content: [
            {
              type: "text",
              text: `Error: no skill ${id} in your library, nothing was deleted`,
            },
          ],
        };
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
      const { from, to } = pageWindow(limit, offset);
      const { data, error } = await sb
        .from("workflows")
        .select(
          "id, title, category, tags, published, language, rating_avg, rating_count, created_at, updated_at",
        )
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(from, to);
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  mcpServer.tool("search_workflows", {
    description:
      "Search your workflows by keyword in title, description or content. " +
      'Multiple words are matched as separate keywords; "quote a phrase" to keep it together. ' +
      "Searches everything you own, drafts and unpublished workflows included.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Search keywords" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      return await runSearch(
        "workflows",
        "id, title, category, tags, published, language, updated_at",
        query,
      );
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
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
        json: {
          type: "object",
          description: "Structured workflow data (JSON)",
        },
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [
          { type: "text", text: `Created workflow: ${JSON.stringify(data)}` },
        ],
      };
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
      const id = input.id as string;
      const updates = pickDeclared(input, UPDATABLE.workflows);
      if (!updates)
        return {
          content: [{ type: "text", text: "Error: no updatable fields given" }],
        };
      const { data, error } = await sb
        .from("workflows")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }],
      };
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
      const { data, error } = await sb
        .from("workflows")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id");
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      if (!data || data.length === 0)
        return {
          content: [
            {
              type: "text",
              text: `Error: no workflow ${id} in your library, nothing was deleted`,
            },
          ],
        };
      return { content: [{ type: "text", text: `Deleted workflow ${id}` }] };
    },
  });

  // The six claw tools that stood here were removed on 2026-09-08. Migration
  // 20260430155205 dropped public.claws in April and nothing recreated it, so
  // every one of them had been answering "Could not find the table
  // 'public.claws' in the schema cache" to every client since. A tool that
  // cannot succeed is worse than a missing one: it tells the model the
  // capability exists.

  // ── COLLECTIONS ───────────────────────────────────────────────────

  mcpServer.tool("list_collections", {
    description: "List your collections.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    handler: async ({ limit, offset }: { limit?: number; offset?: number }) => {
      const { from, to } = pageWindow(limit, offset);
      const { data, error } = await sb
        .from("collections")
        .select("id, title, description, is_public, created_at, updated_at")
        .eq("owner_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(from, to);
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
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
      if (colErr)
        return {
          content: [{ type: "text", text: `Error: ${colErr.message}` }],
        };

      const { data: items } = await sb
        .from("collection_items")
        .select("id, item_id, item_type, sort_order")
        .eq("collection_id", id)
        .order("sort_order");

      return {
        content: [
          { type: "text", text: JSON.stringify({ ...col, items }, null, 2) },
        ],
      };
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [
          { type: "text", text: `Created collection: ${JSON.stringify(data)}` },
        ],
      };
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
      const { data, error } = await sb
        .from("collections")
        .delete()
        .eq("id", id)
        .eq("owner_id", auth.userId)
        .select("id");
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      if (!data || data.length === 0)
        return {
          content: [
            {
              type: "text",
              text: `Error: no collection ${id} in your library, nothing was deleted`,
            },
          ],
        };
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
        .select(
          "id, display_name, bio, website, twitter, github, avatar_url, plan_type, created_at",
        )
        .eq("id", auth.userId)
        .single();
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
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
      const updates = pickDeclared(input, UPDATABLE.profiles);
      if (!updates)
        return {
          content: [{ type: "text", text: "Error: no updatable fields given" }],
        };
      const { data, error } = await sb
        .from("profiles")
        .update(updates)
        .eq("id", auth.userId)
        .select("id, display_name")
        .single();
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [
          { type: "text", text: `Updated profile: ${JSON.stringify(data)}` },
        ],
      };
    },
  });

  // ── PROMPT KITS ───────────────────────────────────────────────────

  mcpServer.tool("list_prompt_kits", {
    description:
      "List your prompt kits (most recent first). A prompt kit is a Markdown bundle of related prompts separated by '## Prompt:' headings.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    handler: async ({ limit, offset }: { limit?: number; offset?: number }) => {
      const { from, to } = pageWindow(limit, offset);
      const { data, error } = await sb
        .from("prompt_kits")
        .select(
          "id, slug, title, category, tags, published, language, rating_avg, rating_count, created_at, updated_at",
        )
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(from, to);
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  mcpServer.tool("search_prompt_kits", {
    description:
      "Search your prompt kits by keyword in title, description or content. " +
      'Multiple words are matched as separate keywords; "quote a phrase" to keep it together. ' +
      "Searches everything you own, drafts and unpublished kits included.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Search keywords" } },
      required: ["query"],
    },
    handler: async ({ query }: { query: string }) => {
      return await runSearch(
        "prompt_kits",
        "id, slug, title, category, tags, published, language, updated_at",
        query,
      );
    },
  });

  mcpServer.tool("get_prompt_kit", {
    description:
      "Get full details of a prompt kit by ID (Markdown content with all '## Prompt:' items).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { data, error } = await sb
        .from("prompt_kits")
        .select("*")
        .eq("id", id)
        .eq("author_id", auth.userId)
        .single();
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  });

  mcpServer.tool("create_prompt_kit", {
    description:
      "Create a new prompt kit. The 'content' field must be Markdown using '## Prompt: <title>' headings to separate items.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        content: {
          type: "string",
          description:
            "Markdown bundle, e.g. '## Prompt: Outreach\\n\\nBody…\\n\\n## Prompt: Follow-up\\n\\nBody…'",
        },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["title", "content"],
    },
    handler: async (input: Record<string, unknown>) => {
      const { data, error } = await sb
        .from("prompt_kits")
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
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [
          { type: "text", text: `Created prompt kit: ${JSON.stringify(data)}` },
        ],
      };
    },
  });

  mcpServer.tool("update_prompt_kit", {
    description:
      "Update an existing prompt kit by ID. Only supply fields you want to change.",
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
      const id = input.id as string;
      const updates = pickDeclared(input, UPDATABLE.prompt_kits);
      if (!updates)
        return {
          content: [{ type: "text", text: "Error: no updatable fields given" }],
        };
      const { data, error } = await sb
        .from("prompt_kits")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .single();
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      return {
        content: [{ type: "text", text: `Updated: ${JSON.stringify(data)}` }],
      };
    },
  });

  mcpServer.tool("delete_prompt_kit", {
    description: "Delete a prompt kit by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }: { id: string }) => {
      const { data, error } = await sb
        .from("prompt_kits")
        .delete()
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id");
      if (error)
        return { content: [{ type: "text", text: `Error: ${error.message}` }] };
      if (!data || data.length === 0)
        return {
          content: [
            {
              type: "text",
              text: `Error: no prompt kit ${id} in your library, nothing was deleted`,
            },
          ],
        };
      return { content: [{ type: "text", text: `Deleted prompt kit ${id}` }] };
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

// robots.txt — block search engines from crawling the MCP endpoint
app.get("/robots.txt", (c) => {
  return c.newResponse("User-agent: *\nDisallow: /\n", 200, {
    ...corsHeaders,
    "Content-Type": "text/plain; charset=utf-8",
  });
});

// Friendly landing page for browsers / crawlers hitting GET without auth.
// Returns 200 + noindex so Google doesn't flag this as a 401 indexing error.
const landingHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex, nofollow" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Querino MCP Server</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:4rem auto;padding:0 1rem;line-height:1.5;color:#222}a{color:#4f46e5}</style>
</head>
<body>
<h1>Querino MCP Server</h1>
<p>This endpoint is a <a href="https://modelcontextprotocol.io/">Model Context Protocol</a> server and is not meant to be opened in a browser.</p>
<p>To connect an MCP client, generate a token in <a href="https://querino.ai/settings">Settings → MCP Server</a> on querino.ai.</p>
</body>
</html>`;

function isBrowserGet(req: Request): boolean {
  if (req.method !== "GET") return false;
  if (req.headers.get("authorization")) return false;
  const accept = req.headers.get("accept") ?? "";
  // Browsers and crawlers send Accept: text/html; MCP clients send application/json
  return accept.includes("text/html") || accept === "" || accept === "*/*";
}

// MCP endpoint — handle all common path variants the proxy may forward:
//   - "/"                     (Cloudflare Worker forwards mcp.querino.ai/ → /)
//   - "/mcp"                  (some clients append /mcp)
//   - "/mcp-server"           (raw Supabase functions/v1/mcp-server)
//   - "/mcp-server/mcp"       (legacy explicit path)
const mcpHandler = async (c: any) => {
  // Serve friendly landing page to browsers/crawlers instead of 401.
  if (isBrowserGet(c.req.raw)) {
    return c.newResponse(landingHtml, 200, {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    });
  }

  try {
    const auth = await authenticate(c.req.raw);
    const mcpServer = buildMcpServer(auth);
    const transport = new StreamableHttpTransport();
    // mcp-lite v0.10+: bind() returns the actual fetch handler bound to the server.
    const httpHandler = transport.bind(mcpServer);
    const response = await httpHandler(c.req.raw);

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
};

app.all("/", mcpHandler);
app.all("/mcp", mcpHandler);
app.all("/mcp-server", mcpHandler);
app.all("/mcp-server/mcp", mcpHandler);

Deno.serve(app.fetch);
