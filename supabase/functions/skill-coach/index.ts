import { startCoachServer } from "../_shared/coach.ts";
import { SYSTEM_PROMPT } from "../_shared/prompts/skill-coach.ts";

startCoachServer({
  feature: "skill-coach",
  artifactName: "skill",
  systemPrompt: SYSTEM_PROMPT,
});
