import { assertEquals } from "@std/assert";
import { withPartialMatch } from "@/lib/searchFallback.ts";

function recorder() {
  const calls: string[] = [];
  const q = {
    or(filter: string) {
      calls.push(filter);
      return q;
    },
  };
  return { q, calls };
}

// "summar" found nothing before 2026-09-30: whole words only.
Deno.test("every word becomes a fragment that must appear somewhere", () => {
  const { q, calls } = recorder();
  withPartialMatch(q, "summar email");
  assertEquals(calls.length, 2);
  for (const [i, word] of ["summar", "email"].entries()) {
    for (const column of ["title", "description", "content"]) {
      assertEquals(calls[i].includes(`${column}.imatch`), true);
    }
    assertEquals(calls[i].includes(word), true);
  }
});

Deno.test("a comma or a quote cannot break out of the filter", () => {
  const { q, calls } = recorder();
  withPartialMatch(q, 'a,b"c');
  assertEquals(calls.length, 1);
  // One or(...) with exactly three conditions: the comma stayed inside a value.
  assertEquals(calls[0].split(".imatch.").length - 1, 3);
});

Deno.test("a blank search adds no filter", () => {
  const { q, calls } = recorder();
  withPartialMatch(q, "   ");
  assertEquals(calls, []);
});

// Issue #16: `*` listed the whole catalogue, because ilike cannot say a
// literal asterisk and the old escaping sent `_` (any one character) instead.
Deno.test("a lone * is searched as an asterisk, not as a wildcard", () => {
  const { q, calls } = recorder();
  withPartialMatch(q, "*");
  assertEquals(calls, [
    'title.imatch."\\\\*",description.imatch."\\\\*",content.imatch."\\\\*"',
  ]);
});
