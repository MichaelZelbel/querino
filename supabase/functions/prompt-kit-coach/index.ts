import { startCoachServer } from "../_shared/coach.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/prompt-kit-coach.ts";

startCoachServer({
  feature: "prompt-kit-coach",
  artifactName: "prompt kit",
  systemPrompt: SYSTEM_PROMPT,
});
