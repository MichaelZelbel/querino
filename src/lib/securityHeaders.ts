/**
 * Headers every HTML page of the production site carries.
 *
 * querino.ai sent no X-Frame-Options and no frame-ancestors (measured
 * 2026-09-30), so any site could load it in an invisible frame and trick a
 * signed-in visitor into clicking Delete, Publish or "Leave team" (clickjacking).
 * Nothing legitimate frames the production site.
 *
 * Only on the production hosts: the Lovable editor shows its preview of this
 * same build inside a frame, on a lovable.app address, and must keep working.
 */
const PRODUCTION_HOSTS = new Set(["querino.ai", "www.querino.ai"]);

export function frameGuardHeaders(
  requestUrl: string,
  contentType: string | null,
  /** Host and X-Forwarded-Host: behind a proxy the URL may name another host. */
  forwardedHosts: (string | null)[] = [],
): Record<string, string> {
  const hosts: string[] = [];
  try {
    hosts.push(new URL(requestUrl).hostname);
  } catch {
    // not a URL: only the forwarded hosts count
  }
  for (const h of forwardedHosts) {
    if (h)
      hosts.push(h.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase());
  }
  if (!hosts.some((h) => PRODUCTION_HOSTS.has(h))) return {};
  if (!(contentType ?? "").toLowerCase().includes("text/html")) return {};
  return {
    "Content-Security-Policy": "frame-ancestors 'none'",
    "X-Frame-Options": "DENY",
  };
}
