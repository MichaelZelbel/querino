import { assertEquals } from "@std/assert";
import {
  allTermsFilters,
  containsFilter,
  escapeRegexLiteral,
} from "@/lib/postgrestFilter.ts";

// Issue #16, 2026-11-18. A search term reaches PostgreSQL through two layers:
// PostgREST's quoted-value parser (eats one backslash before any character)
// and the regex of `imatch` (a backslash before a non-alphanumeric character
// means that character). Every expected string below is what PostgREST
// receives, written with String.raw so the backslashes are the real ones.
// The same strings were sent to the live project and matched exactly the rows
// a local scan of the public prompts found.

Deno.test("letters and digits pass through unchanged", () => {
  assertEquals(escapeRegexLiteral("summar"), "summar");
  assertEquals(escapeRegexLiteral("GPT4"), "GPT4");
  assertEquals(escapeRegexLiteral("Größe"), "Größe");
});

Deno.test("wildcards of ilike and regex are literal", () => {
  assertEquals(escapeRegexLiteral("*"), String.raw`\\*`);
  assertEquals(escapeRegexLiteral("%"), String.raw`\\%`);
  assertEquals(escapeRegexLiteral("_"), String.raw`\\_`);
  assertEquals(escapeRegexLiteral("%_*"), String.raw`\\%\\_\\*`);
  assertEquals(
    escapeRegexLiteral(".+?^$|[]{}"),
    String.raw`\\.\\+\\?\\^\\$\\|\\[\\]\\{\\}`,
  );
});

Deno.test("a backslash and a double quote get PostgREST's escape too", () => {
  assertEquals(escapeRegexLiteral("\\"), String.raw`\\\\`);
  assertEquals(escapeRegexLiteral('"'), String.raw`\\\"`);
  assertEquals(escapeRegexLiteral('say "hi"'), String.raw`say\\ \\\"hi\\\"`);
});

Deno.test(
  "quotes, commas, parentheses and semicolons stay inside the value",
  () => {
    assertEquals(escapeRegexLiteral("'"), String.raw`\\'`);
    assertEquals(escapeRegexLiteral("a,b(c)"), String.raw`a\\,b\\(c\\)`);
    assertEquals(escapeRegexLiteral(";"), String.raw`\\;`);
    assertEquals(escapeRegexLiteral(":(){"), String.raw`\\:\\(\\)\\{`);
  },
);

Deno.test(
  "the escaped value never ends the quoted PostgREST value early",
  () => {
    for (const input of ['"', '\\"', '\\\\"', 'a"b', '"),title.eq.x']) {
      const value = escapeRegexLiteral(input);
      // Undo PostgREST's layer: \X -> X. An unescaped " would end the value.
      let unquoted = "";
      for (let i = 0; i < value.length; i++) {
        if (value[i] === "\\") {
          unquoted += value[++i];
        } else {
          assertEquals(value[i] === '"', false, `bare quote in ${value}`);
          unquoted += value[i];
        }
      }
      // What the regex sees: a backslash before every character that is not a
      // letter or a digit, nothing else, so it reads as the input exactly.
      assertEquals(unquoted.replace(/\\(.)/gu, "$1"), input);
    }
  },
);

Deno.test(
  "one filter term is a case-insensitive regex match on the column",
  () => {
    assertEquals(
      containsFilter("title", "a*b"),
      String.raw`title.imatch."a\\*b"`,
    );
  },
);

Deno.test("a punctuation-only query is one term per word, each escaped", () => {
  assertEquals(allTermsFilters(["title"], "'; drop table prompts; --"), [
    String.raw`title.imatch."\\'\\;"`,
    `title.imatch."drop"`,
    `title.imatch."table"`,
    String.raw`title.imatch."prompts\\;"`,
    String.raw`title.imatch."\\-\\-"`,
  ]);
});
