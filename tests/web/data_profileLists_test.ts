import { assertEquals } from "@std/assert";
import {
  cutProfileList,
  PROFILE_LIST_LIMIT,
  PROFILE_PUBLIC_COLUMN,
} from "@/lib/profileLists.ts";

// The profile is public: every list must filter on the column the anon read
// policy uses, or a signed-in viewer's own drafts or team-only items reach it.
Deno.test("each profile list filters on its table's public column", () => {
  assertEquals(PROFILE_PUBLIC_COLUMN, {
    prompts: "is_public",
    skills: "published",
    workflows: "published",
    prompt_kits: "published",
  });
});

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

Deno.test("a failed query reads as an empty list", () => {
  assertEquals(cutProfileList(null), { items: [], truncated: false });
  assertEquals(cutProfileList(undefined), { items: [], truncated: false });
});
