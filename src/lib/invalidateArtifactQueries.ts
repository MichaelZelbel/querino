// Every list that can show an artifact, keyed by the artifact type. After a
// create, edit, delete, clone, duplicate or copy to a team, call this so the
// Library, Discover and the collection picker do not keep serving the old row
// from the cache (the router's QueryClient keeps data fresh for 60 seconds).
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

export function invalidateArtifactQueries(
  queryClient: InvalidatingClient,
  kind: ArtifactKind,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [LIST_KEYS[kind]] }),
    queryClient.invalidateQueries({ queryKey: ["collection-picker-items"] }),
    queryClient.invalidateQueries({ queryKey: ["collection-item-details"] }),
  ]).then(() => undefined);
}
