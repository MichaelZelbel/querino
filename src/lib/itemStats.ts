/**
 * What an item's author is shown about its use (#48): page views, sends per
 * assistant, copies (Download .md included) and creator-link clicks, summed
 * over the last 7 and 30 days from the daily rows of item_stats_daily.
 *
 * Kept free of React and the Supabase client so tests/web can reach it. The
 * database (migration 20261119150000) decides what is counted; the checks here
 * only spare a request it would refuse anyway.
 */
import type { CreatorLinkItemType } from "@/lib/creatorLink.ts";
import { LLM_OPTIONS, type LLMTarget } from "@/lib/openLLM.ts";

export type UsageItemType = CreatorLinkItemType;

/** How an item left the page: a copy, a download, or a send to an assistant. */
export type ItemUseChannel = "copy" | "download" | LLMTarget;

/** The item_stats_daily column that counts sends to one assistant. */
export type SendsColumn = `sends_${LLMTarget}`;

export function sendsColumn(target: LLMTarget): SendsColumn {
  return `sends_${target}`;
}

/** One row of item_stats_daily. `day` is the UTC date, YYYY-MM-DD. */
export type ItemStatsDay = {
  item_type: UsageItemType;
  item_id: string;
  day: string;
  views: number;
  copies: number;
  clicks: number;
} & Record<SendsColumn, number>;

export interface ItemStatsSummary {
  views: number;
  copies: number;
  sends: Record<LLMTarget, number>;
  sendsTotal: number;
  clicks: number;
}

// A literal, so supabase-js can type the rows; tests/web checks it names
// every sendsColumn.
export const ITEM_STATS_COLUMNS =
  "item_type, item_id, day, views, copies, sends_chatgpt, sends_claude, sends_gemini, sends_perplexity, clicks";

/**
 * Known bots, matched case-insensitively against the user agent. Written so it
 * means the same as a Postgres `~*` pattern and a JS RegExp with the `i` flag:
 * the migration holds this exact string, and tests/web checks that it does.
 */
export const BOT_USER_AGENT_PATTERN =
  "bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|embedly|preview|curl|wget|python|httpclient|okhttp|go-http-client|java/|libwww|scrapy|axios|node-fetch|phantomjs|selenium|puppeteer|playwright";

const BOT_USER_AGENT = new RegExp(BOT_USER_AGENT_PATTERN, "i");

/** A missing or empty user agent counts as a bot, as it does in the database. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_USER_AGENT.test(userAgent);
}

export function shouldCountView(input: {
  userAgent: string | null | undefined;
  viewerId: string | null | undefined;
  authorId: string | null | undefined;
}): boolean {
  if (isBotUserAgent(input.userAgent)) return false;
  return !(input.viewerId && input.viewerId === input.authorId);
}

/** The UTC date, which is what Postgres current_date is on Supabase. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The first day of a window of `days` days that ends with `today`. */
export function windowStart(today: string, days: number): string {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return utcDay(start);
}

export function emptyItemStatsSummary(): ItemStatsSummary {
  return {
    views: 0,
    copies: 0,
    sends: { chatgpt: 0, claude: 0, gemini: 0, perplexity: 0 },
    sendsTotal: 0,
    clicks: 0,
  };
}

function addDay(summary: ItemStatsSummary, row: ItemStatsDay): void {
  summary.views += row.views;
  summary.copies += row.copies;
  for (const { id } of LLM_OPTIONS) {
    const sends = row[sendsColumn(id)];
    summary.sends[id] += sends;
    summary.sendsTotal += sends;
  }
  summary.clicks += row.clicks;
}

function inWindow(row: ItemStatsDay, today: string, days: number): boolean {
  return row.day >= windowStart(today, days) && row.day <= today;
}

export function sumItemStats(
  rows: readonly ItemStatsDay[],
  today: string,
  days: number,
): ItemStatsSummary {
  const summary = emptyItemStatsSummary();
  for (const row of rows) if (inWindow(row, today, days)) addDay(summary, row);
  return summary;
}

export function itemStatsKey(itemType: UsageItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

export function summarizeByItem(
  rows: readonly ItemStatsDay[],
  today: string,
  days: number,
): Map<string, ItemStatsSummary> {
  const byItem = new Map<string, ItemStatsSummary>();
  for (const row of rows) {
    if (!inWindow(row, today, days)) continue;
    const key = itemStatsKey(row.item_type, row.item_id);
    let summary = byItem.get(key);
    if (!summary) {
      summary = emptyItemStatsSummary();
      byItem.set(key, summary);
    }
    addDay(summary, row);
  }
  return byItem;
}
