/**
 * The answer of /go/<item-id>. Kept apart from the route so tests/web can call
 * it with a stub lookup.
 *
 * The target is whatever the database stored for the item: the request is not
 * an argument, so no query string or header can choose where a visitor is sent.
 * `lookup` is follow_creator_link, which also counts the click and answers null
 * unless the link is approved and the item public.
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
