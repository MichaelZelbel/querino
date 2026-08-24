// The admin page can only show a default prompt if the server can read it.
// These tests are what stops the map and the registry drifting apart, which is
// the failure mode that would put an empty box back on the page.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DEFAULT_SYSTEM_PROMPTS,
  getDefaultSystemPrompt,
  isDefaultSystemPrompt,
  normalizeSystemPrompt,
} from "./llm-default-prompts.ts";
import { CALL_SITES } from "./llm-registry.ts";
import { interpolatePrompt } from "./llm-config.ts";
import { buildSystemPrompt } from "./coach.ts";
import {
  SYSTEM_PROMPT as CANVAS_AI_PROMPT,
  modeInstructions,
} from "./prompts/canvas-ai.ts";
import { SYSTEM_PROMPT as TRANSLATE_PROMPT } from "./prompts/translate-artifact.ts";
import { SYSTEM_PROMPT as SKILL_COACH_PROMPT } from "./prompts/skill-coach.ts";

Deno.test("every registry call site has a default system prompt", () => {
  const missing = CALL_SITES.map((c) => c.call_site).filter(
    (site) => !(site in DEFAULT_SYSTEM_PROMPTS),
  );
  assertEquals(missing, []);
});

Deno.test("every default system prompt belongs to a registry call site", () => {
  const known = new Set(CALL_SITES.map((c) => c.call_site));
  const orphans = Object.keys(DEFAULT_SYSTEM_PROMPTS).filter(
    (site) => !known.has(site),
  );
  assertEquals(orphans, []);
});

Deno.test("no default system prompt is empty", () => {
  const blank = Object.entries(DEFAULT_SYSTEM_PROMPTS)
    .filter(([, text]) => text.trim().length === 0)
    .map(([site]) => site);
  assertEquals(blank, []);
});

// The panel prints the declared placeholders under the box as the ones runtime
// context is substituted into. If a default uses a name the registry does not
// declare, that hint is a lie and the name silently collapses to empty when an
// administrator copies it into an override.
Deno.test("a default only uses placeholders the registry declares", () => {
  const wrong: string[] = [];
  for (const meta of CALL_SITES) {
    const text = DEFAULT_SYSTEM_PROMPTS[meta.call_site] ?? "";
    const used = new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
    for (const name of used) {
      if (!meta.placeholders.includes(name))
        wrong.push(`${meta.call_site}: {{${name}}}`);
    }
  }
  assertEquals(wrong, []);
});

Deno.test(
  "every placeholder the registry declares is used by its default",
  () => {
    const unused: string[] = [];
    for (const meta of CALL_SITES) {
      const text = DEFAULT_SYSTEM_PROMPTS[meta.call_site] ?? "";
      for (const name of meta.placeholders) {
        if (!text.includes(`{{${name}}}`))
          unused.push(`${meta.call_site}: {{${name}}}`);
      }
    }
    assertEquals(unused, []);
  },
);

Deno.test(
  "getDefaultSystemPrompt returns the text for a known call site",
  () => {
    assertEquals(
      getDefaultSystemPrompt("prompt-wizard"),
      DEFAULT_SYSTEM_PROMPTS["prompt-wizard"],
    );
  },
);

Deno.test(
  "getDefaultSystemPrompt returns null for a call site it does not know",
  () => {
    assertEquals(getDefaultSystemPrompt("no-such-call-site"), null);
  },
);

Deno.test("isDefaultSystemPrompt: the untouched default is the default", () => {
  assert(
    isDefaultSystemPrompt(
      "prompt-wizard",
      DEFAULT_SYSTEM_PROMPTS["prompt-wizard"],
    ),
  );
});

Deno.test(
  "isDefaultSystemPrompt: surrounding whitespace does not make it custom",
  () => {
    assert(
      isDefaultSystemPrompt(
        "prompt-wizard",
        `\n  ${DEFAULT_SYSTEM_PROMPTS["prompt-wizard"]}  \n`,
      ),
    );
  },
);

Deno.test("isDefaultSystemPrompt: one edited character makes it custom", () => {
  assertEquals(
    isDefaultSystemPrompt(
      "prompt-wizard",
      `${DEFAULT_SYSTEM_PROMPTS["prompt-wizard"]}.`,
    ),
    false,
  );
});

Deno.test(
  "isDefaultSystemPrompt: nothing matches a call site with no default",
  () => {
    assertEquals(isDefaultSystemPrompt("no-such-call-site", "anything"), false);
  },
);

// Requirement three of this piece of work. The box is prefilled now, so the
// commonest action on the page is opening a dialog and pressing Save without
// editing. If that wrote the text into the row, the call site would stop
// tracking future code changes and nobody would ever notice.
Deno.test(
  "normalizeSystemPrompt: saving the prefilled default stores nothing",
  () => {
    assertEquals(
      normalizeSystemPrompt(
        "prompt-wizard",
        DEFAULT_SYSTEM_PROMPTS["prompt-wizard"],
      ),
      null,
    );
  },
);

Deno.test(
  "normalizeSystemPrompt: an empty box still means the code default",
  () => {
    assertEquals(normalizeSystemPrompt("prompt-wizard", ""), null);
    assertEquals(normalizeSystemPrompt("prompt-wizard", "   \n  "), null);
    assertEquals(normalizeSystemPrompt("prompt-wizard", null), null);
  },
);

