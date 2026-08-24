// The system prompt each call site sends when nobody has overridden it.
//
// This exists so the LLM Config page can show the prompt that is actually in
// use. Before it, `llm_call_configs.system_prompt` was NULL for all seventeen
// rows and the default text lived inside whichever edge function sent it, so
// the server had no way to read it and the admin's box was always empty. An
// administrator cannot judge a prompt they cannot see, and could only write an
// override blind.
//
// It is deliberately an INDEX, not a store. Every prompt keeps its own file in
// ./prompts/, and Menerio's 918-line llm-defaults.ts stays un-repeated:
// `llm-registry.ts` is still metadata only, and nothing here holds prompt text.
//
// The coaches are composed here because what they send is coach text plus the
// shared suffix, and an override replaces the whole system message. Showing
// only the coach half would hide the tool-calling contract from the one person
// who can delete it.

import { baseSystemSuffix } from "./prompts/coach-suffix.ts";
import { SYSTEM_PROMPT as promptCoach } from "./prompts/prompt-coach.ts";
import { SYSTEM_PROMPT as promptKitCoach } from "./prompts/prompt-kit-coach.ts";
import { SYSTEM_PROMPT as skillCoach } from "./prompts/skill-coach.ts";
import { SYSTEM_PROMPT as workflowCoach } from "./prompts/workflow-coach.ts";
import { SYSTEM_PROMPT as suggestMetadata } from "./prompts/suggest-metadata.ts";
import { SYSTEM_PROMPT as suggestPromptKitMetadata } from "./prompts/suggest-promptkit-metadata.ts";
import { SYSTEM_PROMPT as suggestSkillMetadata } from "./prompts/suggest-skill-metadata.ts";
import { SYSTEM_PROMPT as suggestWorkflowMetadata } from "./prompts/suggest-workflow-metadata.ts";
import { SYSTEM_PROMPTS as aiInsights } from "./prompts/ai-insights.ts";
import { SYSTEM_PROMPT as promptWizard } from "./prompts/prompt-wizard.ts";
import { SYSTEM_PROMPT as refinePrompt } from "./prompts/refine-prompt.ts";
import { SYSTEM_PROMPT as translateArtifact } from "./prompts/translate-artifact.ts";
import { SYSTEM_PROMPT as canvasAi } from "./prompts/canvas-ai.ts";
import { SYSTEM_PROMPT as aiModerateContent } from "./prompts/ai-moderate-content.ts";

/** Call site to the prompt it would send with no row and no override. */
export const DEFAULT_SYSTEM_PROMPTS: Record<string, string> = {
  "prompt-coach": promptCoach + baseSystemSuffix("prompt"),
  "prompt-kit-coach": promptKitCoach + baseSystemSuffix("prompt kit"),
  "skill-coach": skillCoach + baseSystemSuffix("skill"),
  "workflow-coach": workflowCoach + baseSystemSuffix("workflow"),
  "suggest-metadata": suggestMetadata,
  "suggest-promptkit-metadata": suggestPromptKitMetadata,
  "suggest-skill-metadata": suggestSkillMetadata,
  "suggest-workflow-metadata": suggestWorkflowMetadata,
  "ai-insights-prompt": aiInsights.prompt,
  "ai-insights-skill": aiInsights.skill,
  "ai-insights-workflow": aiInsights.workflow,
  "ai-insights-prompt_kit": aiInsights.prompt_kit,
  "prompt-wizard": promptWizard,
  "prompt-refinement": refinePrompt,
  "translate-artifact": translateArtifact,
  "canvas-ai": canvasAi,
  "ai-moderate-content": aiModerateContent,
};

/** The default for a call site, or null if there is no such call site. */
export function getDefaultSystemPrompt(callSite: string): string | null {
  return DEFAULT_SYSTEM_PROMPTS[callSite] ?? null;
}

/**
 * Whether this text is still the code default, ignoring surrounding whitespace.
 *
 * A call site with no default can never match, because "the same as nothing"
 * would be true of every string and would silently discard a real override.
 */
export function isDefaultSystemPrompt(
  callSite: string,
  text: string | null | undefined,
): boolean {
  const fallback = getDefaultSystemPrompt(callSite);
  if (fallback === null) return false;
  if (typeof text !== "string") return false;
  return text.trim() === fallback.trim();
}

/**
 * What a save should actually store, given what the box contained.
 *
 * NULL means "keep using the code default", which is the point. The box is
 * prefilled now, so the commonest action on the page is opening a call site and
 * pressing Save without touching the text. If that wrote the prompt into the
 * row, the call site would quietly stop tracking every later change to the code
 * and the table's "Code default" column would start lying. Enforced here rather
 * than in the panel, so no client can do it by accident.
 *
 * The cost, stated rather than hidden: an administrator cannot pin today's
 * default text verbatim. Changing one character is enough to make it an
 * override, and that is the cheaper mistake of the two.
 */
export function normalizeSystemPrompt(
  callSite: string,
  text: string | null | undefined,
): string | null {
  if (typeof text !== "string" || text.trim().length === 0) return null;
  if (isDefaultSystemPrompt(callSite, text)) return null;
  return text;
}
