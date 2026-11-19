import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import {
  buildRssXml,
  plainSummary,
  RSS_ITEM_LIMIT,
  type RssRow,
  rssItems,
} from "@/lib/rssFeed.ts";
import {
  ARTIFACT_TABLES,
  RSS_COLUMNS,
  rssQuery,
} from "@/lib/publicArtifacts.ts";

const ORIGIN = "https://querino.ai";
const NOW = new Date("2026-11-19T12:00:00Z");
const SECRET = "THE-PROMPT-TEXT-ITSELF";

const author = (name: string) => ({ display_name: name });

/** Fixture rows of all four types, plus one private and one team row. */
function fixtures() {
  return {
    prompts: [
      {
        title: "Summarise a meeting",
        slug: "summarise-a-meeting",
        summary: "Turns a **transcript** into <b>decisions</b> & actions",
        description: "unused when there is a summary",
        is_public: true,
        team_id: null,
        published_at: "2026-11-18T10:00:00Z",
        created_at: "2026-01-01T00:00:00Z",
        content: SECRET,
        author: author("Ada"),
      },
      {
        title: "Private draft",
        slug: "private-draft",
        description: "never in the feed",
        is_public: false,
        team_id: null,
        published_at: null,
        created_at: "2026-11-19T11:00:00Z",
        content: SECRET,
        author: author("Ada"),
      },
    ],
    skills: [
      {
        title: "Review a pull request",
        slug: "review-a-pull-request",
        description: "Finds risky changes",
        published: true,
        team_id: null,
        created_at: "2026-11-17T10:00:00Z",
        content: SECRET,
        author: author("Grace"),
      },
      {
        title: "Team-only skill",
        slug: "team-only-skill",
        description: "only the team may see this",
        published: true,
        team_id: "0b000000-0000-4000-a000-0000000000aa",
        created_at: "2026-11-19T11:30:00Z",
        content: SECRET,
        author: author("Grace"),
      },
    ],
    workflows: [
      {
        title: "Weekly research digest",
        slug: "weekly-research-digest",
        description: "Collects the week's papers",
        published: true,
        team_id: null,
        created_at: "2026-11-18T12:00:00Z",
        content: SECRET,
        author: null,
      },
    ],
    prompt_kits: [
      {
        title: "Launch week kit",
        slug: "launch-week-prompt-kit",
        description: "Everything for a launch",
        published: true,
        team_id: null,
        created_at: "2026-11-16T09:00:00Z",
        content: SECRET,
        author: author("Linus"),
      },
    ],
  } satisfies Record<string, Array<RssRow & { content: string }>>;
}

/** Every tag opened is closed in order; a cheap well-formedness check. */
function assertWellFormed(xml: string) {
  const body = xml.replace(/^<\?xml[^>]*\?>/, "");
  const stack: string[] = [];
  for (const m of body.matchAll(/<(\/?)([a-zA-Z:]+)[^>]*?(\/?)>/g)) {
    const [, close, name, selfClose] = m;
    if (selfClose) continue;
    if (close) assertEquals(stack.pop(), name, `closing </${name}>`);
    else stack.push(name);
  }
  assertEquals(stack, []);
  // No raw ampersand that is not an entity.
  assertEquals(body.match(/&(?!(amp|lt|gt|quot|apos);)/g), null);
}

function items(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, inner]) => {
    const get = (tag: string) =>
      inner.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1];
    return {
      title: get("title"),
      link: get("link"),
      guid: get("guid"),
      pubDate: get("pubDate"),
      creator: get("dc:creator"),
      description: get("description"),
    };
  });
}

