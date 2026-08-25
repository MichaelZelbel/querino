// Which call sites cannot survive a model without tool calling.
//
// The nightly catalogue sync disables a call site whose model loses tool
// support. That is only correct where the call site actually sends a tools
// array: doing it to an insights prompt that never sent one would disable a
// working feature over a parameter it does not use.
//
// So the flag has to be right, and it is hand-maintained, which means it needs
// a test. To re-derive the list, look for `tools:` in each function:
//
//   grep -rln "tools:" supabase/functions --include=index.ts
//   _shared/coach.ts    RESPOND_TOOL          the four coaches
//   _shared/suggest.ts  return_metadata       the four suggest-* functions
//   refine-prompt       REFINE_TOOL
//   translate-artifact  translate_artifact
//   ai-moderate-content classify_content

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { CALL_SITES, getCallSiteMeta } from "./llm-registry.ts";

const SENDS_A_TOOLS_ARRAY = [
  "ai-moderate-content",
  "prompt-coach",
  "prompt-kit-coach",
  "prompt-refinement",
  "skill-coach",
  "suggest-metadata",
  "suggest-promptkit-metadata",
  "suggest-skill-metadata",
  "suggest-workflow-metadata",
  "translate-artifact",
  "workflow-coach",
];

Deno.test(
  "requiresTools is set on exactly the call sites that send tools",
  () => {
    const flagged = CALL_SITES.filter((c) => c.requiresTools)
      .map((c) => c.call_site)
      .sort();
    assertEquals(flagged, SENDS_A_TOOLS_ARRAY);
  },
);

// The count is asserted separately because llm-registry.ts has claimed "eleven
// of the seventeen" in a comment since 2026-08-23 with nothing checking it.
Deno.test("eleven of the seventeen call sites need tool calling", () => {
  assertEquals(CALL_SITES.length, 17);
  assertEquals(CALL_SITES.filter((c) => c.requiresTools).length, 11);
});

Deno.test(
  "the call sites that need no tools are the insights, wizard and canvas ones",
  () => {
    const free = CALL_SITES.filter((c) => !c.requiresTools)
      .map((c) => c.call_site)
      .sort();
    assertEquals(free, [
      "ai-insights-prompt",
      "ai-insights-prompt_kit",
      "ai-insights-skill",
      "ai-insights-workflow",
      "canvas-ai",
      "prompt-wizard",
    ]);
  },
);

Deno.test("getCallSiteMeta carries the flag through", () => {
  assertEquals(getCallSiteMeta("skill-coach")?.requiresTools, true);
  assertEquals(getCallSiteMeta("prompt-wizard")?.requiresTools, false);
  assertEquals(getCallSiteMeta("no-such-call-site"), undefined);
});
