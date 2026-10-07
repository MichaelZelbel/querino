// The one place that decides which Menerio address an edge function may
// call.
//
// menerio_integration.menerio_base_url is written by the settings page, but
// the table's UPDATE policy is `auth.uid() = user_id` with no column
// constraint, so any signed-in user can point their own row anywhere through
// PostgREST. process-menerio-sync-queue and render-for-menerio then fetch
// that address verbatim from inside the Supabase network, with the user's
// Menerio API key in a header. That is a server-side request forgery: the
// address could name an internal service, a metadata endpoint, or a host the
// attacker controls that collects the key.
//
// The settings page hard-codes one Menerio host (MenerioIntegrationSection.tsx,
// MENERIO_BASE_URL), so every legitimate row carries that host or a subdomain
// of it. Anything else is refused before a single byte leaves.

export const MENERIO_HOST = "tjeapelvjlmbxafsmjef.supabase.co";

/**
 * Returns the base URL to build Menerio calls on, or throws a plain Error
 * naming what was wrong. Accepted: https, the Menerio host or a subdomain of
 * it, no username or password, no port other than the default.
 *
 * The returned value keeps the path (the real address ends in /functions/v1,
 * which the callers append /receive-note to) with any trailing slashes,
 * query string and fragment removed, so callers can concatenate a path onto
 * it without checking the shape again.
 */
export function assertMenerioBaseUrl(raw: string): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error("Menerio base URL is empty");
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Menerio base URL is not a valid URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Menerio base URL must use https");
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error("Menerio base URL must not carry credentials");
  }
  // URL normalises the default port away, so anything left here is not it.
  if (url.port !== "") {
    throw new Error("Menerio base URL must not name a port");
  }

  const host = url.hostname.toLowerCase();
  if (host !== MENERIO_HOST && !host.endsWith(`.${MENERIO_HOST}`)) {
    throw new Error("Menerio base URL points at a host that is not Menerio");
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

// ── The link callback (7 October 2026) ──────────────────────────────────────
//
// menerio-link-callback POSTs the user's Menerio API key to the callback URL
// that arrives in the browser's address bar (?menerio_callback=...), so that
// URL is attacker-supplied. Until 2026-10-07 only its host was pinned. Every
// Menerio function lives on that one host, under /functions/v1/<name>, so a
// crafted link could name any of them, and Querino would hand the victim's
// key to whichever one stores, forwards or echoes what it is sent.
// Menerio builds this URL in exactly one form (ForwardToAppDialog.tsx and
// GlobalCreateButton.tsx: `${SUPABASE_URL}/functions/v1/link-note`), so
// exactly that form is accepted. The path is a constant, never derived from
// menerio_base_url: that column is user-writable, and a base ending in
// /functions/v1/other would otherwise move the callback to another function.

export const MENERIO_LINK_CALLBACK_PATH = "/functions/v1/link-note";

/**
 * Returns the URL to POST the link to, or throws a plain Error naming what was
 * wrong. Accepted: https, exactly the host of the registered (and checked)
 * Menerio base URL, no credentials, no port, exactly
 * MENERIO_LINK_CALLBACK_PATH, no query string and no fragment. The returned
 * URL is rebuilt from the checked parts, not the raw string.
 */
export function assertMenerioLinkCallback(
  rawCallback: unknown,
  registeredBaseUrl: string,
): URL {
  if (typeof rawCallback !== "string" || rawCallback.trim() === "") {
    throw new Error("menerio_callback is empty");
  }

  let url: URL;
  try {
    url = new URL(rawCallback.trim());
  } catch {
    throw new Error("menerio_callback is not a valid URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("menerio_callback must use https");
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error("menerio_callback must not carry credentials");
  }
  if (url.port !== "") {
    throw new Error("menerio_callback must not name a port");
  }
  // Throws on its own if the stored base is not Menerio's.
  const allowedHost = new URL(assertMenerioBaseUrl(registeredBaseUrl)).host;
  if (url.host !== allowedHost) {
    throw new Error(
      "menerio_callback host does not match registered Menerio base URL",
    );
  }
  if (url.pathname !== MENERIO_LINK_CALLBACK_PATH) {
    throw new Error("menerio_callback is not Menerio's link-note address");
  }
  if (url.search !== "" || url.hash !== "") {
    throw new Error("menerio_callback must not carry a query or fragment");
  }

  return new URL(MENERIO_LINK_CALLBACK_PATH, url.origin);
}
