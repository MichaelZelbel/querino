import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MAX_REFINE_CHARS,
  refuseTooLong,
  tooLongToRefine,
} from "./inputLimit.ts";

Deno.test("a prompt within the limit is refined", () => {
  assertEquals(tooLongToRefine("a".repeat(MAX_REFINE_CHARS)), null);
  assertEquals(tooLongToRefine(""), null);
  assertEquals(tooLongToRefine(undefined), null);
});

Deno.test(
  "a longer prompt is refused, not cut: the dialog would save the rewrite of its start as the whole",
  () => {
    // Until 2026-10-07 refine-prompt read the first 16,000 characters and the
    // Refine dialog saved the rewrite of that start over the entire prompt.
    const message = tooLongToRefine("a".repeat(20_000));
    assertEquals(typeof message, "string");
    assertStringIncludes(message!, "This prompt is 20,000 characters long");
    assertStringIncludes(message!, "16,000");
    assertStringIncludes(
      message!,
      "Nothing was refined and no credits were used.",
    );
    assertEquals(message!.includes("—"), false);
  },
);

Deno.test("the limit is the first character past the maximum", () => {
  const limit = { max: 10, what: "note", task: "reading", done: "read" };
  assertEquals(refuseTooLong("a".repeat(10), limit), null);
  assertEquals(
    refuseTooLong("a".repeat(11), limit),
    "This note is 11 characters long, and reading handles up to 10. Nothing was read and no credits were used.",
  );
  assertEquals(refuseTooLong(12345, limit), null);
});
