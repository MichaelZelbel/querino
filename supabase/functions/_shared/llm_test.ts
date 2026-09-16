import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildProviderRequest,
  estimateReservation,
  MIN_RESERVATION_TOKENS,
  MAX_OUTPUT_RESERVATION_TOKENS,
} from "./llm.ts";
import type { EffectiveConfig } from "./llm-config.ts";

const CONFIG: EffectiveConfig = {
  provider: "openrouter",
  model: "openai/gpt-4o-mini",
  system_prompt: "configured prompt",
  temperature: 0.2,
  max_tokens: 900,
};

Deno.test(
  "buildProviderRequest swaps the caller's system message for the configured one",
  () => {
    const req = buildProviderRequest(CONFIG, {
      messages: [
        { role: "system", content: "the code default" },
        { role: "user", content: "hello" },
      ],
      apiKey: "k",
    });
    assertEquals(req.provider, "openrouter");
    assertEquals(req.model, "openai/gpt-4o-mini");
    assertEquals(req.messages, [
      { role: "system", content: "configured prompt" },
      { role: "user", content: "hello" },
    ]);
    assertEquals(req.temperature, 0.2);
    assertEquals(req.maxTokens, 900);
  },
);

Deno.test(
  "buildProviderRequest leaves the caller's messages alone when the config has no prompt",
  () => {
    const req = buildProviderRequest(
      { ...CONFIG, system_prompt: null },
      {
        messages: [
          { role: "system", content: "the code default" },
          { role: "user", content: "hello" },
        ],
        apiKey: "k",
      },
    );
    assertEquals(req.messages, [
      { role: "system", content: "the code default" },
      { role: "user", content: "hello" },
    ]);
  },
);

Deno.test(
  "buildProviderRequest interpolates placeholders into the configured prompt",
  () => {
    const req = buildProviderRequest(
      { ...CONFIG, system_prompt: "Translate into {{targetLanguage}}." },
      {
        messages: [{ role: "user", content: "x" }],
        apiKey: "k",
        templateVars: { targetLanguage: "German" },
      },
    );
    assertEquals(req.messages[0], {
      role: "system",
      content: "Translate into German.",
    });
  },
);

Deno.test("estimateReservation never reserves less than the floor", () => {
  assertEquals(
    estimateReservation([{ role: "user", content: "hi" }], 10),
    MIN_RESERVATION_TOKENS,
  );
});

Deno.test(
  "estimateReservation grows with the input, one token per three characters",
  () => {
    const content = "x".repeat(30_000);
    assertEquals(
      estimateReservation([{ role: "user", content }], 500),
      10_000 + 500,
    );
  },
);

Deno.test(
  "estimateReservation holds a large max_tokens only up to its cap",
  () => {
    const content = "x".repeat(9_000);
    assertEquals(
      estimateReservation([{ role: "user", content }], 64_000),
      3_000 + MAX_OUTPUT_RESERVATION_TOKENS,
    );
  },
);

Deno.test("estimateReservation counts tool definitions as input", () => {
  const tools = [{ description: "y".repeat(12_000) }];
  const withTools = estimateReservation([], 1000, tools);
  const without = estimateReservation([], 1000);
  assertEquals(withTools > without, true);
});
