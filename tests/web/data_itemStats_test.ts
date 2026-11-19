import { assertEquals } from "@std/assert";
import { LLM_OPTIONS } from "@/lib/openLLM.ts";
import {
  BOT_USER_AGENT_PATTERN,
  ITEM_STATS_COLUMNS,
  type ItemStatsDay,
  isBotUserAgent,
  itemStatsKey,
  sendsColumn,
  shouldCountView,
  sumItemStats,
  summarizeByItem,
  windowStart,
} from "@/lib/itemStats.ts";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const FIREFOX =
  "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0";

function day(
  date: string,
  counts: Partial<ItemStatsDay> = {},
  id = "a",
): ItemStatsDay {
  return {
    item_type: "prompt",
    item_id: id,
    day: date,
    views: 0,
    copies: 0,
    sends_chatgpt: 0,
    sends_claude: 0,
    sends_gemini: 0,
    sends_perplexity: 0,
    clicks: 0,
    ...counts,
  };
}

Deno.test("bot user agents are not counted", () => {
  for (const bot of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36",
    "curl/8.5.0",
    "python-requests/2.32.3",
    "",
    undefined,
    null,
  ]) {
    assertEquals(isBotUserAgent(bot), true, String(bot));
  }
  for (const person of [CHROME, IPHONE, FIREFOX]) {
    assertEquals(isBotUserAgent(person), false, person);
  }
});

Deno.test("the author's own view is not counted", () => {
  assertEquals(
    shouldCountView({ userAgent: CHROME, viewerId: "u1", authorId: "u1" }),
    false,
  );
  assertEquals(
    shouldCountView({ userAgent: CHROME, viewerId: "u2", authorId: "u1" }),
    true,
  );
  assertEquals(
    shouldCountView({ userAgent: CHROME, viewerId: null, authorId: "u1" }),
    true,
  );
  assertEquals(
    shouldCountView({
      userAgent: "Googlebot/2.1",
      viewerId: null,
      authorId: "u1",
    }),
    false,
  );
});

Deno.test("the 7- and 30-day sums take the right daily rows", () => {
  const today = "2026-03-05";
  const rows = [
    day("2026-03-05", { views: 1 }), // today
    day("2026-02-27", { views: 10 }), // today - 6: last day of the 7
    day("2026-02-26", { views: 100 }), // today - 7: outside the 7
    day("2026-02-04", { views: 1000 }), // today - 29: last day of the 30
    day("2026-02-03", { views: 10000 }), // today - 30: outside both
    day("2026-03-06", { views: 100000 }), // tomorrow: outside both
  ];
  assertEquals(windowStart(today, 7), "2026-02-27");
  assertEquals(windowStart(today, 30), "2026-02-04");
  assertEquals(sumItemStats(rows, today, 7).views, 11);
  assertEquals(sumItemStats(rows, today, 30).views, 1111);
});

Deno.test("sends are split per assistant and summed per item", () => {
  const today = "2026-11-19";
  const rows = [
    day(today, { sends_chatgpt: 1, sends_claude: 2, copies: 3, clicks: 4 }),
    day("2026-11-18", { sends_gemini: 5, sends_perplexity: 6 }),
    day(today, { sends_claude: 7, views: 8 }, "b"),
  ];
  const a = sumItemStats(rows.slice(0, 2), today, 7);
  assertEquals(a.sends, { chatgpt: 1, claude: 2, gemini: 5, perplexity: 6 });
  assertEquals(a.sendsTotal, 14);
  assertEquals(a.copies, 3);
  assertEquals(a.clicks, 4);

  const byItem = summarizeByItem(rows, today, 30);
  assertEquals(byItem.size, 2);
  assertEquals(byItem.get(itemStatsKey("prompt", "a"))?.sendsTotal, 14);
  assertEquals(byItem.get(itemStatsKey("prompt", "b"))?.sends.claude, 7);
  assertEquals(byItem.get(itemStatsKey("prompt", "b"))?.views, 8);
});

