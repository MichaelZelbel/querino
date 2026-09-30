import { assertEquals } from "@std/assert";

// The module runs in a browser; give it the one global it reads.
(globalThis as unknown as { window: unknown }).window = globalThis;
const { draftUrl, readDraft, HANDOFF_PARAM } =
  await import("@/lib/draftStore.ts");

// Until 2026-09-30 the first read removed the draft, so a reload of
// /prompts/new?handoff=... came back to an empty form.
Deno.test("a handed-over draft survives a second read (a reload)", () => {
  const url = draftUrl("/prompts/new", { title: "T", content: "Body" });
  const key = new URL(url, "https://x.invalid").searchParams.get(HANDOFF_PARAM);
  assertEquals(readDraft(key), { title: "T", content: "Body" });
  assertEquals(readDraft(key), { title: "T", content: "Body" });
});

Deno.test("an unknown key or no key is no draft", () => {
  assertEquals(readDraft("nope"), null);
  assertEquals(readDraft(null), null);
});
