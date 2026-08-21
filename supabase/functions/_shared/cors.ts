// Origin allowlist for browser-facing edge functions that spend AI credits.
// Public and integration endpoints (mcp-server, menerio callbacks, blog-api)
// deliberately keep wildcard CORS: they are meant to be called from anywhere,
// and two of them are called by Menerio's own frontend, so scoping them would
// break that integration rather than protect it.
//
// Finding S5 of the 2026-08-20 audit says this helper reaches only 9 of 34
// functions and the rest hardcode Access-Control-Allow-Origin: *. That count is
// right. What it is worth was measured on 21 August, and the answer is: almost
// nothing, in this architecture.
//
// CORS stops a malicious site making a request that carries a credential the
// browser attaches by itself. This project has no such credential. Nothing here
// reads a cookie (grep: zero hits outside a sitemap entry for the cookies
// page), and nothing authorises on the Origin header (grep: this file is the
// only reader). Every credential travels in Authorization, apikey, x-api-key or
// x-internal-key, none of which a cross-origin page can set without already
// holding the value. So wildcard CORS lets evil.com call an endpoint from a
// visitor's browser exactly as it could from its own server with curl.
//
// The real guard is the one inside each function: getCallerUserId, the internal
// key, an admin check, or an MCP token. That is where a new endpoint needs
// attention, not here.
//
// This helper is still worth applying to a new browser-facing function, because
// defence in depth is cheap when you are already in the file. It was not worth
// rewriting and redeploying fifteen working functions for.

const STATIC_ALLOWED = new Set([
  "https://querino.ai",
  "https://www.querino.ai",
  "http://localhost:8080",
  "http://localhost:5173",
]);

function isAllowedOrigin(origin: string): boolean {
  if (STATIC_ALLOWED.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    // Lovable preview/sandbox origins
    return host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com");
  } catch {
    return false;
  }
}

/**
 * CORS headers reflecting the request origin when allowlisted, falling back
 * to the production origin otherwise (which makes cross-origin browser calls
 * from unknown sites fail the CORS check).
 */
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "https://querino.ai",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
