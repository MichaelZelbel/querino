// Thin HTTP helpers. Every test talks to the deployed project over the same
// wire an attacker would use, so a test can only pass because the running
// system behaves, never because a local copy of the code reads well.

import {
  ANON_KEY,
  FUNCTIONS_URL,
  PROJECT_REF,
  REST_URL,
  SUPABASE_URL,
  requireTestUser,
  serviceRoleKey,
} from "./env";

export interface FnResponse {
  status: number;
  body: unknown;
  text: string;
}

type Caller =
  | { kind: "anonymous" }
  | { kind: "anon-key" }
  | { kind: "user"; accessToken: string }
  | { kind: "service-role" }
  | { kind: "internal-key"; secret: string };

/** POST a Supabase edge function as one of the callers above. */
export async function callFunction(
  name: string,
  body: unknown,
  caller: Caller,
): Promise<FnResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  switch (caller.kind) {
    case "anonymous":
      break;
    case "anon-key":
      headers.Authorization = `Bearer ${ANON_KEY}`;
      headers.apikey = ANON_KEY;
      break;
    case "user":
      headers.Authorization = `Bearer ${caller.accessToken}`;
      headers.apikey = ANON_KEY;
      break;
    case "service-role": {
      const key = await serviceRoleKey();
      headers.Authorization = `Bearer ${key}`;
      headers.apikey = key;
      break;
    }
    case "internal-key":
      headers.Authorization = `Bearer ${ANON_KEY}`;
      headers.apikey = ANON_KEY;
      headers["X-Internal-Key"] = caller.secret;
      break;
  }

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* leave as text */
  }
  return { status: res.status, body: parsed, text };
}

export const asAnonymous: Caller = { kind: "anonymous" };
export const asAnonKey: Caller = { kind: "anon-key" };
export const asServiceRole: Caller = { kind: "service-role" };
export const asUser = (accessToken: string): Caller => ({ kind: "user", accessToken });
export const asInternalKey = (secret: string): Caller => ({ kind: "internal-key", secret });

// ── Auth ──────────────────────────────────────────────────────────────

export interface Session {
  accessToken: string;
  userId: string;
}

let cachedSession: Session | null = null;

/** Sign in the non-admin test account. Cached for the run. */
export async function signInTestUser(): Promise<Session> {
  if (cachedSession) return cachedSession;
  const { email, password } = requireTestUser();

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    user?: { id: string };
    error_description?: string;
    msg?: string;
  };
  if (!res.ok || !json.access_token || !json.user) {
    throw new Error(
      `Test account sign-in failed (${res.status}): ${json.error_description ?? json.msg ?? "unknown"}`,
    );
  }
  cachedSession = { accessToken: json.access_token, userId: json.user.id };
  return cachedSession;
}

// ── PostgREST ─────────────────────────────────────────────────────────

interface RestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Extra PostgREST headers, e.g. { Prefer: "return=representation" }. */
  headers?: Record<string, string>;
}

export interface RestResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
  /** PostgREST's error object when the request was refused. */
  error: { code?: string; message?: string; details?: string } | null;
}

