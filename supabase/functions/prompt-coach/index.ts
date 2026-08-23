import { startCoachServer } from "../_shared/coach.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/prompt-coach.ts";

startCoachServer({
  feature: "prompt-coach",
  artifactName: "prompt",
  systemPrompt: SYSTEM_PROMPT,
});
