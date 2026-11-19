import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { collectionPage, collectionPath } from "@/lib/collectionHead.ts";
import { sitemapPageQuery } from "@/lib/publicArtifacts.ts";
import {
  buildSitemapXml,
  SITEMAP_SOURCES,
  type SitemapRow,
  sitemapPath,
} from "@/lib/sitemapXml.ts";

const ORIGIN = "https://querino.ai";
const PUBLIC_ID = "0b000000-0000-4000-a000-000000000501";
const PRIVATE_ID = "0b000000-0000-4000-a000-000000000502";

/** The collections table as the database holds it: one public, one private. */
const TABLE = [
  {
    id: PUBLIC_ID,
    title: "Launch week",
    description: "Everything for a launch",
    is_public: true,
    owner_id: "a",
    team_id: null,
    created_at: "2026-11-01T09:00:00Z",
    updated_at: "2026-11-18T10:30:00Z",
  },
  {
    id: PRIVATE_ID,
    title: "My drafts",
    description: "Not for anyone else",
    is_public: false,
    owner_id: "a",
    team_id: null,
    created_at: "2026-11-02T09:00:00Z",
    updated_at: "2026-11-19T08:00:00Z",
  },
];

type Row = Record<string, unknown>;

/**
 * A query builder over fixture rows that does what PostgREST does with the
 * calls the sitemap makes: it selects the named columns and applies the
 * filters, so a missing filter lets the private row through.
 */
function fakeTable(rows: Row[]) {
  let columns: string[] = [];
  let kept = rows;
  const builder = {
    selected: [] as string[],
    select(cols: string) {
      columns = cols.split(",").map((c) => c.trim());
      builder.selected.push(cols);
      return builder;
    },
    filter(column: string, op: "eq" | "is", value: unknown) {
      kept = kept.filter((r) =>
        op === "is" && value === "null"
          ? r[column] == null
          : r[column] === value,
      );
      return builder;
    },
    or() {
      return builder;
    },
    order() {
      return builder;
    },
    range(from: number, to: number) {
      kept = kept.slice(from, to + 1);
      return builder;
    },
    limit(n: number) {
      kept = kept.slice(0, n);
      return builder;
    },
    get data(): Row[] {
      return kept.map((r) => Object.fromEntries(columns.map((c) => [c, r[c]])));
    },
  };
  return builder;
}

function sitemapOf(rows: Row[]): string {
  const q = sitemapPageQuery(fakeTable(rows), "collections", 0, 999);
  return buildSitemapXml(ORIGIN, [], {
    collections: q.data as unknown as SitemapRow[],
  });
}

Deno.test("the sitemap lists a public collection with its lastmod", () => {
  const xml = sitemapOf(TABLE);
  assertStringIncludes(
    xml,
    `<loc>${ORIGIN}/collections/${PUBLIC_ID}</loc>
    <lastmod>2026-11-18</lastmod>`,
  );
});

Deno.test("the sitemap lists no collection that is not public", () => {
  const xml = sitemapOf(TABLE);
  assert(!xml.includes(PRIVATE_ID), "a private collection is listed");
  assertEquals(xml.match(/\/collections\//g)?.length, 1);
});

Deno.test(
  "a collection's sitemap address is the canonical its page states",
  () => {
    const row = TABLE[0];
    assertEquals(
      sitemapPath("collections", { id: row.id, updated_at: row.updated_at }),
      collectionPage(row).canonical,
    );
    assertEquals(collectionPath(row.id), `/collections/${PUBLIC_ID}`);
  },
);

Deno.test("the collections query reads only the columns it needs", () => {
  const q = sitemapPageQuery(fakeTable(TABLE), "collections", 0, 999);
  assertEquals(q.selected, ["id, updated_at"]);
  assertEquals(Object.keys(q.data[0]).sort(), ["id", "updated_at"]);
});

Deno.test("the artifact entries are unchanged by the new source", () => {
  const xml = buildSitemapXml(
    ORIGIN,
    [{ loc: "/", priority: "1.0", changefreq: "daily" }],
    {
      prompts: [{ slug: "a&b", updated_at: "2026-11-10T00:00:00Z" }],
      prompt_kits: [{ slug: null, updated_at: null }],
      collections: [{ id: PUBLIC_ID, updated_at: null }],
    },
    new Date("2026-11-19T12:00:00Z"),
  );
  assertStringIncludes(
    xml,
    `<url>
    <loc>${ORIGIN}/prompts/a&amp;b</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
  );
  // A row without an address is skipped; a missing date is today's.
  assert(!xml.includes("/prompt-kits/"));
  assertStringIncludes(
    xml,
    `/collections/${PUBLIC_ID}</loc>
    <lastmod>2026-11-19</lastmod>`,
  );
  assertEquals(
    SITEMAP_SOURCES.map((s) => s.table),
    [
      "blog_posts",
      "prompts",
      "skills",
      "workflows",
      "prompt_kits",
      "collections",
    ],
  );
});
