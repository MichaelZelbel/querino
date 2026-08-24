import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  pickConfig,
  mapRoleToTier,
  interpolatePrompt,
  applySystemPrompt,
  type ConfigRow,
  type CallDefaults,
} from "./llm-config.ts";

const DEFAULTS: CallDefaults = {
  provider: "lovable",
  model: "google/gemini-3-flash-preview",
  systemPrompt: "code default prompt",
};

function row(over: Partial<ConfigRow> = {}): ConfigRow {
  return {
    call_site: "prompt-coach",
    tier: "default",
    provider: "openai",
    model: "gpt-4o-mini",
    system_prompt: null,
    temperature: null,
    max_tokens: null,
    extra_options: {},
    enabled: true,
    ...over,
  };
}

Deno.test("pickConfig: no rows falls back to the code default", () => {
  const { effective, source } = pickConfig([], "free", DEFAULTS);
  assertEquals(source, "fallback-default");
  assertEquals(effective.provider, "lovable");
  assertEquals(effective.model, "google/gemini-3-flash-preview");
  assertEquals(effective.system_prompt, "code default prompt");
});

Deno.test(
  "pickConfig: the default row serves a free caller when no free row exists",
  () => {
    const { effective, source } = pickConfig([row()], "free", DEFAULTS);
    assertEquals(source, "db-default");
    assertEquals(effective.model, "gpt-4o-mini");
  },
);

Deno.test("pickConfig: a premium row wins for a premium caller", () => {
  const rows = [row(), row({ tier: "premium", model: "gpt-4o" })];
  const { effective, source } = pickConfig(rows, "premium", DEFAULTS);
  assertEquals(source, "db-premium");
  assertEquals(effective.model, "gpt-4o");
});

Deno.test("pickConfig: a premium row does not leak to a free caller", () => {
  const rows = [row(), row({ tier: "premium", model: "gpt-4o" })];
  const { effective } = pickConfig(rows, "free", DEFAULTS);
  assertEquals(effective.model, "gpt-4o-mini");
});

Deno.test(
  "pickConfig: a disabled tier row falls through to the tier below it",
  () => {
    const rows = [
      row(),
      row({ tier: "premium", model: "gpt-4o", enabled: false }),
    ];
    const { effective, source } = pickConfig(rows, "premium", DEFAULTS);
    assertEquals(source, "db-default");
    assertEquals(effective.model, "gpt-4o-mini");
  },
);

Deno.test(
  "pickConfig: a disabled default row falls all the way through to code",
  () => {
    const { effective, source } = pickConfig(
      [row({ enabled: false })],
      "free",
      DEFAULTS,
    );
    assertEquals(source, "fallback-default");
    assertEquals(effective.model, "google/gemini-3-flash-preview");
  },
);

Deno.test("pickConfig: an empty system_prompt is not an override", () => {
  const { effective } = pickConfig(
    [row({ system_prompt: "   " })],
    "free",
    DEFAULTS,
  );
  assertEquals(effective.system_prompt, "code default prompt");
});

Deno.test(
  "mapRoleToTier maps the paying roles to premium and everything else to free",
  () => {
    assertEquals(mapRoleToTier("premium"), "premium");
    assertEquals(mapRoleToTier("premium_gift"), "premium");
    assertEquals(mapRoleToTier("admin"), "premium");
    assertEquals(mapRoleToTier("free"), "free");
    assertEquals(mapRoleToTier(null), "free");
    assertEquals(mapRoleToTier("something-new"), "free");
  },
);

Deno.test("interpolatePrompt substitutes a value", () => {
  assertEquals(
    interpolatePrompt("Translate into {{targetLanguage}}.", {
      targetLanguage: "German",
    }),
    "Translate into German.",
  );
});

Deno.test(
  "interpolatePrompt collapses a missing key rather than leaking braces",
  () => {
    assertEquals(interpolatePrompt("Hello {{nobody}}!", {}), "Hello !");
  },
);

Deno.test("interpolatePrompt leaves a null prompt null", () => {
  assertEquals(interpolatePrompt(null, { a: "b" }), null);
});

Deno.test("applySystemPrompt replaces an existing system message", () => {
  const out = applySystemPrompt(
    [
      { role: "system", content: "old" },
      { role: "user", content: "hi" },
    ],
    "new",
  );
  assertEquals(out, [
    { role: "system", content: "new" },
    { role: "user", content: "hi" },
  ]);
});

Deno.test("applySystemPrompt prepends when there is no system message", () => {
  const out = applySystemPrompt([{ role: "user", content: "hi" }], "new");
  assertEquals(out, [
    { role: "system", content: "new" },
    { role: "user", content: "hi" },
  ]);
});

Deno.test(
  "applySystemPrompt leaves the caller's messages alone when there is no override",
  () => {
    const msgs = [
      { role: "system" as const, content: "old" },
      { role: "user" as const, content: "hi" },
    ];
    assertEquals(applySystemPrompt(msgs, null), msgs);
  },
);
