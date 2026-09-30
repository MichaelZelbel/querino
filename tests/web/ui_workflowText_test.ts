import { assertEquals } from "@std/assert";
import { workflowText } from "@/components/workflows/workflowText.ts";

Deno.test("an empty json default is no content, not the text {}", () => {
  assertEquals(workflowText("", {}), "");
  assertEquals(workflowText(null, []), "");
  assertEquals(workflowText(null, null), "");
});

Deno.test("content wins, legacy json is shown as text", () => {
  assertEquals(workflowText("steps", { a: 1 }), "steps");
  assertEquals(workflowText("", { a: 1 }), '{\n  "a": 1\n}');
  assertEquals(workflowText(undefined, "raw"), "raw");
});
