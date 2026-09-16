import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MAX_INPUT_CHARS,
  embeddableText,
  statusBlamesInput,
  truncateToTokenBudget,
} from "./embeddings.ts";

Deno.test("English prose is kept well past the old 8,000 characters", () => {
  const prose = "the quick brown fox jumps over the lazy dog ".repeat(300);
  assertEquals(truncateToTokenBudget(prose, 7_000).length, prose.length);
});

Deno.test(
  "CJK text is cut by its byte weight, so it stays under the model's limit",
  () => {
    const cjk = "漢".repeat(8_000);
    const cut = truncateToTokenBudget(cjk, 7_000);
    // Three bytes each: at most 2,333 characters fit a 7,000-token budget.
    assertEquals(cut.length, 2_333);
  },
);

Deno.test("an emoji is never split in half", () => {
  const emoji = "😀".repeat(5_000);
  const cut = truncateToTokenBudget(emoji, 10);
  // Four "tokens" each, two whole emoji, four UTF-16 code units.
  assertEquals(cut, "😀😀");
});

Deno.test("the character ceiling holds whatever the estimate allows", () => {
  const spaces = " ".repeat(MAX_INPUT_CHARS * 2);
  assertEquals(
    truncateToTokenBudget(spaces, 1_000_000).length,
    MAX_INPUT_CHARS,
  );
});

Deno.test("embeddableText joins the fields and applies the same budget", () => {
  const row = { title: "T", description: null, content: "漢".repeat(8_000) };
  const text = embeddableText(row, ["title", "description", "content"]);
  assertEquals(text.startsWith("T\n\n"), true);
  assertEquals(text.length < 3_000, true);
});

Deno.test("only a refusal of the text itself spends an attempt", () => {
  assertEquals(statusBlamesInput(400), true);
  assertEquals(statusBlamesInput(413), true);
  assertEquals(statusBlamesInput(422), true);
  assertEquals(statusBlamesInput(401), false);
  assertEquals(statusBlamesInput(402), false);
  assertEquals(statusBlamesInput(429), false);
  assertEquals(statusBlamesInput(500), false);
  assertEquals(statusBlamesInput(503), false);
});
