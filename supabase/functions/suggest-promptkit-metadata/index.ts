import { startSuggestServer } from "../_shared/suggest.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/suggest-promptkit-metadata.ts";

startSuggestServer({
  feature: "suggest-promptkit-metadata",
  artifact: "prompt kit",
  bodyFields: ["kit_content", "prompt_kit_content", "content"],
  systemPrompt: SYSTEM_PROMPT,
});
