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

// What the get_* tools return: every column of the table except `embedding`
// (1536 floats, which `select("*")` pretty-printed into the model's context
// on every call, several hundred kilobytes of numbers per artifact) and
// `fts` (the full-text index, derived from the columns already listed). The
// lists mirror src/integrations/supabase/types.ts, so a new column has to be
// added here to be visible over MCP.
const DETAIL_COLUMNS = {
  prompts:
    "id, slug, title, description, content, category, tags, language, is_public, published_at, summary, example_output, copies_count, rating_avg, rating_count, author_id, team_id, menerio_synced, menerio_note_id, menerio_synced_at, embedding_failed_at, created_at, updated_at",
  skills:
    "id, slug, title, description, content, category, tags, language, published, rating_avg, rating_count, author_id, team_id, menerio_synced, menerio_note_id, menerio_synced_at, embedding_failed_at, created_at, updated_at",
  workflows:
    "id, slug, title, description, content, json, filename, scope, category, tags, language, published, rating_avg, rating_count, author_id, team_id, menerio_synced, menerio_note_id, menerio_synced_at, embedding_failed_at, created_at, updated_at",
  prompt_kits:
    "id, slug, title, description, content, category, tags, language, published, rating_avg, rating_count, author_id, team_id, menerio_synced, menerio_note_id, menerio_synced_at, embedding_failed_at, created_at, updated_at",
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

/**
 * The window for every search_* tool: limit 1..50 (default 30, what search
 * always returned), offset 0 or more.
 */
function searchWindow(
  limit: unknown,
  offset: unknown,
): { limit: number; offset: number } {
  return {
    limit: Math.min(Math.max(Math.floor(Number(limit)) || 30, 1), 50),
    offset: Math.max(Math.floor(Number(offset)) || 0, 0),
  };
}

/**
 * The rows as JSON, and, when the query fetched one row more than the limit,
 * a second line saying the list was cut off and how to get the rest.
 */
function searchResult(rows: unknown[], limit: number, offset: number) {
  const truncated = rows.length > limit;
  const shown = truncated ? rows.slice(0, limit) : rows;
  const content = [
    { type: "text" as const, text: JSON.stringify(shown, null, 2) },
  ];
  if (truncated) {
    content.push({
      type: "text" as const,
      text: `Showing ${shown.length} results from offset ${offset}; more match. Call again with offset ${offset + limit} for the next page, or narrow the query.`,
    });
  }
  return { content };
}

/**
 * A failed tool call. MCP clients tell a result from an error by isError, not
 * by reading the text: until 2026-09-23 every failure here came back as an
 * ordinary result that happened to start with "Error:", and an agent could
 * take a PostgREST message for the data it asked for.
 */
function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

/** A string column the database allows to be NULL, so a caller can clear it. */
const NULLABLE_STRING = { type: ["string", "null"] } as const;

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
   * check: first "every word appears somewhere", then, only if that matches
   * nothing at all, "any word appears somewhere". A near miss the caller can
   * reject beats a clean "nothing found" it will repeat as fact. The offset
   * pages within whichever pass answers, never across the two.
   *
   * Ownership is filtered here rather than by RLS, because this client holds
   * the service-role key. `published` is deliberately not filtered: these
   * tools search the caller's own shelf, drafts included.
   */
  const runSearch = async (
    table: string,
    columns: string,
    query: string,
    limit?: unknown,
    offset?: unknown,
  ) => {
    // One row more than asked for tells whether the answer was cut off.
    // Until 2026-09-23 every search stopped at 30 without saying so, and an
    // agent had no way to know there was a 31st match.
    const window = searchWindow(limit, offset);
    const select = () =>
      sb
        .from(table)
        .select(columns)
        .eq("author_id", auth.userId)
        .order("updated_at", { ascending: false })
        .range(window.offset, window.offset + window.limit);
    const answer = (rows: unknown[] | null) =>
      searchResult(rows ?? [], window.limit, window.offset);

    const strictFilters = allTermsFilters(SEARCH_COLUMNS, query);
    let strict = select();
    for (const filter of strictFilters) {
      strict = strict.or(filter);
    }

    const { data, error } = await strict;
    if (error) return toolError(error.message);
    if (data && data.length > 0) return answer(data);

    const loose = anyTermFilter(SEARCH_COLUMNS, query);
    // One term is already its own loose pass, and a blank query has no terms
    // at all; sending `or=()` in either case would be a parse error.
    if (!loose || tokenizeSearchQuery(query).length < 2) return answer(data);

    // Every page of one search comes from the same pass. An empty strict page
    // past offset 0 may only mean the strict matches ran out; until
    // 2026-09-23 that page fell through to the loose pass at the same offset,
    // so page 3 of a strict answer came back as loose matches 60 to 90, a
    // different list that skipped its own first pages. The loose pass is used
    // only when the strict pass matches nothing at all.
    if (window.offset > 0) {
      let anyStrict = sb
        .from(table)
        .select("id")
        .eq("author_id", auth.userId)
        .limit(1);
      for (const filter of strictFilters) {
        anyStrict = anyStrict.or(filter);
      }
      const { data: strictRows, error: strictErr } = await anyStrict;
      if (strictErr) return toolError(strictErr.message);
      if (strictRows && strictRows.length > 0) return answer(data);
    }

    const { data: partial, error: partialError } = await select().or(loose);
    if (partialError) return toolError(partialError.message);
    return answer(partial);
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
      if (error) return toolError(error.message);
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
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: {
          type: "number",
          description: "Max results (default 30, max 50)",
        },
        offset: { type: "number", description: "Offset for pagination" },
      },
      required: ["query"],
    },
    handler: async ({
      query,
      limit,
      offset,
    }: {
      query: string;
      limit?: number;
      offset?: number;
    }) => {
      return await runSearch(
        "prompts",
        "id, title, category, tags, is_public, language, updated_at",
        query,
        limit,
        offset,
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
        .select(DETAIL_COLUMNS.prompts)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) return toolError("No prompt with that id in your library");
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
      if (error) return toolError(error.message);
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
      if (!updates) return toolError("no updatable fields given");
      const { data, error } = await sb
        .from("prompts")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) {
        return toolError(
          "No prompt with that id in your library, nothing was changed",
        );
      }
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
      if (error) return toolError(error.message);
      if (!data || data.length === 0) {
        return toolError(
          `no prompt ${id} in your library, nothing was deleted`,
        );
      }
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
      if (error) return toolError(error.message);
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
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: {
          type: "number",
          description: "Max results (default 30, max 50)",
        },
        offset: { type: "number", description: "Offset for pagination" },
      },
      required: ["query"],
    },
    handler: async ({
      query,
      limit,
      offset,
    }: {
      query: string;
      limit?: number;
      offset?: number;
    }) => {
      return await runSearch(
        "skills",
        "id, title, category, tags, published, language, updated_at",
        query,
        limit,
        offset,
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
        .select(DETAIL_COLUMNS.skills)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) return toolError("No skill with that id in your library");
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
      if (error) return toolError(error.message);
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
        description: NULLABLE_STRING,
        content: { type: "string" },
        category: NULLABLE_STRING,
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (input: Record<string, unknown>) => {
      const id = input.id as string;
      const updates = pickDeclared(input, UPDATABLE.skills);
      if (!updates) return toolError("no updatable fields given");
      const { data, error } = await sb
        .from("skills")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) {
        return toolError(
          "No skill with that id in your library, nothing was changed",
        );
      }
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
      if (error) return toolError(error.message);
      if (!data || data.length === 0) {
        return toolError(`no skill ${id} in your library, nothing was deleted`);
      }
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
      if (error) return toolError(error.message);
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
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: {
          type: "number",
          description: "Max results (default 30, max 50)",
        },
        offset: { type: "number", description: "Offset for pagination" },
      },
      required: ["query"],
    },
    handler: async ({
      query,
      limit,
      offset,
    }: {
      query: string;
      limit?: number;
      offset?: number;
    }) => {
      return await runSearch(
        "workflows",
        "id, title, category, tags, published, language, updated_at",
        query,
        limit,
        offset,
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
        .select(DETAIL_COLUMNS.workflows)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) return toolError("No workflow with that id in your library");
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
      if (error) return toolError(error.message);
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
        description: NULLABLE_STRING,
        content: NULLABLE_STRING,
        json: { type: "object" },
        category: NULLABLE_STRING,
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (input: Record<string, unknown>) => {
      const id = input.id as string;
      const updates = pickDeclared(input, UPDATABLE.workflows);
      if (!updates) return toolError("no updatable fields given");
      const { data, error } = await sb
        .from("workflows")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) {
        return toolError(
          "No workflow with that id in your library, nothing was changed",
        );
      }
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
      if (error) return toolError(error.message);
      if (!data || data.length === 0) {
        return toolError(
          `no workflow ${id} in your library, nothing was deleted`,
        );
      }
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
      if (error) return toolError(error.message);
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
        .maybeSingle();
      if (colErr) return toolError(colErr.message);
      if (!col) return toolError("No collection with that id in your library");

      // A failed items query is an error, not an empty collection: an
      // agent told "this collection has no items" will repeat it as fact.
      const { data: items, error: itemsErr } = await sb
        .from("collection_items")
        .select("id, item_id, item_type, sort_order")
        .eq("collection_id", id)
        .order("sort_order");
      if (itemsErr) return toolError(itemsErr.message);

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
      if (error) return toolError(error.message);
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
      if (error) return toolError(error.message);
      if (!data || data.length === 0) {
        return toolError(
          `no collection ${id} in your library, nothing was deleted`,
        );
      }
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
      if (error) return toolError(error.message);
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
        display_name: NULLABLE_STRING,
        bio: NULLABLE_STRING,
        website: NULLABLE_STRING,
        twitter: NULLABLE_STRING,
        github: NULLABLE_STRING,
      },
    },
    handler: async (input: Record<string, unknown>) => {
      const updates = pickDeclared(input, UPDATABLE.profiles);
      if (!updates) return toolError("no updatable fields given");
      const { data, error } = await sb
        .from("profiles")
        .update(updates)
        .eq("id", auth.userId)
        .select("id, display_name")
        .single();
      if (error) return toolError(error.message);
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
      if (error) return toolError(error.message);
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
      properties: {
        query: { type: "string", description: "Search keywords" },
        limit: {
          type: "number",
          description: "Max results (default 30, max 50)",
        },
        offset: { type: "number", description: "Offset for pagination" },
      },
      required: ["query"],
    },
    handler: async ({
      query,
      limit,
      offset,
    }: {
      query: string;
      limit?: number;
      offset?: number;
    }) => {
      return await runSearch(
        "prompt_kits",
        "id, slug, title, category, tags, published, language, updated_at",
        query,
        limit,
        offset,
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
        .select(DETAIL_COLUMNS.prompt_kits)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) return toolError("No prompt kit with that id in your library");
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
      if (error) return toolError(error.message);
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
        description: NULLABLE_STRING,
        content: { type: "string" },
        category: NULLABLE_STRING,
        tags: { type: "array", items: { type: "string" } },
        published: { type: "boolean" },
        language: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (input: Record<string, unknown>) => {
      const id = input.id as string;
      const updates = pickDeclared(input, UPDATABLE.prompt_kits);
      if (!updates) return toolError("no updatable fields given");
      const { data, error } = await sb
        .from("prompt_kits")
        .update(updates)
        .eq("id", id)
        .eq("author_id", auth.userId)
        .select("id, title")
        .maybeSingle();
      if (error) return toolError(error.message);
      if (!data) {
        return toolError(
          "No prompt kit with that id in your library, nothing was changed",
        );
      }
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
      if (error) return toolError(error.message);
      if (!data || data.length === 0) {
        return toolError(
          `no prompt kit ${id} in your library, nothing was deleted`,
        );
      }
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

  // Two separate catches, because the two failures mean different things to
  // a client. A bad token is the caller's problem and gets a 401 with the
  // reason. A transport failure is ours: one catch around both used to
  // answer 401 for it too, so an MCP client saw "Authentication failed" and
  // threw away a perfectly good token.
  let auth: Auth;
  try {
    auth = await authenticate(c.req.raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    return c.json({ error: msg }, 401, corsHeaders);
  }

  try {
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
    console.error(
      "mcp-server transport error:",
      err instanceof Error ? err.message : err,
    );
    return c.json(
      { error: "The MCP server could not handle this request" },
      500,
      corsHeaders,
    );
  }
};

app.all("/", mcpHandler);
app.all("/mcp", mcpHandler);
app.all("/mcp-server", mcpHandler);
app.all("/mcp-server/mcp", mcpHandler);

Deno.serve(app.fetch);
