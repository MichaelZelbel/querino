import { assertEquals } from "@std/assert";
import { commentAccess } from "@/components/comments/commentAccess.ts";

Deno.test(
  "a private item outside a team offers no comment box, even to its author",
  () => {
    // is_item_public is false and is_team_member_for_item has no team: both
    // insert rules on public.comments refuse, so the box only produced an error.
    assertEquals(
      commentAccess({ isPublic: false, teamId: null, signedIn: true }),
      "private",
    );
    assertEquals(
      commentAccess({ isPublic: false, teamId: null, signedIn: false }),
      "private",
    );
  },
);

Deno.test("public items and team items keep their comment box", () => {
  assertEquals(
    commentAccess({ isPublic: true, teamId: null, signedIn: true }),
    "open",
  );
  assertEquals(
    commentAccess({ isPublic: true, teamId: null, signedIn: false }),
    "sign-in",
  );
  // Team members may comment on the team's private items.
  assertEquals(
    commentAccess({ isPublic: false, teamId: "t1", signedIn: true }),
    "open",
  );
  assertEquals(
    commentAccess({ isPublic: false, teamId: "t1", signedIn: false }),
    "hidden",
  );
  // A caller that does not say keeps the old behaviour.
  assertEquals(commentAccess({ signedIn: true }), "open");
});
