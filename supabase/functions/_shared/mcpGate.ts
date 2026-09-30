// The MCP server's front door: who is calling, which methods it answers, and
// what a 400 from the transport was about. Kept apart from mcp-server/index.ts
// so it can be tested without a database or a network.

// Long-lived MCP token prefixes recognised by the server. Anything else (a
// Supabase session JWT starts with "ey") is refused.
export const MCP_TOKEN_PREFIXES = ["qrn_mcp_", "mnr_mcp_"];

/**
 * Looks a token up by its SHA-256. `error` is set when the lookup itself
 * failed, which is not the same thing as "no such token".
 */
export type TokenLookup = (
  tokenHash: string,
) => Promise<{ userId: string | null; error: string | null }>;

export type McpAuthReason =
  "missing" | "wrong_prefix" | "unknown_or_expired" | "lookup_error";

export type McpAuthOutcome =
  | { ok: true; userId: string }
  | {
      ok: false;
      status: 401 | 503;
      reason: McpAuthReason;
      /** Safe to show the caller: never token material, never a DB message. */
      message: string;
      /** For the log only: what went wrong inside, still without the token. */
      detail?: string;
    };

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  let hex = "";
  for (const b of digest) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/**
 * Who is calling, from the bearer token.
 *
 * A token the database does not know is a 401, which tells an MCP client to
 * drop the token and ask for a new one. A lookup that failed is a 503: until
 * 2026-09-30 both were one thrown error answered 401, so a database or network
 * hiccup (one happened on 2026-09-25) made clients throw away a perfectly
 * good token, the same mistake the transport catch in index.ts had already
 * been fixed for.
 */
export async function authenticateMcpRequest(
  req: Request,
  lookup: TokenLookup,
): Promise<McpAuthOutcome> {
  // "Bearer " with nothing after it arrives as "Bearer" (header values are
  // trimmed), which is a missing token, not a token called "Bearer".
  const header = (req.headers.get("authorization") ?? "").trim();
  const bearer = header.match(/^Bearer(?:\s+(.*))?$/i);
  const token = (bearer ? (bearer[1] ?? "") : header).trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      reason: "missing",
      message: "Missing authorization token",
    };
  }

  if (!MCP_TOKEN_PREFIXES.some((p) => token.startsWith(p))) {
    return {
      ok: false,
      status: 401,
      reason: "wrong_prefix",
      message:
        "Invalid token. Expected a long-lived Querino MCP token (qrn_mcp_… or mnr_mcp_…). " +
        "Generate one in Settings → MCP Server.",
    };
  }

  let found: { userId: string | null; error: string | null };
  try {
    found = await lookup(await sha256Hex(token));
  } catch (e) {
    found = { userId: null, error: e instanceof Error ? e.message : String(e) };
  }

  if (found.error) {
    return {
      ok: false,
      status: 503,
      reason: "lookup_error",
      message:
        "The token could not be checked just now. Nothing is wrong with it; please try again in a moment.",
      detail: found.error.slice(0, 200),
    };
  }
  if (!found.userId) {
    return {
      ok: false,
      status: 401,
      reason: "unknown_or_expired",
      message: "Invalid, revoked, or expired token",
    };
  }
  return { ok: true, userId: found.userId };
}

/**
 * Methods the server answers itself, before authentication and before the
 * transport. Null means "carry on".
 *
 * This server keeps no sessions, so it has no event stream to offer, and the
 * MCP spec's answer to a client's GET for one is 405. mcp-lite 0.10.0 gets
 * there only when the client names protocol 2025-06-18: it negotiates any
 * version it does not know down to 2025-03-26, and then answers the client's
 * GET, which carries that version, with 400 "Protocol version mismatch".
 * Clients survive it, but every such session logged a 400 and some clients
 * treat a 400 there as a broken server. The call runs before the token check
 * because no token makes a GET succeed, and it saves a database round trip.
 * A browser's GET never gets here: index.ts serves it the landing page first.
 */
export function mcpMethodGate(req: Request): Response | null {
  if (req.method === "GET" || req.method === "HEAD") {
    return new Response(
      req.method === "HEAD"
        ? null
        : JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message:
                "Method not allowed: this server has no event stream. Send requests with POST.",
            },
            id: null,
          }),
      {
        status: 405,
        headers: { Allow: "POST", "Content-Type": "application/json" },
      },
    );
  }
  return null;
}

// A method name or a protocol version, or a word for what it was instead.
// Anything else a caller put in those fields is replaced, so the log never
// carries the text of a prompt, only protocol metadata.
const METHOD_NAME = /^[a-z][a-z0-9_/]{0,63}$/i;
const PROTOCOL_VERSION = /^\d{4}-\d{2}-\d{2}$/;

/**
 * What a 400 from the transport was about, for the log. The body is only
 * parsed for its JSON-RPC method; the reason is the transport's own words.
 */
export function describeMcpBadRequest(
  requestBody: string,
  protocolHeader: string | null,
  responseBody: string,
): { method: string; protocol: string; reason: string } {
  let method: string;
  if (!requestBody.trim()) {
    method = "empty";
  } else {
    try {
      const parsed = JSON.parse(requestBody) as unknown;
      if (Array.isArray(parsed)) method = "batch";
      else if (parsed && typeof parsed === "object") {
        const m = (parsed as { method?: unknown }).method;
        method =
          typeof m === "string" ? (METHOD_NAME.test(m) ? m : "other") : "none";
      } else method = "other";
    } catch {
      method = "unparseable";
    }
  }

  const protocol = !protocolHeader
    ? "none"
    : PROTOCOL_VERSION.test(protocolHeader.trim())
      ? protocolHeader.trim()
      : "other";

  let reason = responseBody.slice(0, 120);
  try {
    const parsed = JSON.parse(responseBody) as {
      error?: { message?: unknown };
    };
    if (typeof parsed?.error?.message === "string") {
      reason = parsed.error.message.slice(0, 120);
    }
  } catch {
    // plain text from the transport, kept as it is
  }

  return { method, protocol, reason };
}