async function rest<T>(
  path: string,
  key: string,
  bearer: string,
  opts: RestOptions = {},
): Promise<RestResponse<T>> {
  const res = await fetch(`${REST_URL}/${path}`, {
    method: opts.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  const failed = !res.ok;
  return {
    status: res.status,
    ok: res.ok,
    data: (failed ? null : parsed) as T,
    error: failed ? (parsed as RestResponse["error"]) : null,
  };
}

/** PostgREST as the signed-in test user: RLS and triggers apply. */
export async function restAsUser<T = unknown>(
  path: string,
  opts: RestOptions = {},
): Promise<RestResponse<T>> {
  const session = await signInTestUser();
  return rest<T>(path, ANON_KEY, session.accessToken, opts);
}

/** PostgREST as service_role: bypasses RLS. Setup and teardown only. */
export async function restAsService<T = unknown>(
  path: string,
  opts: RestOptions = {},
): Promise<RestResponse<T>> {
  const key = await serviceRoleKey();
  return rest<T>(path, key, key, opts);
}

// ── MCP server ────────────────────────────────────────────────────────

/**
 * Call one MCP tool over JSON-RPC. The server answers as an SSE stream
 * ("data: {...}"), so unwrap that before parsing.
 */
export async function callMcpTool(
  token: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<{ status: number; text: string; isError: boolean }> {
  const res = await fetch(`${FUNCTIONS_URL}/mcp-server`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  const raw = await res.text();
  const payload = raw
    .split(/\r?\n/)
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim())
    .join("");

  let text = payload || raw;
  try {
    const json = JSON.parse(payload || raw) as {
      result?: { content?: Array<{ type: string; text?: string }> };
      error?: { message?: string };
    };
    text = json.result?.content?.map((c) => c.text ?? "").join("\n") ?? json.error?.message ?? raw;
  } catch {
    /* leave the raw body */
  }

  return { status: res.status, text, isError: text.startsWith("Error:") };
}

// ── Rolled-back SQL probes ────────────────────────────────────────────────

/**
 * Run SQL against the project inside BEGIN … ROLLBACK, through the Management
 * API, and return whatever the block raised.
 *
 * Some invariants can only be shown by breaking something: that a drifted
 * plan_type buys no credits needs a drifted plan_type, and that an overlapping
 * period is refused needs the account's real period in place. Doing that
 * through PostgREST means deleting rows and putting them back, and a suite
 * that can leave the test account without an allowance is a suite that breaks
 * the thing it is checking.
 *
 * The convention: the SQL ends with `RAISE EXCEPTION 'PROBE OK %', log;` so the
 * transaction can never commit even if the rollback were skipped, and the log
 * comes back in the error message.
 */
/**
 * Whether the account-scoped Supabase token is available.
 *
 * sqlProbe needs it, because rolling a transaction back is only possible
 * through the Management API. CI does not have it on purpose: this repository
 * is public, and that token reaches every Supabase project on the account, not
 * just this one. The tests that need it skip there and run on a developer
 * machine, where `. scripts/secrets.sh` provides it.
 */
export function hasManagementToken(): boolean {
  return Boolean(process.env.SUPABASE_ACCESS_TOKEN);
}

export async function sqlProbe(sql: string): Promise<string> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN is needed for SQL probes. Run: . scripts/secrets.sh",
    );
  }

  // A WAF in front of api.supabase.com rejects bodies with long prose comments
  // (403, "error code: 1010"), so whole-line -- comments never go over the wire.
  const body = sql
    .split(/\r?\n/)
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: `BEGIN;\n${body}\nROLLBACK;` }),
    },
  );

  const text = await res.text();
  let parsed: { message?: string } | string;
  try {
    parsed = JSON.parse(text) as { message?: string };
  } catch {
    parsed = text;
  }
  return typeof parsed === "string" ? parsed : (parsed.message ?? text);
}

/**
 * Run a read-only query against the project through the Management API and
 * return its rows.
 *
 * Some invariants are only visible in the catalogue: which functions set
 * search_path, which tables have row-level security, which views run as their
 * caller. PostgREST does not expose pg_catalog, and it should not.
 *
 * Read-only by convention rather than by enforcement, so keep it that way:
 * anything that changes state belongs in sqlProbe, which rolls back.
 */
export async function sqlQuery<T = unknown>(sql: string): Promise<T[]> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SUPABASE_ACCESS_TOKEN is needed for catalogue queries. Run: . scripts/secrets.sh");
  }

  const body = sql
    .split(/\r?\n/)
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: body }),
    },
  );

  const text = await res.text();
  if (!res.ok) throw new Error(`Catalogue query failed (${res.status}): ${text.slice(0, 400)}`);
  return JSON.parse(text) as T[];
}
