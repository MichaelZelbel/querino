// What the invite page says before anyone joins, from the answer of
// get_team_invite_preview (migration 20260930100600). The page used to ask
// "Join this team?" without saying which team or who sent the link, because a
// team is readable only by its members.

export interface InvitePreviewRow {
  team_name: string | null;
  role: string | null;
  invited_by: string | null;
  expires_at: string | null;
  already_member: boolean | null;
}

export type InvitePreviewView =
  /** Still asking the database. */
  | { kind: "loading" }
  /** The preview could not be read (for instance the function is not deployed
   *  yet): fall back to the nameless question rather than block the join. */
  | { kind: "unnamed" }
  /** No row: the token is unknown or expired. Joining would fail anyway. */
  | { kind: "invalid" }
  | { kind: "member"; teamName: string }
  | {
      kind: "named";
      teamName: string;
      invitedBy: string | null;
      role: string;
    };

export function invitePreviewView(
  answer:
    | { status: "loading" }
    | { status: "error" }
    | { status: "ok"; rows: InvitePreviewRow[] | null },
): InvitePreviewView {
  if (answer.status === "loading") return { kind: "loading" };
  if (answer.status === "error") return { kind: "unnamed" };
  const row = answer.rows?.[0];
  if (!row) return { kind: "invalid" };
  const teamName = row.team_name?.trim() || "this team";
  if (row.already_member) return { kind: "member", teamName };
  return {
    kind: "named",
    teamName,
    invitedBy: row.invited_by?.trim() || null,
    role: row.role === "admin" ? "admin" : "member",
  };
}
