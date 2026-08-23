import { startSuggestServer } from "../_shared/suggest.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/suggest-metadata.ts";

startSuggestServer({
  feature: "suggest-metadata",
  artifact: "prompt",
  bodyFields: ["prompt_content"],
  systemPrompt: SYSTEM_PROMPT,
});
