// Failed MCP sign-ins, counted per caller address. After
// MCP_AUTH_FAILURE_LIMIT failed token checks in one window, the address is
// answered 429 until the window ends, before any token lookup. Tokens are long
// random secrets, so this is about the lookup each try costs and the log it
// fills, not about guessing (open since the 2026-09-30 audit).
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
 * The caller's address as the platform's proxy reports it: the first entry of
 * X-Forwarded-For. A caller can put its own entries in front, so this keeps
 * honest callers apart rather than stopping a determined one; either way the
 * worst a forged address buys is what every caller had before the limit.
 */
export function callerAddress(req: Request): string | null {
  const first = (req.headers.get("x-forwarded-for") ?? "").split(",")[0];
  const address = first.trim();
  return address || null;
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
 * authenticateMcpRequest behind the failed-sign-in limit. Every 401 counts as
 * a failure; a good token and a failed lookup (503, our fault) do not, and a
 * good token is never refused while the address is under the limit. A store
 * that cannot be read or written lets the request through to the normal check:
 * the limit saves cost, it is not what keeps anyone out.
 */
export async function authenticateMcpRequestWithLimit(
  req: Request,
  lookup: TokenLookup,
  limiter: McpAuthLimiter,
): Promise<LimitedMcpAuthOutcome> {
  const { store, addressHash, now } = limiter;
  if (!addressHash) return authenticateMcpRequest(req, lookup);

  let window: FailureWindow | null = null;
  try {
    window = await store.read(addressHash);
  } catch (e) {
    console.warn(
      `mcp auth limit: count not read: ${e instanceof Error ? e.message : e}`,
    );
  }
  const wait = retryAfterSeconds(window, now);
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

  const outcome = await authenticateMcpRequest(req, lookup);
  if (!outcome.ok && outcome.status === 401) {
    try {
      await store.record(addressHash, MCP_AUTH_FAILURE_WINDOW_SECONDS);
    } catch (e) {
      console.warn(
        `mcp auth limit: failure not counted: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  return outcome;
}
