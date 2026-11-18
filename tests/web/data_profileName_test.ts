import { assertEquals } from "@std/assert";
import {
  caseInsensitiveNamePattern,
  pickNameIgnoringCase,
  sameNameIgnoringCase,
} from "@/lib/profileName.ts";

Deno.test(
  "an address in other letter case names the stored spelling (#25)",
  () => {
    assertEquals(pickNameIgnoringCase("Michael", ["michael"]), "michael");
    assertEquals(pickNameIgnoringCase("MICHAEL", ["michael"]), "michael");
    assertEquals(pickNameIgnoringCase("michael", ["Michael"]), "Michael");
  },
);

Deno.test("an exact spelling wins over every other case", () => {
  assertEquals(pickNameIgnoringCase("Ann", ["ann", "Ann", "ANN"]), "Ann");
});

Deno.test("no name in any case is a miss", () => {
  assertEquals(pickNameIgnoringCase("Michael", []), null);
  assertEquals(pickNameIgnoringCase("Michael", [null, ""]), null);
});

Deno.test("a wider ILIKE candidate that is not the name is not taken", () => {
  // `*` in an address becomes `_`, which also matches other characters.
  assertEquals(pickNameIgnoringCase("a*b", ["axb"]), null);
  assertEquals(pickNameIgnoringCase("a*b", ["axb", "A*B"]), "A*B");
  assertEquals(pickNameIgnoringCase("ann", ["anne"]), null);
});

Deno.test(
  "two names that differ only in case are a miss, never a guess",
  () => {
    // The unique index on lower(display_name) rules this out today; if it
    // ever happened, neither person is shown in the other's place.
    assertEquals(pickNameIgnoringCase("ANN", ["ann", "Ann"]), null);
  },
);

Deno.test("the same stored name twice is still that one name", () => {
  assertEquals(pickNameIgnoringCase("ANN", ["ann", "ann"]), "ann");
});

Deno.test("the ILIKE pattern matches the name literally", () => {
  assertEquals(caseInsensitiveNamePattern("Michael"), "Michael");
  assertEquals(caseInsensitiveNamePattern("a_b"), "a\\_b");
  assertEquals(caseInsensitiveNamePattern("100%"), "100\\%");
  assertEquals(caseInsensitiveNamePattern("back\\slash"), "back\\\\slash");
  assertEquals(caseInsensitiveNamePattern("a*b"), "a_b");
  assertEquals(caseInsensitiveNamePattern("Jürgen Ö"), "Jürgen Ö");
});

Deno.test("names compare ignoring case, beyond ASCII too", () => {
  assertEquals(sameNameIgnoringCase("Jürgen", "JÜRGEN"), true);
  assertEquals(sameNameIgnoringCase("ann", "anne"), false);
});
