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

/**
 * The Content-Security-Policy, one directive per line so a change reads as one.
 *
 * Added 2026-10-07, after a review found the live policy said nothing but
 * frame-ancestors:
 *   object-src 'none'   no <object> or <embed>. Nothing here uses a plugin, and
 *                       a plugin is a way to run script that the rest of the
 *                       policy never sees.
 *   base-uri 'self'     an injected <base href> would quietly re-point every
 *                       relative script and link on the page at another host.
 *
 * There is deliberately no script-src (and no default-src, which would act as
 * one). TanStack Start writes its hydration data as inline <script> tags into
 * every server-rendered page, and Lovable's analytics add a script after the
 * visitor accepts the cookie banner. Neither carries a nonce, so a script-src
 * without 'unsafe-inline' breaks every page, and one with it protects nothing.
 * The day the server hands out a nonce per response is the day to add it.
 */
const CONTENT_SECURITY_POLICY = [
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

/**
 * Browser features no Querino page uses, switched off for the page and for
 * anything it embeds, so a script that does get in cannot ask for them either.
 * Clipboard access is left alone: every artifact page has a Copy button.
 */
const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "bluetooth=()",
  "browsing-topics=()",
  "camera=()",
  "display-capture=()",
  "geolocation=()",
  "gyroscope=()",
  "hid=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "serial=()",
  "usb=()",
].join(", ");

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
    "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    "Permissions-Policy": PERMISSIONS_POLICY,
    "X-Frame-Options": "DENY",
  };
}
