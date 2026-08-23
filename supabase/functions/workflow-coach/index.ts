import { startCoachServer } from "../_shared/coach.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/workflow-coach.ts";

startCoachServer({
  feature: "workflow-coach",
  artifactName: "workflow",
  systemPrompt: SYSTEM_PROMPT,
});
