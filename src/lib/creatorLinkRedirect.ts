/**
 * The answer of /go/<item-id>. Kept apart from the route so tests/web can call
 * it with a stub lookup.
 *
 * The target is whatever the database stored for the item: the request is not
 * an argument, so no query string or header can choose where a visitor is sent.
 * Both lookups answer null unless the link is approved and the item public.
 * `follow` is follow_creator_link, which also counts the click; `peek` only
 * reads. A GET is a visitor following the link and is counted. A HEAD is a link
 * unfurler, prefetcher or uptime checker asking what is there: it gets the same
 * answer and headers as a GET and is never counted (#58).
 */
import { isUuid } from "@/lib/uuidRoute.ts";

export type CreatorLinkLookup = (
  itemId: string,
) => PromiseLike<{ data: string | null; error: { message: string } | null }>;

// noindex in the header, not a Disallow in robots.txt: a crawler that may not
// fetch /go/ never sees the noindex (see the comment at the top of robots.txt).
// no-store, because a cached redirect would not be counted.
const HEADERS = {
  "X-Robots-Tag": "noindex",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

function answer(status: number, extra: Record<string, string> = {}): Response {
  return new Response(null, { status, headers: { ...HEADERS, ...extra } });
}

/**
 * The page a visitor reads when a /go/ address leads nowhere (#73). Before, the
 * 404 had an empty body and the browser showed its own error screen, with no
 * way back. Static HTML on purpose: the answer is decided before the router
 * (unfollowableGoPath) or inside a server handler, where no React page renders.
 * It says nothing about why there is no link, so an unapproved or removed link
 * reads the same as an id that never existed.
 */
export const LINK_NOT_AVAILABLE_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Link not available | Querino</title>
    <meta name="robots" content="noindex" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; margin: 0; min-height: 100vh; display: flex; flex-direction: column; }
      header { border-bottom: 1px solid #e5e7eb; background: #fff; padding: 0.875rem 1.5rem; }
      header a { color: #111; font-weight: 700; font-size: 1.125rem; text-decoration: none; }
      main { flex: 1; display: grid; place-items: center; padding: 3rem 1.5rem; }
      .card { max-width: 30rem; text-align: center; }
      .code { font-size: 3rem; font-weight: 700; color: #111; margin: 0; }
      h1 { font-size: 1.5rem; margin: 0 0 0.75rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      .actions a { padding: 0.5rem 1rem; border-radius: 0.375rem; text-decoration: none; border: 1px solid #d1d5db; background: #fff; color: #111; }
      .actions a.primary { background: #111; color: #fff; border-color: #111; }
    </style>
  </head>
  <body>
    <header><a href="/">Querino</a></header>
    <main>
      <div class="card">
        <p class="code">404</p>
        <h1>This link is not available</h1>
        <p>The creator's link you followed does not exist or is no longer available on Querino. The address may be mistyped, or the link was removed.</p>
        <div class="actions">
          <a class="primary" href="/">Return to Home</a>
          <a href="/discover">Go to Discover</a>
        </div>
      </div>
    </main>
  </body>
</html>`;

// A 404 carrying that page. A HEAD gets the same status and headers, no body.
function notAvailable(method: "GET" | "HEAD"): Response {
  return new Response(method === "HEAD" ? null : LINK_NOT_AVAILABLE_PAGE, {
    status: 404,
    headers: { ...HEADERS, "Content-Type": "text/html; charset=utf-8" },
  });
}

function webAddress(stored: string): string | null {
  try {
    const url = new URL(stored);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/**
 * The answer for a /go/ path that can never be a creator link, decided on the
 * raw path before the router sees it; null for every other path.
 *
 * A real link is /go/<item-id>. Anything else under /go/ answers the same 404
 * the route gives an unknown id. Without this, an address-shaped path such as
 * /go/https://evil.example reached the router, which collapses the double slash
 * and first answered a 307 to its own /go/https:/evil.example before the 404.
 * A trailing slash after an id is left to the router, as before.
 */
export function unfollowableGoPath(
  pathname: string,
  method: string = "GET",
): Response | null {
  if (!pathname.startsWith("/go/")) return null;
  const rest = pathname.slice("/go/".length);
  const id = rest.endsWith("/") ? rest.slice(0, -1) : rest;
  if (isUuid(id)) return null;
  return notAvailable(method.toUpperCase() === "HEAD" ? "HEAD" : "GET");
}

export type CreatorLinkLookups = {
  /** Counts the click: follow_creator_link. */
  follow: CreatorLinkLookup;
  /** Reads only, counts nothing. */
  peek: CreatorLinkLookup;
};

export async function followCreatorLink(
  itemId: string,
  lookup: CreatorLinkLookup,
  method: "GET" | "HEAD" = "GET",
): Promise<Response> {
  if (!isUuid(itemId)) return notAvailable(method);
  const { data, error } = await lookup(itemId);
  if (error) {
    console.error("[go] creator link could not be read:", error.message);
    return answer(503);
  }
  const target = data ? webAddress(data) : null;
  if (!target) return notAvailable(method);
  // 302, not 301: the creator may change the address.
  return answer(302, { Location: target });
}

/** The answer of /go/<item-id> to a GET (counted) or a HEAD (never counted). */
export function answerCreatorLink(
  method: "GET" | "HEAD",
  itemId: string,
  lookups: CreatorLinkLookups,
): Promise<Response> {
  return followCreatorLink(
    itemId,
    method === "GET" ? lookups.follow : lookups.peek,
    method,
  );
}
