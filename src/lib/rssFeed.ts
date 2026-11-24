/**
 * The RSS feed of what Querino publishes: the newest public prompts, skills,
 * workflows and prompt kits, and blog posts when there are any.
 *
 * Pure: it takes rows and returns XML, so a test can build the feed from
 * fixtures. The rows come from feeds.ts, which reads them with the anon client
 * through rssQuery (publicArtifacts.ts).
 *
 * Two rules hold here as well as in the query, so a query that drifts still
 * cannot leak:
 * - A row that is not public, or belongs to a team, is never an item.
 * - An item carries a summary, never the artifact's text. A prompt that is
 *   gated in a later release must not be readable through the feed.
 */

export type RssSource =
  "prompts" | "skills" | "workflows" | "prompt_kits" | "blog_posts";

/** One row as the feed's query selects it. */
export interface RssRow {
  title: string | null;
  slug: string | null;
  /** prompts: `summary`; blog posts: `excerpt`. */
  summary?: string | null;
  description?: string | null;
  /** prompts: `is_public`; the other three: `published`. */
  is_public?: boolean | null;
  published?: boolean | null;
  /** blog posts: `published`. */
  status?: string | null;
  team_id?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  author?: { display_name: string | null } | null;
}

export const RSS_ITEM_LIMIT = 50;
const SUMMARY_LENGTH = 300;

export const RSS_PATH_PREFIX: Record<RssSource, string> = {
  prompts: "/prompts",
  skills: "/skills",
  workflows: "/workflows",
  prompt_kits: "/prompt-kits",
  blog_posts: "/blog",
};

const KIND_LABEL: Record<RssSource, string> = {
  prompts: "Prompt",
  skills: "Skill",
  workflows: "Workflow",
  prompt_kits: "Prompt kit",
  blog_posts: "Blog post",
};

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Whether a row may be shown to a logged-out visitor at all. */
export function isFeedable(source: RssSource, row: RssRow): boolean {
  if (!row.slug || !row.title) return false;
  if (row.team_id) return false;
  switch (source) {
    case "prompts":
      return row.is_public === true;
    case "blog_posts":
      return row.status === "published";
    default:
      return row.published === true;
  }
}

/**
 * Plain text from a summary that may hold Markdown or HTML: tags, emphasis
 * marks and link syntax removed, whitespace collapsed, cut at a word.
 */
export function plainSummary(text: string | null | undefined): string {
  if (!text) return "";
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`~]+/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= SUMMARY_LENGTH) return plain;
  const cut = plain.slice(0, SUMMARY_LENGTH);
  const space = cut.lastIndexOf(" ");
  return `${(space > SUMMARY_LENGTH / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export interface RssItem {
  source: RssSource;
  title: string;
  link: string;
  summary: string;
  author: string;
  /** The moment it went public, or was created. */
  date: Date;
}

function itemDate(row: RssRow): Date | null {
  for (const value of [row.published_at, row.created_at]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

/**
 * The feed's items: only feedable rows, newest first, at most `limit`. Ties
 * keep a fixed order (by link), so the same rows always give the same feed.
 */
export function rssItems(
  origin: string,
  sources: Partial<Record<RssSource, RssRow[] | null>>,
  limit = RSS_ITEM_LIMIT,
): RssItem[] {
  const items: RssItem[] = [];
  for (const [source, rows] of Object.entries(sources) as Array<
    [RssSource, RssRow[] | null]
  >) {
    for (const row of rows ?? []) {
      if (!isFeedable(source, row)) continue;
      const date = itemDate(row);
      if (!date) continue;
      items.push({
        source,
        title: row.title!.trim(),
        link: `${origin}${RSS_PATH_PREFIX[source]}/${encodeURIComponent(row.slug!)}`,
        summary: plainSummary(row.summary || row.description),
        author: row.author?.display_name?.trim() || "Anonymous",
        date,
      });
    }
  }
  items.sort(
    (a, b) =>
      b.date.getTime() - a.date.getTime() ||
      (a.link < b.link ? -1 : a.link > b.link ? 1 : 0),
  );
  return items.slice(0, limit);
}

export function buildRssXml(
  origin: string,
  items: RssItem[],
  now: Date = new Date(),
): string {
  const body = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <dc:creator>${escapeXml(item.author)}</dc:creator>
      <category>${KIND_LABEL[item.source]}</category>
      <description>${escapeXml(item.summary)}</description>
    </item>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Querino</title>
    <link>${origin}/</link>
    <description>Newly published prompts, skills, workflows and prompt kits on Querino</description>
    <language>en</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>${body}
  </channel>
</rss>`;
}
