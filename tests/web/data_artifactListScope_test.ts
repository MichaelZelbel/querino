import { assertEquals } from "@std/assert";
import { hasArtifactListScope } from "@/lib/artifactListScope.ts";

Deno.test("a list without a scope does not run", () => {
  // The Library's options before the signed-in user is known.
  assertEquals(
    hasArtifactListScope({ authorId: undefined, teamId: undefined }),
    false,
  );
  assertEquals(hasArtifactListScope({}), false);
  assertEquals(hasArtifactListScope({ authorId: "", teamId: "" }), false);
});

Deno.test("the catalogue, one author and one team each run", () => {
  assertEquals(hasArtifactListScope({ published: true }), true);
  assertEquals(hasArtifactListScope({ published: false }), true);
  assertEquals(hasArtifactListScope({ authorId: "u1" }), true);
  assertEquals(hasArtifactListScope({ teamId: "t1" }), true);
});
