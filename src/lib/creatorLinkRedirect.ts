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
export function unfollowableGoPath(pathname: string): Response | null {
  if (!pathname.startsWith("/go/")) return null;
  const rest = pathname.slice("/go/".length);
  const id = rest.endsWith("/") ? rest.slice(0, -1) : rest;
  return isUuid(id) ? null : answer(404);
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
): Promise<Response> {
  if (!isUuid(itemId)) return answer(404);
  const { data, error } = await lookup(itemId);
  if (error) {
    console.error("[go] creator link could not be read:", error.message);
    return answer(503);
  }
  const target = data ? webAddress(data) : null;
  if (!target) return answer(404);
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
  );
}
