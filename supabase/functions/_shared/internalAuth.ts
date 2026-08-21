// The one gate for machine-only endpoints.
//
// Some edge functions exist mainly for our own scheduled jobs to call:
// github-sync-worker, ai-moderate-content, process-menerio-sync-queue, and the
// batch_init branch of ensure-token-allowance. Before this file, "internal"
// meant "knows the anon key", and the anon key ships inside every visitor's
// browser bundle. Three of those four had no check in the code at all, so in
// practice a stranger could drain the GitHub sync queue using other people's
// stored tokens, force Menerio syncs, or run a loop against the paid AI
// moderation endpoint and send us the bill.
//
// THE RULE, which has no third option:
//
//   An edge function never reads an identity from a request body. It derives
//   it from the JWT with getCallerUserId, or it is a machine endpoint and
//   requires X-Internal-Key.
//
// Findings C1, C2 and H2 were all the same mistake, made three times.
//
// THE THIRD CALLER NOBODY WROTE DOWN
//
// Two of these endpoints also have a human caller: the Admin page has a
// "trigger AI review" button (ModerationPanel.tsx) and runs batch_init on
// mount (Admin.tsx). Those arrive as an ordinary user JWT, not as a job. So
// "machine-only" is really "not a member of the public": pg_cron with the
// shared secret, admin tooling with the service-role key, or a signed-in
// admin. Use requireMachineOrAdmin where a human button exists and
// requireMachineCaller where one does not.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HEADER = "X-Internal-Key";

/**
 * Compare two secrets without leaking their length or contents through timing.
 * Returns false for empty input, so a missing env var can never match and an
 * unconfigured function fails closed rather than open.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function bearerOf(req: Request): string {
  return (req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

/** True when the caller presented the shared machine secret. */
export function hasInternalKey(req: Request): boolean {
  const secret = Deno.env.get("INTERNAL_JOB_SECRET") ?? "";
  if (!secret) {
    // Loud, because the alternative is a machine endpoint that silently
    // accepts nobody and a queue that silently stops draining.
    console.error(
      "[internalAuth] INTERNAL_JOB_SECRET is not set on this project. Every machine call will be refused.",
    );
    return false;
  }
  const presented = (req.headers.get(HEADER) ?? req.headers.get(HEADER.toLowerCase()) ?? "").trim();
  return constantTimeEquals(presented, secret);
}

/** True when the caller presented the service-role key as its bearer token. */
export function hasServiceRoleKey(req: Request): boolean {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!key) return false;
  return constantTimeEquals(bearerOf(req), key);
}

/**
 * A machine caller is either one of our jobs holding the shared secret, or
 * something already trusted with the service-role key (admin tooling, a
 * database trigger). Both are ours; neither is reachable from a browser.
 */
export function isMachineCaller(req: Request): boolean {
  return hasInternalKey(req) || hasServiceRoleKey(req);
}

/**
 * True when the bearer token is a valid session for a user who holds the admin
 * role. Reads user_roles through the is_admin RPC, which is the authoritative
 * source; profiles.role can drift and is never used for authorization.
 *
 * Costs a round trip, so callers check isMachineCaller first.
 */
export async function isAdminCaller(req: Request): Promise<boolean> {
  const token = bearerOf(req);
  if (!token) return false;

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceKey) return false;

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user?.id) return false;

    const { data: isAdmin, error: roleError } = await admin.rpc("is_admin", {
      _user_id: userData.user.id,
    });
    if (roleError) {
      console.error("[internalAuth] is_admin lookup failed:", roleError.message);
      return false;
    }
    return isAdmin === true;
  } catch (err) {
    console.error("[internalAuth] admin check threw:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** The 401 every machine endpoint returns. Deliberately says nothing useful. */
export function unauthorized(extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

/**
 * Guard for an endpoint only our jobs may call. Returns a 401 Response to
 * return as-is, or null when the caller may proceed.
 *
 *   const denied = requireMachineCaller(req, corsHeaders);
 *   if (denied) return denied;
 */
export function requireMachineCaller(
  req: Request,
  extraHeaders: Record<string, string> = {},
): Response | null {
  if (isMachineCaller(req)) return null;
  console.warn("[internalAuth] refused a caller with no valid internal key");
  return unauthorized(extraHeaders);
}

/**
 * Guard for an endpoint our jobs call on a schedule AND an admin can trigger
 * by hand. Same 401, one extra round trip when the caller is not a machine.
 */
export async function requireMachineOrAdmin(
  req: Request,
  extraHeaders: Record<string, string> = {},
): Promise<Response | null> {
  if (isMachineCaller(req)) return null;
  if (await isAdminCaller(req)) return null;
  console.warn("[internalAuth] refused a caller that is neither a job nor an admin");
  return unauthorized(extraHeaders);
}
