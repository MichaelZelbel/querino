import type { PromptKit, PromptKitAuthor } from "@/types/promptKit";
import { createArtifactListHook, type ArtifactListOptions } from "./useArtifactList";

export type UsePromptKitsOptions = ArtifactListOptions;

export const usePromptKits = createArtifactListHook<PromptKit & { author?: PromptKitAuthor | null }>({
  table: "prompt_kits",
  queryKey: "prompt_kits",
  semanticType: "prompt_kit",
});
