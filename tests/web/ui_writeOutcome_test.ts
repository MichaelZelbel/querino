import { assertEquals } from "@std/assert";
import { writeOutcome } from "@/components/editors/writeOutcome.ts";

Deno.test("a write that matched no row is not a success", () => {
  // What PostgREST answers when row-level security filters the row out: no
  // error, no rows. The editors used to say "Changes saved!" here.
  assertEquals(writeOutcome({ error: null, data: [] }), "nothing");
  assertEquals(writeOutcome({ error: null, data: null }), "nothing");
  assertEquals(writeOutcome({ error: null, data: [{ id: "a" }] }), "written");
  assertEquals(
    writeOutcome({ error: { message: "boom" }, data: null }),
    "failed",
  );
});
