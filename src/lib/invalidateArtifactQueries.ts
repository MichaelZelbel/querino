// Every list that can show an artifact, keyed by the artifact type. After a
// create, edit, delete, clone, duplicate or copy to a team, call this so the
// Library, Discover, the collections and the collection picker do not keep
// serving the old row from the cache (the router's QueryClient keeps data fresh for 60 seconds).
export type ArtifactKind = "prompt" | "skill" | "workflow" | "prompt_kit";

// The part of TanStack's QueryClient used here, spelled out rather than
// imported so the Deno unit tests can load this file.
export interface InvalidatingClient {
  invalidateQueries(filters: { queryKey: readonly unknown[] }): Promise<void>;
}

const LIST_KEYS: Record<ArtifactKind, string> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
};

/**
 * The prefix of usePinnedPrompts' query keys, kept here so the hook and this
 * invalidation cannot drift apart. The Library's pinned list holds a copy of
 * each pinned prompt's row, so it goes stale with the prompt itself.
 */
export const PROMPT_PINS_KEY = "prompt-pins";

const KIND_BY_TABLE: Record<string, ArtifactKind> = {
  prompts: "prompt",
  skills: "skill",
  workflows: "workflow",
  prompt_kits: "prompt_kit",
};

/** The artifact kind stored in `table`, or undefined for any other table. */
export function artifactKindForTable(table: string): ArtifactKind | undefined {
  return KIND_BY_TABLE[table];
}

// A deleted artifact also leaves every collection it was in: the database
// cascades its collection entries. So the collections' own item lists and
// counts refetch too; without them a collection page kept the entry, showed
// it as "Unknown item" and counted it (2026-10-07).
//
// A prompt also reaches the pinned list: a renamed pinned prompt kept its old
// title in the Library and a deleted one stayed as a dead link, because the
// pins query trusted its cache for 60 seconds (2026-10-07). Both pin keys go,
// the ids too, since a delete cascades the pin row away.
export function invalidateArtifactQueries(
  queryClient: InvalidatingClient,
  kind: ArtifactKind,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [LIST_KEYS[kind]] }),
    queryClient.invalidateQueries({ queryKey: ["collection-picker-items"] }),
    queryClient.invalidateQueries({ queryKey: ["collection-item-details"] }),
    queryClient.invalidateQueries({ queryKey: ["collection-items"] }),
    queryClient.invalidateQueries({ queryKey: ["collections"] }),
    ...(kind === "prompt"
      ? [queryClient.invalidateQueries({ queryKey: [PROMPT_PINS_KEY] })]
      : []),
  ]).then(() => undefined);
}
