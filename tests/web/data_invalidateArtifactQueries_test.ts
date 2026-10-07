import { assertEquals } from "@std/assert";
import {
  artifactKindForTable,
  invalidateArtifactQueries,
  PROMPT_PINS_KEY,
} from "@/lib/invalidateArtifactQueries.ts";

Deno.test("each artifact table maps to the lists that show it", () => {
  assertEquals(artifactKindForTable("prompts"), "prompt");
  assertEquals(artifactKindForTable("skills"), "skill");
  assertEquals(artifactKindForTable("workflows"), "workflow");
  assertEquals(artifactKindForTable("prompt_kits"), "prompt_kit");
  assertEquals(artifactKindForTable("collections"), undefined);
});

Deno.test("invalidation reaches the list keys the hooks use", async () => {
  const invalidated: unknown[][] = [];
  const client = {
    invalidateQueries({ queryKey }: { queryKey: readonly unknown[] }) {
      invalidated.push([...queryKey]);
      return Promise.resolve();
    },
  };
  await invalidateArtifactQueries(client, "skill");
  assertEquals(invalidated, [
    ["skills"],
    ["collection-picker-items"],
    ["collection-item-details"],
    ["collection-items"],
    ["collections"],
  ]);

  // A prefix matches every key that starts with it, the way TanStack
  // matches: the Discover grid (["prompts", "search", ...]) and the
  // collection picker's prompts (["collection-picker-items", "prompt", ...]).
  invalidated.length = 0;
  await invalidateArtifactQueries(client, "prompt");
  const matches = (key: unknown[]) =>
    invalidated.some(
      (prefix) =>
        JSON.stringify(key.slice(0, prefix.length)) === JSON.stringify(prefix),
    );
  for (const key of [
    ["prompts", "search", "hybrid", "", true],
    ["collection-picker-items", "prompt", "u1"],
    // The Library's pinned prompts and the "is it pinned" ids
    // (usePinnedPrompts): a renamed or deleted pinned prompt stayed in the
    // Library under its old title, or as a dead link (2026-10-07).
    ["prompt-pins", "u1", "prompts", null, true],
    ["prompt-pins", "u1", "ids"],
  ]) {
    assertEquals(matches(key), true, JSON.stringify(key));
  }

  // Pins hold prompts only; a skill change leaves them alone.
  invalidated.length = 0;
  await invalidateArtifactQueries(client, "skill");
  assertEquals(matches(["prompt-pins", "u1", "ids"]), false);
  // usePinnedPrompts keys its queries by this same constant.
  assertEquals(PROMPT_PINS_KEY, "prompt-pins");
});

// The database cascades a deleted artifact's collection entries, so a
// collection page has to forget them too, or it shows "Unknown item" and
// counts it (2026-10-07).
Deno.test(
  "an artifact change reaches the collections that hold it",
  async () => {
    const invalidated: unknown[][] = [];
    const client = {
      invalidateQueries({ queryKey }: { queryKey: readonly unknown[] }) {
        invalidated.push([...queryKey]);
        return Promise.resolve();
      },
    };
    await invalidateArtifactQueries(client, "workflow");
    for (const key of [
      ["collection-items", "c1"],
      ["collections", "u1"],
      ["collection-item-details", "k"],
    ]) {
      assertEquals(
        invalidated.some((prefix) => prefix[0] === key[0]),
        true,
        key[0] as string,
      );
    }
  },
);
