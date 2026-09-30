import { assertEquals } from "@std/assert";
import {
  artifactKindForTable,
  invalidateArtifactQueries,
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
  ]);

  // A prefix matches every key that starts with it, the way TanStack
  // matches: the Discover grid (["prompts", "search", ...]) and the
  // collection picker's own prompts (["prompts", "mine", ...]).
  invalidated.length = 0;
  await invalidateArtifactQueries(client, "prompt");
  const prefix = invalidated[0];
  for (const key of [
    ["prompts", "search", "hybrid", "", true],
    ["prompts", "mine", "u1"],
  ]) {
    assertEquals(key.slice(0, prefix.length), prefix);
  }
});
