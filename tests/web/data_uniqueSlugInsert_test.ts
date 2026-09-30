import { assertEquals } from "@std/assert";
import { isSlugCollision } from "@/lib/uniqueSlugInsert.ts";

Deno.test("a slug that still redirects elsewhere is a collision", () => {
  // The exact error production raises (refuse_redirect_slug_takeover uses
  // ERRCODE unique_violation, checked 2026-09-30), so the New pages walk on
  // to -2 instead of failing.
  assertEquals(
    isSlugCollision({
      code: "23505",
      message: 'The slug "code-review" still redirects to another prompt',
    }),
    true,
  );
});
