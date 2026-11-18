import { assertEquals } from "@std/assert";
import {
  ARTIFACT_TABLES,
  isPublicRow,
  paletteSelect,
  publicCountQuery,
  publicPromptSearchQuery,
  sitemapPageQuery,
} from "@/lib/publicArtifacts.ts";

// Spelled out here rather than read from ARTIFACT_PUBLIC_COLUMN, so a wrong
// owner fails too: these are the columns anon's read policies key on.
const PUBLIC_COLUMN = {
  prompts: "is_public",
  skills: "published",
  workflows: "published",
  prompt_kits: "published",
} as const;

type Call = [string, ...unknown[]];

/** A query builder that records what it was asked. */
function recorder() {
  const calls: Call[] = [];
  const builder = {
    calls,
    select(...args: unknown[]) {
      calls.push(["select", ...args]);
      return builder;
    },
    filter(...args: unknown[]) {
      calls.push(["filter", ...args]);
      return builder;
    },
    or(...args: unknown[]) {
      calls.push(["or", ...args]);
      return builder;
    },
    order(...args: unknown[]) {
      calls.push(["order", ...args]);
      return builder;
    },
    range(...args: unknown[]) {
      calls.push(["range", ...args]);
      return builder;
    },
    limit(...args: unknown[]) {
      calls.push(["limit", ...args]);
      return builder;
    },
  };
  return builder;
}

const filters = (calls: Call[]) => calls.filter(([m]) => m === "filter");

Deno.test("the four artifact tables, in the order HomeStats adds them", () => {
  assertEquals(
    [...ARTIFACT_TABLES],
    ["prompts", "skills", "workflows", "prompt_kits"],
  );
});

Deno.test("the home page counts only public rows of every table", () => {
  for (const table of ARTIFACT_TABLES) {
    const q = publicCountQuery(recorder(), table);
    assertEquals(
      q.calls,
      [
        ["select", "id", { count: "exact", head: true }],
        ["filter", PUBLIC_COLUMN[table], "eq", true],
      ],
      table,
    );
  }
});

Deno.test("the sitemap lists only public rows of every table", () => {
  for (const table of ARTIFACT_TABLES) {
    const q = sitemapPageQuery(recorder(), table, 1000, 1999);
    assertEquals(
      q.calls,
      [
        ["select", "slug, updated_at"],
        ["filter", PUBLIC_COLUMN[table], "eq", true],
        ["order", "updated_at", { ascending: false }],
        ["order", "id", { ascending: true }],
        ["range", 1000, 1999],
      ],
      table,
    );
  }
});

Deno.test("the sitemap lists only published blog posts", () => {
  const q = sitemapPageQuery(recorder(), "blog_posts", 0, 999);
  assertEquals(filters(q.calls), [["filter", "status", "eq", "published"]]);
});

Deno.test("the palette offers only public prompts from everyone", () => {
  const q = publicPromptSearchQuery(recorder(), "two words", ["title"]);
  assertEquals(filters(q.calls), [["filter", "is_public", "eq", true]]);
  assertEquals(q.calls.filter(([m]) => m === "or").length, 2);
  assertEquals(q.calls.slice(-2), [
    ["order", "rating_avg", { ascending: false }],
    ["limit", 8],
  ]);
});

Deno.test("the palette reads each table's own public column", () => {
  for (const table of ARTIFACT_TABLES) {
    const column = PUBLIC_COLUMN[table];
    assertEquals(
      paletteSelect(table),
      `id, slug, title, description, ${column}, team_id`,
    );
    assertEquals(isPublicRow(table, { [column]: true }), true, table);
    assertEquals(isPublicRow(table, { [column]: false }), false, table);
  }
});