// The tests below read the migration, because the database decides what is
// counted and the live suite cannot reach it before the migration is applied.
const MIGRATION =
  "supabase/migrations/20261119150000_a_creator_sees_how_their_items_are_used.sql";

function between(sql: string, start: string, end: string): string {
  const from = sql.indexOf(start);
  if (from < 0) throw new Error(`${start} is not in the migration`);
  const to = sql.indexOf(end, from + start.length);
  if (to < 0) throw new Error(`${start} has no ${end}`);
  return sql.slice(from, to);
}

function fn(sql: string, name: string): string {
  return between(sql, `CREATE OR REPLACE FUNCTION public.${name}(`, "$fn$;");
}

/** Whitespace-insensitive, so reformatting the SQL does not fail the test. */
function holds(text: string, fragment: string): boolean {
  const squash = (s: string) => s.replace(/\s+/g, " ");
  return squash(text).includes(squash(fragment));
}

Deno.test(
  "the database counts every assistant the send buttons offer",
  async () => {
    const sql = await Deno.readTextFile(MIGRATION);
    const table = between(sql, "CREATE TABLE public.item_stats_daily", ");\n");
    const events = between(sql, "CREATE TABLE public.item_use_events", ");\n");
    const record = fn(sql, "record_item_use");
    const add = between(
      sql,
      "CREATE OR REPLACE FUNCTION public.add_to_item_stats(",
      "$$;",
    );
    for (const { id } of LLM_OPTIONS) {
      const column = sendsColumn(id);
      assertEquals(holds(table, `${column} integer NOT NULL`), true, column);
      assertEquals(holds(events, `'${id}'`), true, `item_use_events: ${id}`);
      assertEquals(holds(record, `'${id}'`), true, `record_item_use: ${id}`);
      assertEquals(
        holds(add, `(p_count = '${id}')::int`),
        true,
        `insert ${id}`,
      );
      assertEquals(
        holds(add, `${column} = s.${column} + excluded.${column}`),
        true,
        `upsert ${id}`,
      );
      assertEquals(
        ITEM_STATS_COLUMNS.split(", ").includes(column),
        true,
        column,
      );
    }
  },
);

Deno.test(
  "the database keeps the author, bots and downloads out of the counts",
  async () => {
    const sql = await Deno.readTextFile(MIGRATION);
    const authorReturns =
      "IF auth.uid() IS NOT NULL AND public.is_item_owner(p_item_type, p_item_id, auth.uid()) THEN RETURN; END IF;";
    const publicOnly =
      "IF NOT public.is_item_public(p_item_type, p_item_id) THEN RETURN; END IF;";
    for (const name of ["record_item_use", "record_item_view"]) {
      assertEquals(
        holds(fn(sql, name), authorReturns),
        true,
        `${name}: author`,
      );
      assertEquals(holds(fn(sql, name), publicOnly), true, `${name}: public`);
    }

    assertEquals(
      holds(
        fn(sql, "record_item_view"),
        `IF coalesce(v_agent, '') = '' OR v_agent ~* '${BOT_USER_AGENT_PATTERN}' THEN RETURN;`,
      ),
      true,
      "record_item_view refuses the bots isBotUserAgent refuses",
    );

    assertEquals(
      holds(
        fn(sql, "record_item_use"),
        "IF p_item_type = 'prompt' AND p_channel <> 'download' THEN INSERT INTO public.prompt_copy_events",
      ),
      true,
      "a download never raises copies_count",
    );

    assertEquals(
      holds(
        sql,
        "ON public.item_stats_daily FOR SELECT TO authenticated USING (public.is_item_owner(item_type, item_id, auth.uid()));",
      ),
      true,
      "only the author reads the numbers",
    );
    assertEquals(
      sql.match(/CREATE POLICY/g)?.length,
      1,
      "item_stats_daily has that one policy and item_use_events none",
    );
  },
);
