import { assertEquals } from "@std/assert";
import {
  ARTIFACT_LIST_COLUMNS,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";
import {
  cutProfileList,
  PROFILE_LIST_LIMIT,
  profileListQuery,
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
    limit: (...args) => (calls.push(["limit", ...args]), calls),
  };
  return {
    select: (columns: string) => (calls.push(["select", columns]), filters),
  };
}

// The profile is public, and the browser runs its loader with the viewer's
// session: only this filter keeps the viewer's own drafts and team-only items
// off someone's profile.
const PUBLIC_COLUMN: Record<ArtifactListTable, string> = {
  prompts: "is_public",
  skills: "published",
  workflows: "published",
  prompt_kits: "published",
};

for (const table of Object.keys(PUBLIC_COLUMN) as ArtifactListTable[]) {
  Deno.test(
    `the ${table} on a profile are the author's public rows only`,
    () => {
      assertEquals(profileListQuery(recordingSource(), table, "author-1"), [
        ["select", ARTIFACT_LIST_COLUMNS[table].join(", ")],
        ["eq", "author_id", "author-1"],
        ["filter", PUBLIC_COLUMN[table], "eq", true],
        ["order", "created_at", { ascending: false }],
        ["order", "id", { ascending: true }],
        ["limit", PROFILE_LIST_LIMIT + 1],
      ]);
    },
  );
}

const rows = (n: number) => Array.from({ length: n }, (_, i) => i);

Deno.test("a list at the limit is shown whole and not marked as cut", () => {
  assertEquals(cutProfileList(rows(PROFILE_LIST_LIMIT)), {
    items: rows(PROFILE_LIST_LIMIT),
    truncated: false,
  });
});

Deno.test("the row past the limit is dropped and marks the list as cut", () => {
  assertEquals(cutProfileList(rows(PROFILE_LIST_LIMIT + 1)), {
    items: rows(PROFILE_LIST_LIMIT),
    truncated: true,
  });
});
