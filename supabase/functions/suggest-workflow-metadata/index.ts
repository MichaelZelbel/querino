import { startSuggestServer } from "../_shared/suggest.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/suggest-workflow-metadata.ts";

startSuggestServer({
  feature: "suggest-workflow-metadata",
  artifact: "workflow",
  bodyFields: ["workflow_content"],
  systemPrompt: SYSTEM_PROMPT,
});
