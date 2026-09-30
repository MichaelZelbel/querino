import { assertEquals } from "@std/assert";
import { invitePreviewView } from "@/components/teams/invitePreview.ts";

const row = {
  team_name: "Growth",
  role: "member",
  invited_by: "Ana",
  expires_at: "2026-10-10T00:00:00Z",
  already_member: false,
};

Deno.test("the question names the team and who sent the link", () => {
  assertEquals(invitePreviewView({ status: "ok", rows: [row] }), {
    kind: "named",
    teamName: "Growth",
    invitedBy: "Ana",
    role: "member",
  });
  assertEquals(
    invitePreviewView({
      status: "ok",
      rows: [{ ...row, invited_by: null, role: "admin" }],
    }),
    { kind: "named", teamName: "Growth", invitedBy: null, role: "admin" },
  );
});

Deno.test("no row means the link is dead, before anyone presses Join", () => {
  assertEquals(invitePreviewView({ status: "ok", rows: [] }), {
    kind: "invalid",
  });
  assertEquals(invitePreviewView({ status: "ok", rows: null }), {
    kind: "invalid",
  });
});

Deno.test("a member is told so instead of being asked to join again", () => {
  assertEquals(
    invitePreviewView({
      status: "ok",
      rows: [{ ...row, already_member: true }],
    }),
    { kind: "member", teamName: "Growth" },
  );
});

Deno.test("a preview that cannot be read never blocks the join", () => {
  // e.g. the function is not deployed yet: the old nameless question stays.
  assertEquals(invitePreviewView({ status: "error" }), { kind: "unnamed" });
  assertEquals(invitePreviewView({ status: "loading" }), { kind: "loading" });
});
