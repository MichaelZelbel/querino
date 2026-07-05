// Origin allowlist for browser-facing edge functions that spend AI credits.
// Public/integration endpoints (mcp-server, menerio callbacks, blog-api, ...)
// deliberately keep wildcard CORS — they are meant to be called from anywhere.

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