Deno.test("the feed is RSS 2.0 titled Querino, valid and complete", () => {
  const xml = buildRssXml(ORIGIN, rssItems(ORIGIN, fixtures()), NOW);
  assertWellFormed(xml);
  assert(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assertStringIncludes(xml, '<rss version="2.0"');
  assertStringIncludes(xml, "<channel>\n    <title>Querino</title>");
  assertStringIncludes(xml, `<link>${ORIGIN}/</link>`);
  assertStringIncludes(
    xml,
    `<atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>`,
  );
  for (const item of items(xml)) {
    assert(item.title, "title");
    assert(item.description, "description");
    assert(item.creator, "author");
    assertEquals(item.link, item.guid);
    assertEquals(new Date(item.pubDate!).toUTCString(), item.pubDate);
  }
});

Deno.test(
  "public items of all four types, newest first; private and team rows are absent",
  () => {
    const xml = buildRssXml(ORIGIN, rssItems(ORIGIN, fixtures()), NOW);
    const got = items(xml);
    assertEquals(
      got.map((i) => i.link),
      [
        `${ORIGIN}/workflows/weekly-research-digest`,
        `${ORIGIN}/prompts/summarise-a-meeting`,
        `${ORIGIN}/skills/review-a-pull-request`,
        `${ORIGIN}/prompt-kits/launch-week-prompt-kit`,
      ],
    );
    assert(!xml.includes("private-draft"));
    assert(!xml.includes("Private draft"));
    assert(!xml.includes("team-only-skill"));
    assert(!xml.includes("only the team"));
  },
);

Deno.test(
  "an item carries its summary, author and public date, never the text",
  () => {
    const xml = buildRssXml(ORIGIN, rssItems(ORIGIN, fixtures()), NOW);
    assert(!xml.includes(SECRET));
    const prompt = items(xml).find((i) =>
      i.link?.endsWith("/summarise-a-meeting"),
    )!;
    assertEquals(
      prompt.description,
      "Turns a transcript into decisions &amp; actions",
    );
    assertEquals(prompt.creator, "Ada");
    // The date it went public, not the date it was created.
    assertEquals(prompt.pubDate, "Wed, 18 Nov 2026 10:00:00 GMT");
    const workflow = items(xml).find((i) =>
      i.link?.endsWith("/weekly-research-digest"),
    )!;
    assertEquals(workflow.creator, "Anonymous");
    assertEquals(workflow.pubDate, "Wed, 18 Nov 2026 12:00:00 GMT");
  },
);

Deno.test(
  "each type is dated by when it went public, not when it was drafted",
  () => {
    const drafted = "2026-10-01T09:00:00Z";
    const older = {
      published_at: "2026-11-10T09:00:00Z",
      created_at: "2026-11-09T09:00:00Z",
    };
    const row = (type: string, published_at: string | null) => ({
      title: `${type} ${published_at ?? "undated"}`,
      slug: `${type}-${published_at ? published_at.slice(11, 13) : "undated"}`,
      team_id: null,
      published_at,
      created_at: drafted,
    });
    const list = rssItems(ORIGIN, {
      prompts: [
        { ...row("prompt", "2026-11-19T11:00:00Z"), is_public: true },
        { ...row("prompt", null), is_public: true },
        { ...row("prompt", null), ...older, slug: "p-old", is_public: true },
      ],
      skills: [
        { ...row("skill", "2026-11-19T10:00:00Z"), published: true },
        { ...row("skill", null), ...older, slug: "s-old", published: true },
      ],
      workflows: [
        { ...row("workflow", "2026-11-19T09:00:00Z"), published: true },
        { ...row("workflow", null), ...older, slug: "w-old", published: true },
      ],
      prompt_kits: [
        { ...row("kit", "2026-11-19T08:00:00Z"), published: true },
        { ...row("kit", null), ...older, slug: "k-old", published: true },
      ],
    });
    assertEquals(
      list.slice(0, 4).map((i) => [i.link, i.date.toISOString()]),
      [
        [`${ORIGIN}/prompts/prompt-11`, "2026-11-19T11:00:00.000Z"],
        [`${ORIGIN}/skills/skill-10`, "2026-11-19T10:00:00.000Z"],
        [`${ORIGIN}/workflows/workflow-09`, "2026-11-19T09:00:00.000Z"],
        [`${ORIGIN}/prompt-kits/kit-08`, "2026-11-19T08:00:00.000Z"],
      ],
    );
    // A row without the date falls back to when it was created.
    const undated = list.find((i) => i.link.endsWith("/prompt-undated"))!;
    assertEquals(undated.date.toISOString(), "2026-10-01T09:00:00.000Z");
    assertEquals(list.at(-1)!.link, undated.link);
  },
);

Deno.test("blog posts join the feed when there are published ones", () => {
  const list = rssItems(ORIGIN, {
    ...fixtures(),
    blog_posts: [
      {
        title: "Hello",
        slug: "hello",
        summary: "First post",
        status: "published",
        published_at: "2026-11-19T08:00:00Z",
        author: author("Ada"),
      },
      {
        title: "Draft post",
        slug: "draft-post",
        status: "draft",
        published_at: "2026-11-19T09:00:00Z",
      },
    ],
  });
  assertEquals(list[0].link, `${ORIGIN}/blog/hello`);
  assert(!list.some((i) => i.link.includes("draft-post")));
});

Deno.test("the feed holds at most 50 items, the newest", () => {
  const prompts = Array.from({ length: 70 }, (_, n) => ({
    title: `P${n}`,
    slug: `p-${n}`,
    is_public: true,
    published_at: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
  }));
  const list = rssItems(ORIGIN, { prompts });
  assertEquals(list.length, RSS_ITEM_LIMIT);
  assertEquals(RSS_ITEM_LIMIT, 50);
  assertEquals(list[0].title, "P69");
  assertEquals(list.at(-1)!.title, "P20");
});

Deno.test("the summary is plain text, cut at a word", () => {
  assertEquals(
    plainSummary("# Head\n[a link](https://x) and `code`"),
    "Head a link and code",
  );
  const long = plainSummary("word ".repeat(200));
  assert(long.length <= 301);
  assert(long.endsWith("word…"));
  assertEquals(plainSummary(null), "");
});

type Call = [string, ...unknown[]];
function recorder() {
  const calls: Call[] = [];
  const b = {
    calls,
    select: (...a: unknown[]) => (calls.push(["select", ...a]), b),
    filter: (...a: unknown[]) => (calls.push(["filter", ...a]), b),
    or: (...a: unknown[]) => (calls.push(["or", ...a]), b),
    order: (...a: unknown[]) => (calls.push(["order", ...a]), b),
    range: (...a: unknown[]) => (calls.push(["range", ...a]), b),
    limit: (...a: unknown[]) => (calls.push(["limit", ...a]), b),
  };
  return b;
}

const PUBLIC_COLUMN = {
  prompts: "is_public",
  skills: "published",
  workflows: "published",
  prompt_kits: "published",
} as const;

Deno.test(
  "the feed's query asks only for public rows outside any team, and no text",
  () => {
    for (const table of ARTIFACT_TABLES) {
      const q = rssQuery(recorder(), table, 50);
      const filters = q.calls.filter(([m]) => m === "filter");
      assertEquals(
        filters,
        [
          ["filter", PUBLIC_COLUMN[table], "eq", true],
          ["filter", "team_id", "is", "null"],
        ],
        table,
      );
      assertEquals(q.calls.at(-1), ["limit", 50], table);
      assert(!/\bcontent\b/.test(RSS_COLUMNS[table]), table);
    }
    const blog = rssQuery(recorder(), "blog_posts", 50);
    assertEquals(
      blog.calls.filter(([m]) => m === "filter"),
      [["filter", "status", "eq", "published"]],
    );
    assert(!/\bcontent\b/.test(RSS_COLUMNS.blog_posts));
  },
);

Deno.test(
  "the feed's query orders every artifact type by when it went public",
  () => {
    for (const table of ARTIFACT_TABLES) {
      assert(/\bpublished_at\b/.test(RSS_COLUMNS[table]), table);
      const q = rssQuery(recorder(), table, 50);
      assertEquals(
        q.calls.filter(([m]) => m === "order"),
        [
          ["order", "published_at", { ascending: false, nullsFirst: false }],
          ["order", "created_at", { ascending: false }],
          ["order", "id", { ascending: true }],
        ],
        table,
      );
    }
  },
);
