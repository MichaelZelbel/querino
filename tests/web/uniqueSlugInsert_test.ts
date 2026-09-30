import { assertEquals } from "@std/assert";
import {
  insertWithUniqueSlug,
  isSlugCollision,
} from "@/lib/uniqueSlugInsert.ts";

Deno.test("a duplicate slug is a collision, any other error is not", () => {
  assertEquals(
    isSlugCollision({
      code: "23505",
      message:
        'duplicate key value violates unique constraint "prompts_slug_key"',
    }),
    true,
  );
  assertEquals(
    isSlugCollision({
      code: "23505",
      message: "duplicate key on something_else",
    }),
    false,
  );
  assertEquals(
    isSlugCollision({ code: "42501", message: "permission denied" }),
    false,
  );
  assertEquals(isSlugCollision(null), false);
});

Deno.test("a taken slug walks -2, -3 until one is free", async () => {
  const tried: (string | null)[] = [];
  const taken = new Set(["code-review", "code-review-2"]);
  const result = await insertWithUniqueSlug("code-review", async (slug) => {
    tried.push(slug);
    return {
      error: taken.has(slug ?? "") ? { code: "23505", message: "slug" } : null,
    };
  });
  assertEquals(result.error, null);
  assertEquals(tried, ["code-review", "code-review-2", "code-review-3"]);
});
