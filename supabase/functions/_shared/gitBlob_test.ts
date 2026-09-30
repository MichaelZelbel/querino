import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { gitBlobSha } from "./gitBlob.ts";

// The expected values are what `git hash-object --stdin` prints for the same
// bytes, so the manual sync records exactly the SHA GitHub stores.
Deno.test("the blob SHA is git's own", async () => {
  assertEquals(
    await gitBlobSha("hello world\n"),
    "3b18e512dba79e4c8300dd08aeb37f8e728b8dad",
  );
  assertEquals(
    await gitBlobSha(""),
    "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391",
  );
});

Deno.test("the length git hashes is bytes, not characters", async () => {
  assertEquals(
    await gitBlobSha('Grüße 漢字 😀\n---\ntitle: "x"\n'),
    "b91797cbd42042776269a9489ee10efef92e9f71",
  );
});
