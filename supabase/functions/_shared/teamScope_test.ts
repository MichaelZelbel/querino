// The condition the MCP server adds to every update, so that an author who
// is no longer in a team cannot edit that team's artifacts there either.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { editableTeamFilter } from "./teamScope.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

Deno.test("no teams: only personal artifacts are editable", () => {
  assertEquals(editableTeamFilter([]), "team_id.is.null");
});

Deno.test("personal artifacts and the caller's own teams are editable", () => {
  assertEquals(
    editableTeamFilter([A, B]),
    `team_id.is.null,team_id.in.(${A},${B})`,
  );
});

Deno.test("a team listed twice appears once", () => {
  assertEquals(editableTeamFilter([A, A]), `team_id.is.null,team_id.in.(${A})`);
});

Deno.test(
  "anything that is not a uuid is dropped, never pasted into the filter",
  () => {
    // A comma or a parenthesis here would be PostgREST syntax and could widen
    // the condition; dropping an id can only narrow it.
    assertEquals(
      editableTeamFilter([`${A}),author_id.not.is.null,(x`, null, 7, ""]),
      "team_id.is.null",
    );
    assertEquals(
      editableTeamFilter(["not-a-uuid", B]),
      `team_id.is.null,team_id.in.(${B})`,
    );
  },
);