Deno.test("normalizeSystemPrompt: a real edit is kept exactly as typed", () => {
  const edited = `${DEFAULT_SYSTEM_PROMPTS["prompt-wizard"]}\n\nAlways answer in German.`;
  assertEquals(normalizeSystemPrompt("prompt-wizard", edited), edited);
});

Deno.test(
  "normalizeSystemPrompt: an unknown call site keeps whatever it is given",
  () => {
    assertEquals(normalizeSystemPrompt("no-such-call-site", "hello"), "hello");
  },
);

// ── Golden tests ────────────────────────────────────────────────────────────
//
// Two call sites had their prompt turned into a {{placeholder}} template as
// part of this move. These expectations were taken from the code as it stood
// before the move, so they fail if the rewrite changed a single character of
// what the model receives.

Deno.test(
  "canvas-ai: the template interpolates to the prompt the old builder produced",
  () => {
    const vars = {
      mode: "collab_edit",
      artifactType: "skill",
      canvasContent: "Line one of the canvas.\nLine two.",
      modeInstructions: modeInstructions("collab_edit"),
    };
    assertEquals(
      interpolatePrompt(CANVAS_AI_PROMPT, vars),
      'You are a professional prompt engineering assistant ("Prompt Coach").\nYou are helping the user improve their skill content.\n\nCURRENT CANVAS CONTENT:\n---\nLine one of the canvas.\nLine two.\n---\n\nMODE: collab_edit\nThe user wants collaborative editing. If the request is clear, return the full updated content in canvas.content with canvas.updated = true. If the request is unclear, ask ONE concise clarification question and set canvas.updated to false.\n\nRULES:\n- You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no extra text.\n- JSON schema:\n  {\n    "assistantMessage": "string — your explanation, advice, or clarification question",\n    "canvas": {\n      "updated": boolean,\n      "content": "string — the FULL updated content (only if updated is true)",\n      "changeNote": "string — brief description of changes (only if updated is true)"\n    }\n  }\n- When canvas.updated is false, omit content and changeNote or set them to null.\n- When canvas.updated is true, return the COMPLETE content, not a diff.\n- Be concise but helpful in your assistantMessage.\n- If the user\'s request is unclear, ask ONE clarification question and do NOT modify the canvas.',
    );
  },
);

Deno.test("canvas-ai: each mode still gets its own paragraph", () => {
  assert(
    modeInstructions("chat_only").startsWith("The user wants advice only"),
  );
  assert(
    modeInstructions("rewrite").startsWith("The user wants a full rewrite"),
  );
  assert(
    modeInstructions("collab_edit").startsWith(
      "The user wants collaborative editing",
    ),
  );
  assertEquals(
    modeInstructions("anything else"),
    modeInstructions("collab_edit"),
  );
});

// Identical to the old prompt but for one line. That line told the model to
// preserve "template variables like {{variable}}", and this prompt is now
// interpolated, so the interpolator would have eaten the example and left the
// sentence naming nothing.
Deno.test(
  "translate-artifact: the template interpolates to the old prompt, with the reworded rule",
  () => {
    const vars = {
      artifactType: "prompt",
      sourceLanguage: "English",
      targetLanguage: "German",
    };
    assertEquals(
      interpolatePrompt(TRANSLATE_PROMPT, vars),
      "You are a professional translator. Translate the following prompt from English to German.\n\nRules:\n- Preserve all Markdown formatting, headings, lists, and structure exactly.\n- Preserve placeholders exactly as-is and never translate them: double-brace template variables, [PLACEHOLDER], and $variables.\n- Preserve code blocks, inline code, URLs, file paths, and technical identifiers untranslated.\n- Translate tags contextually (they are short keywords/phrases) into lowercase German equivalents.\n- Keep the original tone and register (formal/informal).\n- Return the result via the translate_artifact tool.",
    );
  },
);

Deno.test(
  "translate-artifact: nothing that looks like a placeholder survives interpolation",
  () => {
    const vars = {
      artifactType: "prompt",
      sourceLanguage: "English",
      targetLanguage: "German",
    };
    const out = interpolatePrompt(TRANSLATE_PROMPT, vars) ?? "";
    assertEquals(out.match(/\{\{\w+\}\}/g), null);
  },
);

// What the coaches send is coach text plus the shared suffix, and an override
// replaces the whole system message. If the map showed only the coach half, an
// administrator would delete the tool-calling contract without seeing it.
Deno.test("a coach default is the coach text plus the shared suffix", () => {
  assertEquals(
    DEFAULT_SYSTEM_PROMPTS["skill-coach"],
    buildSystemPrompt({
      feature: "skill-coach",
      artifactName: "skill",
      systemPrompt: SKILL_COACH_PROMPT,
    }),
  );
  assert(
    DEFAULT_SYSTEM_PROMPTS["skill-coach"].includes(
      "ALWAYS reply by calling the `respond` tool",
    ),
  );
});

Deno.test("each coach's suffix names its own artifact", () => {
  assert(
    DEFAULT_SYSTEM_PROMPTS["prompt-kit-coach"].includes(
      "the full current prompt kit text",
    ),
  );
  assert(
    DEFAULT_SYSTEM_PROMPTS["workflow-coach"].includes(
      "the full current workflow text",
    ),
  );
});
