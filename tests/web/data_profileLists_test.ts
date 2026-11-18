import { assertEquals } from "@std/assert";
import {
  ARTIFACT_LIST_COLUMNS,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";
import {
  appendProfilePage,
  hasMoreInProfileList,
  PROFILE_PAGE_SIZE,
  profileListQuery,
  profileNameFromPath,
  type ProfileListFilters,
} from "@/lib/profileLists.ts";

type Call = [string, ...unknown[]];

// Stands in for supabase.from(table) and writes down every call it gets.
function recordingSource() {
  const calls: Call[] = [];
  const filters: ProfileListFilters<Call[]> = {
    eq: (...args) => (calls.push(["eq", ...args]), filters),
    filter: (...args) => (calls.push(["filter", ...args]), filters),
    order: (...args) => (calls.push(["order", ...args]), filters),
    range: (...args) => (calls.push(["range", ...args]), calls),
  };
  return {
    select: (columns: string, options: { count: "exact" }) => (
      calls.push(["select", columns, options]),
      filters
    ),
  };
}

// The profile is public, and the browser runs its loader and "Load more" with
// the viewer's session: only this filter keeps the viewer's own drafts and
// team-only items off someone's profile, on every page.
const PUBLIC_COLUMN: Record<ArtifactListTable, string> = {
  prompts: "is_public",
  skills: "published",
  workflows: "published",
  prompt_kits: "published",
};

for (const table of Object.keys(PUBLIC_COLUMN) as ArtifactListTable[]) {
  for (const offset of [0, PROFILE_PAGE_SIZE, 4 * PROFILE_PAGE_SIZE]) {
    Deno.test(
      `the ${table} on a profile from row ${offset} are the author's public rows only`,
      () => {
        assertEquals(
          profileListQuery(recordingSource(), table, "author-1", offset),
          [
            [
              "select",
              ARTIFACT_LIST_COLUMNS[table].join(", "),
              {
                count: "exact",
              },
            ],
            ["eq", "author_id", "author-1"],
            ["filter", PUBLIC_COLUMN[table], "eq", true],
            ["order", "created_at", { ascending: false }],
            ["order", "id", { ascending: true }],
            ["range", offset, offset + PROFILE_PAGE_SIZE - 1],
          ],
        );
      },
    );
  }
}

Deno.test("a profile list starts at its first row", () => {
  const calls = profileListQuery(recordingSource(), "prompts", "author-1");
  assertEquals(calls.at(-1), ["range", 0, PROFILE_PAGE_SIZE - 1]);
});

const items = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => ({ id: `p${from + i}` }));

Deno.test("each next page is added after the rows already shown", () => {
  assertEquals(
    appendProfilePage(
      { items: items(0, 30), total: 135 },
      { items: items(30, 60), total: 135 },
    ),
    { items: items(0, 60), total: 135 },
  );
});

Deno.test("a row already shown is not added twice", () => {
  // Something was published between two pages: every row moved one place on,
  // so the next page starts with the last row already shown.
  assertEquals(
    appendProfilePage(
      { items: items(0, 30), total: 135 },
      { items: items(29, 59), total: 136 },
    ),
    { items: items(0, 59), total: 136 },
  );
});

Deno.test("there is more to load until every item is shown", () => {
  // 135 prompts: 30, 60, 90, 120 shown leave more; 135 shown is the whole list.
  let list = { items: items(0, PROFILE_PAGE_SIZE), total: 135 };
  let pages = 1;
  while (hasMoreInProfileList(list)) {
    const from = list.items.length;
    list = appendProfilePage(list, {
      items: items(from, Math.min(from + PROFILE_PAGE_SIZE, 135)),
      total: 135,
    });
    pages++;
  }
  assertEquals(pages, 5);
  assertEquals(list.items.length, 135);
  assertEquals(list.items.at(-1), { id: "p134" });
});

Deno.test("a list that fits on one page has nothing more to load", () => {
  assertEquals(hasMoreInProfileList({ items: items(0, 7), total: 7 }), false);
  assertEquals(hasMoreInProfileList({ items: [], total: 0 }), false);
});

Deno.test("a page that comes back empty ends the list", () => {
  // Rows were deleted meanwhile: the new total is what is left.
  const list = appendProfilePage(
    { items: items(0, 30), total: 40 },
    { items: [], total: 30 },
  );
  assertEquals(hasMoreInProfileList(list), false);
});

Deno.test("the profile name is read from the address, decoded", () => {
  assertEquals(profileNameFromPath("/u/michael"), "michael");
  assertEquals(profileNameFromPath("/u/michael/"), "michael");
  assertEquals(profileNameFromPath("/u/Mister%20Q"), "Mister Q");
  assertEquals(profileNameFromPath("/u/Mister Q"), "Mister Q");
  // A malformed escape is taken as it stands rather than throwing mid-render.
  assertEquals(profileNameFromPath("/u/100%"), "100%");
});

Deno.test("other addresses name no profile", () => {
  assertEquals(profileNameFromPath("/u/michael/activity"), null);
  assertEquals(profileNameFromPath("/prompts/hello"), null);
  assertEquals(profileNameFromPath("/u/"), null);
});
