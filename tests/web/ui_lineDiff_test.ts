import { assertEquals } from "@std/assert";
import { diffCounts, diffLines, sideBySide } from "@/lib/lineDiff.ts";
import { suggestionBaseState } from "@/components/suggestions/suggestionBase.ts";

// The suggestion review window compared line N with line N, so one inserted
// line marked everything below it as changed and hid what accepting would
// really delete (2026-10-07).

Deno.test("one inserted line is one added line, nothing else", () => {
  const ops = diffLines("a\nb\nc\nd", "a\nNEW\nb\nc\nd");
  assertEquals(diffCounts(ops), { removed: 0, added: 1 });
  assertEquals(
    ops.filter((o) => o.type !== "unchanged"),
    [{ type: "added", content: "NEW", newLine: 2 }],
  );
});

Deno.test("a line the author added later shows as removed", () => {
  // The suggestion was written against "a b c"; the author has since added
  // "later" to the artifact. Accepting replaces the content, so "later" goes,
  // and the diff against the current content must say so.
  const current = "a\nlater\nb\nc";
  const suggested = "a\nb\nc\nsuggested";
  const ops = diffLines(current, suggested);
  assertEquals(diffCounts(ops), { removed: 1, added: 1 });
  assertEquals(
    ops.filter((o) => o.type === "removed").map((o) => o.content),
    ["later"],
  );
});

Deno.test("line numbers follow each side", () => {
  const ops = diffLines("x\ny\nz", "x\nz\nw");
  assertEquals(ops, [
    { type: "unchanged", content: "x", oldLine: 1, newLine: 1 },
    { type: "removed", content: "y", oldLine: 2 },
    { type: "unchanged", content: "z", oldLine: 3, newLine: 2 },
    { type: "added", content: "w", newLine: 3 },
  ]);
});

Deno.test("identical texts and Windows line endings give no change", () => {
  assertEquals(diffCounts(diffLines("a\r\nb", "a\nb")), {
    removed: 0,
    added: 0,
  });
  assertEquals(diffCounts(diffLines("", "")), { removed: 0, added: 0 });
});

Deno.test("a rewritten line sits beside its replacement", () => {
  const rows = sideBySide(diffLines("a\nold\nc", "a\nnew\nc"));
  assertEquals(rows.length, 3);
  assertEquals(rows[1], {
    left: { type: "removed", content: "old", line: 2 },
    right: { type: "added", content: "new", line: 2 },
  });
  // An uneven run leaves a gap on the shorter side.
  const uneven = sideBySide(diffLines("a\nb", "a\nx\ny\nz"));
  assertEquals(uneven.length, 4);
  assertEquals(uneven[3].left, null);
});

Deno.test("a very long text still diffs, without the table", () => {
  const a = Array.from({ length: 3000 }, (_, i) => `a${i}`).join("\n");
  const b = Array.from({ length: 3000 }, (_, i) => `b${i}`).join("\n");
  assertEquals(diffCounts(diffLines(a, b)), { removed: 3000, added: 3000 });
});

Deno.test(
  "what the review says about the text a suggestion was based on",
  () => {
    assertEquals(suggestionBaseState(null, "x"), "unknown");
    assertEquals(suggestionBaseState(undefined, "x"), "unknown");
    assertEquals(suggestionBaseState("x\n", "x"), "unchanged");
    assertEquals(suggestionBaseState("x\r\ny", "x\ny"), "unchanged");
    assertEquals(suggestionBaseState("x", "x and a later edit"), "changed");
  },
);
