/**
 * The columns an artifact list asks for (useSkills, useWorkflows,
 * usePromptKits), and the author embedded with them.
 *
 * Every column a card, the Library or a bulk action reads, and not the two
 * that are only for the database: `embedding` (1,536 numbers, about 15 KB of
 * JSON per row) and `fts` (the generated search vector). With `select('*')`
 * every Discover visit downloaded both for every published skill, workflow and
 * kit, and the Library did the same for everything the user owns (2026-09-30).
 * Kept apart from the hooks, which need the Supabase client, so it can be tested.
 */
export type ArtifactListTable = "skills" | "workflows" | "prompt_kits";

const SHARED = [
  "id",
  "author_id",
  "team_id",
  "title",
  "description",
  "content",
  "category",
  "tags",
  "language",
  "published",
  "slug",
  "rating_avg",
  "rating_count",
  "menerio_synced",
  "menerio_note_id",
  "menerio_synced_at",
  "created_at",
  "updated_at",
];

export const ARTIFACT_LIST_COLUMNS: Record<ArtifactListTable, string[]> = {
  skills: SHARED,
  workflows: [...SHARED, "json", "filename", "scope"],
  prompt_kits: SHARED,
};

const AUTHOR = "profiles:author_id (id, display_name, avatar_url)";

/** The PostgREST select string for one artifact list. */
export function artifactListSelect(table: ArtifactListTable): string {
  return `${ARTIFACT_LIST_COLUMNS[table].join(", ")}, ${AUTHOR}`;
}
