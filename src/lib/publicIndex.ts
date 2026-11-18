/**
 * The paging loop behind /prompts, /skills, /workflows and /prompt-kits, without
 * the Supabase client, so the Deno unit tests (tests/web) can drive it with a
 * stubbed request. `loadPublicIndex` in route-loaders.ts supplies the query.
 *
 * One transient failure is retried once (issue #27). A browser re-run of the
 * loader once got HTTP 500 "Project not specified" from Supabase on a cold
 * start, and the very next request with the same query was clean; the visitor
 * saw "Couldn't load this page" for what one more try would have answered.
 *
 * Transient means a 5xx or a request that never got an answer (postgrest-js
 * reports a network failure as status 0). A 4xx is the request's own fault and
 * would fail the same way again, so it surfaces at once. The retry is bounded at
 * one: when both tries fail the loader still throws, and the router's error page
 * ("Couldn't load this page", "Try again", HTTP 500 that a crawler retries) is
 * what the visitor sees, as before.
 *
 * postgrest-js already retries 503 and 520 by itself (and network errors), but
 * not a plain 500, which is what was seen.
 */

export interface PublicIndexEntry {
  slug: string;
  title: string;
  description: string | null;
}

export interface IndexPageResult {
  data: unknown[] | null;
  error: { message: string } | null;
  /** The HTTP status; 0 when the request got no answer at all. */
  status: number;
}

/** Fetches rows [from, to] (inclusive, as PostgREST's range). */
export type FetchIndexPage = (
  from: number,
  to: number,
) => PromiseLike<IndexPageResult>;

export const INDEX_PAGE = 1000;

/** Worth one more try: no answer at all, or a server error. */
export function isTransientStatus(status: number): boolean {
  return status === 0 || (status >= 500 && status <= 599);
}

/** Runs the request, and once more only when the first try failed transiently. */
export async function retryTransientOnce(
  run: () => PromiseLike<IndexPageResult>,
  wait: () => Promise<void> = () =>
    new Promise((resolve) => setTimeout(resolve, 300)),
): Promise<IndexPageResult> {
  const first = await run();
  if (!first.error || !isTransientStatus(first.status)) return first;
  console.warn(
    `[route-loaders] transient failure (HTTP ${first.status}), trying once more:`,
    first.error.message,
  );
  await wait();
  return await run();
}

export async function collectPublicIndex(
  table: string,
  fetchPage: FetchIndexPage,
  wait?: () => Promise<void>,
): Promise<PublicIndexEntry[]> {
  const entries: PublicIndexEntry[] = [];
  for (let from = 0; ; from += INDEX_PAGE) {
    const { data, error } = await retryTransientOnce(
      () => fetchPage(from, from + INDEX_PAGE - 1),
      wait,
    );
    // A thrown error reaches the router's error boundary and answers 500, which a
    // crawler retries. A short list would be taken at its word.
    if (error)
      throw new Error(`Index query for ${table} failed: ${error.message}`);
    const page = (data ?? []) as Array<{
      slug: string | null;
      title: string | null;
      description: string | null;
    }>;
    for (const row of page) {
      if (!row.slug || !row.title) continue;
      entries.push({
        slug: row.slug,
        title: row.title,
        description: row.description,
      });
    }
    if (page.length < INDEX_PAGE) break;
  }
  return entries;
}
