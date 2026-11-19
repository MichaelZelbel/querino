/**
 * The queries for what the public sees, made outside the list hooks: the home
 * page's counts, the sitemap and the command palette.
 *
 * Each takes its column from ARTIFACT_PUBLIC_COLUMN. These readers used to
 * spell `is_public` and `published` out by hand, and a copy that drifted would
 * count, list or offer a private row. Kept apart from the readers, which need
 * the Supabase client, so a test can see every one of them filter.
 */
import {
  ARTIFACT_PUBLIC_COLUMN,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";
import { allTermsFilters } from "@/lib/postgrestFilter.ts";

export const ARTIFACT_TABLES = [
  "prompts",
  "skills",
  "workflows",
  "prompt_kits",
] as const satisfies readonly ArtifactListTable[];

/** The part of a PostgREST filter builder these queries use. */
export interface PublicFilters<Q> {
  filter(column: string, operator: "eq" | "is", value: boolean | string): Q;
  or(filters: string): Q;
  order(
    column: string,
    options: { ascending: boolean; nullsFirst?: boolean },
  ): Q;
  range(from: number, to: number): Q;
  limit(count: number): Q;
}

/** The part of `supabase.from(table)` these queries use. */
export interface PublicSource<Q> {
  select(columns: string, options?: { count: "exact"; head: true }): Q;
}

/**
 * Only the rows a logged-out visitor may open. The filter is explicit, not
 * left to row-level security: a signed-in owner can read their own drafts.
 */
export function onlyPublic<Q extends PublicFilters<Q>>(
  query: Q,
  table: ArtifactListTable,
): Q {
  return query.filter(ARTIFACT_PUBLIC_COLUMN[table], "eq", true);
}

/** How many public rows a table holds, without downloading them. */
export function publicCountQuery<Q extends PublicFilters<Q>>(
  from: PublicSource<Q>,
  table: ArtifactListTable,
): Q {
  return onlyPublic(from.select("id", { count: "exact", head: true }), table);
}

export type SitemapTable = ArtifactListTable | "blog_posts";

/** One page of the sitemap's rows of one table: the public ones, newest first. */
export function sitemapPageQuery<Q extends PublicFilters<Q>>(
  from: PublicSource<Q>,
  table: SitemapTable,
  start: number,
  end: number,
): Q {
  const rows = from.select("slug, updated_at");
  const published =
    table === "blog_posts"
      ? rows.filter("status", "eq", "published")
      : onlyPublic(rows, table);
  return (
    published
      .order("updated_at", { ascending: false })
      // A background job gives many rows the same updated_at in one
      // transaction. Without a unique last key those tied rows could land on
      // two pages or on none once there is more than one page (listOrder.ts).
      .order("id", { ascending: true })
      .range(start, end)
  );
}

/**
 * The palette's search of everyone's public prompts, on a select of the
 * prompts table: every word of `query` somewhere in `columns`, best rated
 * first.
 */
export function publicPromptSearchQuery<Q extends PublicFilters<Q>>(
  prompts: Q,
  query: string,
  columns: readonly string[],
): Q {
  return allTermsFilters(columns, query)
    .reduce((acc, filter) => acc.or(filter), onlyPublic(prompts, "prompts"))
    .order("rating_avg", { ascending: false })
    .limit(8);
}

const RSS_AUTHOR = "author:author_id (display_name)";

/**
 * What the RSS feed selects: the title, the summary and the date, never the
 * artifact's text (rssFeed.ts), and the columns that prove a row is public.
 */
export const RSS_COLUMNS: Record<SitemapTable, string> = {
  prompts: `title, slug, summary, description, is_public, team_id, published_at, created_at, ${RSS_AUTHOR}`,
  skills: `title, slug, description, published, team_id, published_at, created_at, ${RSS_AUTHOR}`,
  workflows: `title, slug, description, published, team_id, published_at, created_at, ${RSS_AUTHOR}`,
  prompt_kits: `title, slug, description, published, team_id, published_at, created_at, ${RSS_AUTHOR}`,
  blog_posts:
    "title, slug, summary:excerpt, status, published_at, created_at, author:profiles!blog_posts_author_id_fkey(display_name)",
};

/**
 * The three tables that got published_at in migration 20261119160000. Until
 * that migration is applied to a database, asking them for the column fails
 * with Postgres 42703, and the feed asks again without it (rssRows).
 */
const DATED_SINCE_66: ReadonlySet<SitemapTable> = new Set([
  "skills",
  "workflows",
  "prompt_kits",
]);

/** The columns the feed asked for before the database dated every type. */
function undatedColumns(table: SitemapTable): string {
  return RSS_COLUMNS[table].replace(" published_at,", "");
}

/**
 * The newest `limit` rows of one table for the RSS feed: public ones only, and
 * no team's rows, newest first by the date the feed shows (rssFeed.ts).
 */
export function rssQuery<Q extends PublicFilters<Q>>(
  from: PublicSource<Q>,
  table: SitemapTable,
  limit: number,
  { undated = false }: { undated?: boolean } = {},
): Q {
  const withoutDate = undated && DATED_SINCE_66.has(table);
  const rows = from.select(
    withoutDate ? undatedColumns(table) : RSS_COLUMNS[table],
  );
  if (table === "blog_posts") {
    return rows
      .filter("status", "eq", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
  }
  const visible = onlyPublic(rows, table).filter("team_id", "is", "null");
  // The database records when each item first went public
  // (stamp_published_at); a row without that date falls back to when it was
  // created, after the dated ones.
  const dated = withoutDate
    ? visible
    : visible.order("published_at", { ascending: false, nullsFirst: false });
  return dated
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
}

/** The part of a PostgREST answer the feed reads. */
export interface RssAnswer {
  data: unknown[] | null;
  error: { code?: string; message: string } | null;
}

/**
 * One table's rows for the feed. On a database that does not have
 * published_at on skills, workflows or prompt kits yet (Postgres 42703,
 * undefined column), it asks again without the column, so those items are
 * dated by when they were created, as before #66, instead of the whole feed
 * answering 500. Once the migration is live the second question is never
 * asked. Any other error is returned as it came.
 */
export async function rssRows(
  table: SitemapTable,
  ask: (options: { undated: boolean }) => PromiseLike<RssAnswer>,
): Promise<RssAnswer> {
  const first = await ask({ undated: false });
  if (first.error?.code !== "42703" || !DATED_SINCE_66.has(table)) {
    return first;
  }
  return ask({ undated: true });
}
