// Failed MCP sign-ins, counted per caller address. After
// MCP_AUTH_FAILURE_LIMIT failed token checks in one window, the address is
// answered 429 until the window ends. Tokens are long random secrets, so this
// is about the lookup each try costs and the log it fills, not about guessing
// (open since the 2026-09-30 audit).
//
// Issue #42 asks for two things that cannot both hold for a valid token from
// an address over the limit: a 429 "without a token lookup", and "a request
// with a valid token is never slowed down". The valid token wins. Over the
// limit, a request with no token or a malformed one is answered 429 with no
// lookup at all; a well-formed token is still looked up and let in when it is
// valid. Otherwise a shared address (an office NAT, a proxy) or a forged one
// would lock real people out of their assistants.
//
// The window starts at an address's first failure and lasts
// MCP_AUTH_FAILURE_WINDOW_SECONDS; a failure after it has passed starts a new
// one. The database keeps that rule in record_mcp_auth_failure (migration
// 20261119120000), and the store below is its seam, so the rule can be tested
// here without a database.

import {
  authenticateMcpRequest,
  type McpAuthOutcome,
  type TokenLookup,
} from "./mcpGate.ts";

export const MCP_AUTH_FAILURE_LIMIT = 20;
export const MCP_AUTH_FAILURE_WINDOW_SECONDS = 600;

export type FailureWindow = { failures: number; startedAt: Date };

export interface McpAuthFailureStore {
  /** The address's current count, or null when it has none. */
  read(addressHash: string): Promise<FailureWindow | null>;
  /**
   * Counts one failure. A window that started `windowSeconds` or more ago
   * starts again at one.
   */
  record(addressHash: string, windowSeconds: number): Promise<void>;
}

export type McpAuthLimiter = {
  store: McpAuthFailureStore;
  /** From hashCallerAddress; null when the caller's address is unknown. */
  addressHash: string | null;
  /**
   * A key every caller shares (hash of a constant). Failures are counted under
   * it as well, because no request header is provably written by the platform:
   * a caller who forges the address on each try still reaches the limit.
   * Optional; when unset only the address is counted.
   */
  globalHash?: string | null;
  now: Date;
};

export type LimitedMcpAuthOutcome =
  | McpAuthOutcome
  | {
      ok: false;
      status: 429;
      reason: "too_many_failures";
      message: string;
      retryAfterSeconds: number;
    };

/** Seconds until the address may try again; 0 when it is not limited. */
export function retryAfterSeconds(
  window: FailureWindow | null,
  now: Date,
): number {
  if (!window || window.failures < MCP_AUTH_FAILURE_LIMIT) return 0;
  const left =
    window.startedAt.getTime() +
    MCP_AUTH_FAILURE_WINDOW_SECONDS * 1000 -
    now.getTime();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

/**
 * The caller's address from a header the platform's proxy writes, never from
 * one the caller can pick: Cf-Connecting-Ip (Cloudflare overwrites a client's
 * value), else the LAST X-Forwarded-For entry (each proxy appends the peer it
 * saw, so a caller can only add entries to the left of it). Forging a left
 * entry therefore does not change the key. Null when neither is present: that
 * request is not counted. Mis-keying can at worst turn bad-token 401s into
 * 429s sooner; a valid token is never refused.
 */
export function callerAddress(req: Request): string | null {
  const cf = (req.headers.get("cf-connecting-ip") ?? "").trim();
  if (cf) return cf;
  const entries = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return entries.at(-1) ?? null;
}

/**
 * HMAC-SHA256 of the address. Keyed, because a plain hash of an IPv4 address
 * is undone by hashing all four billion of them.
 */
export async function hashCallerAddress(
  address: string,
  key: string,
): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(address)),
  );
  let hex = "";
  for (const b of mac) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/**
 * authenticateMcpRequest behind the failed-sign-in limit. Every 401 under the
 * limit counts as a failure; a good token and a failed lookup (503, our fault)
 * do not. Over the limit the request still goes through the plain check, which
 * looks a token up only when it is well formed; a good token and a 503 are
 * answered as always, every other refusal becomes a 429, and nothing more is
 * counted. A store that cannot be read or written lets the request through to
 * the normal check: the limit saves cost, it is not what keeps anyone out.
 */
export async function authenticateMcpRequestWithLimit(
  req: Request,
  lookup: TokenLookup,
  limiter: McpAuthLimiter,
): Promise<LimitedMcpAuthOutcome> {
  const { store, now } = limiter;
  const keys = [limiter.addressHash, limiter.globalHash].filter(
    (k): k is string => !!k,
  );
  if (keys.length === 0) return authenticateMcpRequest(req, lookup);

  let wait = 0;
  for (const key of keys) {
    try {
      wait = Math.max(wait, retryAfterSeconds(await store.read(key), now));
    } catch (e) {
      console.warn(
        `mcp auth limit: count not read: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  const outcome = await authenticateMcpRequest(req, lookup);
  if (outcome.ok || outcome.status === 503) return outcome;
  if (wait > 0) {
    return {
      ok: false,
      status: 429,
      reason: "too_many_failures",
      message:
        "Too many failed sign-ins from this address. Try again after the Retry-After interval.",
      retryAfterSeconds: wait,
    };
  }
  for (const key of keys) {
    try {
      await store.record(key, MCP_AUTH_FAILURE_WINDOW_SECONDS);
    } catch (e) {
      console.warn(
        `mcp auth limit: failure not counted: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  return outcome;
}

export type TooManyFailures = Extract<LimitedMcpAuthOutcome, { status: 429 }>;

/** The 429 answer, with the seconds left in the window as Retry-After. */
export function tooManyFailuresResponse(
  outcome: TooManyFailures,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: outcome.message }), {
    status: 429,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Retry-After": String(outcome.retryAfterSeconds),
    },
  });
}
