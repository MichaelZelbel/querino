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

/**
 * Every table the sitemap lists. A collection has no slug: its page lives at
 * its id (collectionPath in collectionHead.ts), so it is a source of the
 * sitemap but not of the RSS feed.
 */
export type SitemapSource = SitemapTable | "collections";

/** One page of the sitemap's rows of one table: the public ones, newest first. */
export function sitemapPageQuery<Q extends PublicFilters<Q>>(
  from: PublicSource<Q>,
  table: SitemapSource,
  start: number,
  end: number,
): Q {
  let published: Q;
  if (table === "collections") {
    published = from.select("id, updated_at").filter("is_public", "eq", true);
  } else {
    const rows = from.select("slug, updated_at");
    published =
      table === "blog_posts"
        ? rows.filter("status", "eq", "published")
        : onlyPublic(rows, table);
  }
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
  skills: `title, slug, description, published, team_id, created_at, ${RSS_AUTHOR}`,
  workflows: `title, slug, description, published, team_id, created_at, ${RSS_AUTHOR}`,
  prompt_kits: `title, slug, description, published, team_id, created_at, ${RSS_AUTHOR}`,
  blog_posts:
    "title, slug, summary:excerpt, status, published_at, created_at, author:profiles!blog_posts_author_id_fkey(display_name)",
};

/**
 * The newest `limit` rows of one table for the RSS feed: public ones only, and
 * no team's rows, newest first by the date the feed shows (rssFeed.ts).
 */
export function rssQuery<Q extends PublicFilters<Q>>(
  from: PublicSource<Q>,
  table: SitemapTable,
  limit: number,
): Q {
  const rows = from.select(RSS_COLUMNS[table]);
  if (table === "blog_posts") {
    return rows
      .filter("status", "eq", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
  }
  const visible = onlyPublic(rows, table).filter("team_id", "is", "null");
  // Prompts record when they went public; an old row without that date falls
  // back to when it was created, after the dated ones.
  const dated =
    table === "prompts"
      ? visible.order("published_at", { ascending: false, nullsFirst: false })
      : visible;
  return dated
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
}
