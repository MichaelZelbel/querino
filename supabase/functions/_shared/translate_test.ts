import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MAX_TRANSLATE_CHARS, tooLongToTranslate } from "./translate.ts";

Deno.test("content within the limit is translated", () => {
  assertEquals(
    tooLongToTranslate("a".repeat(MAX_TRANSLATE_CHARS), "skill"),
    null,
  );
  assertEquals(tooLongToTranslate("", "prompt"), null);
  assertEquals(tooLongToTranslate(undefined, "prompt"), null);
});

Deno.test(
  "longer content is refused, not cut: the translation would be missing its end",
  () => {
    // Until 2026-09-30 the content was cut at 16,000 characters and the
    // translation of the first part came back as the whole artifact, ready to
    // save as a new one. The longest skill in production is 69,984 characters.
    const message = tooLongToTranslate("a".repeat(69_984), "skill");
    assertEquals(typeof message, "string");
    assertStringIncludes(message!, "69,984");
    assertStringIncludes(message!, "16,000");
    assertStringIncludes(message!, "skill");
    assertEquals(message!.includes("—"), false);
  },
);

Deno.test("the artifact type in the message is plain words", () => {
  const message = tooLongToTranslate("a".repeat(20_000), "prompt_kit");
  assertStringIncludes(message!, "prompt kit");
});
