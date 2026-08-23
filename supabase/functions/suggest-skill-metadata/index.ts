import { startSuggestServer } from "../_shared/suggest.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/suggest-skill-metadata.ts";

startSuggestServer({
  feature: "suggest-skill-metadata",
  artifact: "skill",
  bodyFields: ["skill_content"],
  systemPrompt: SYSTEM_PROMPT,
});
