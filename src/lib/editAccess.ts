import {
  ARTIFACT_DETAIL_ROUTE,
  ARTIFACT_PUBLIC_COLUMN,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";

// Who may edit or delete an artifact, mirroring the row-level security on
// prompts, skills, workflows and prompt_kits: the author, or a premium member
// of the team the artifact belongs to ("Premium team members can update team
// ..." / "... can delete team ..."). Premium means a user_roles row of
// premium, premium_gift or admin (public.is_premium_user). Until 2026-09-23
// the pages checked only author_id, so a teammate the database would let edit
// was turned away by the UI.

export const PREMIUM_ROLES: ReadonlySet<string> = new Set([
  "premium",
  "premium_gift",
  "admin",
]);

export interface EditableArtifact {
  author_id?: string | null;
  team_id?: string | null;
}

export function canEditArtifact(
  artifact: EditableArtifact | null | undefined,
  userId: string | null | undefined,
  teamIds: readonly string[],
  isPremium: boolean,
): boolean {
  if (!artifact || !userId) return false;
  if (artifact.author_id === userId) return true;
  return !!artifact.team_id && isPremium && teamIds.includes(artifact.team_id);
}

/** The row an Edit page loaded, as far as deciding access needs it. */
export type EditPageRow = EditableArtifact & { slug: string } & Partial<
    Record<(typeof ARTIFACT_PUBLIC_COLUMN)[ArtifactListTable], boolean | null>
  >;

/**
 * What an Edit page shows. `denied` is one message for every case where the
 * person may not edit, and it names nothing it did not load: a private or team
 * row the database hides from them arrives as no row at all, so it gets the
 * same Library link as a slug that never existed.
 */
export type EditAccess = { kind: "edit" } | { kind: "denied"; backTo: string };

export const EDIT_TYPE_LABEL: Record<ArtifactListTable, string> = {
  prompts: "prompt",
  skills: "skill",
  workflows: "workflow",
  prompt_kits: "prompt kit",
};

export function decideEditAccess(
  table: ArtifactListTable,
  row: EditPageRow | null | undefined,
  userId: string | null | undefined,
  teamIds: readonly string[],
  isPremium: boolean,
): EditAccess {
  if (row && canEditArtifact(row, userId, teamIds, isPremium)) {
    return { kind: "edit" };
  }
  return {
    kind: "denied",
    backTo: row?.[ARTIFACT_PUBLIC_COLUMN[table]]
      ? ARTIFACT_DETAIL_ROUTE[table].replace("$slug", row.slug)
      : "/library",
  };
}
