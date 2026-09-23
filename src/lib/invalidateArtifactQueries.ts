import type { QueryClient } from "@tanstack/react-query";

// Every list that can show an artifact, keyed by the artifact type. After a
// create, edit, delete, clone or duplicate, call this so the Library, Discover
// and the collection picker do not keep serving the old row from the cache
// (the router's QueryClient keeps data fresh for 60 seconds).
export type ArtifactKind = "prompt" | "skill" | "workflow" | "prompt_kit";

const LIST_KEYS: Record<ArtifactKind, string> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
};

export function invalidateArtifactQueries(
  queryClient: QueryClient,
  kind: ArtifactKind,
): Promise<void> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [LIST_KEYS[kind]] }),
    queryClient.invalidateQueries({ queryKey: ["collection-picker-items"] }),
    queryClient.invalidateQueries({ queryKey: ["collection-item-details"] }),
  ]).then(() => undefined);
}
