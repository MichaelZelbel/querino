/**
 * The columns an artifact list or detail page asks for, and the author
 * embedded with them.
 *
 * Every column a card, the Library, a detail page or a bulk action reads, and
 * not the ones that are only for the database: `embedding` (1,536 numbers,
 * about 15 KB of JSON per row), `fts` (the generated search vector) and the
 * embedding job's bookkeeping. With `select('*')` every Discover visit
 * downloaded the vector for every published skill, workflow and kit, and the
 * Library did the same for everything the user owns (2026-09-30). Prompts were
 * left out of that fix: on 2026-10-07 a Discover page of 24 prompts still
 * weighed 522 to 568 KB of JSON instead of about 40 KB, and the author with
 * 174 prompts downloaded 3.7 MB on every Library visit.
 *
 * Kept apart from the hooks, which need the Supabase client, so it can be tested.
 */
export type ArtifactListTable =
  "prompts" | "skills" | "workflows" | "prompt_kits";

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
  // Prompts have `is_public` where the other three have `published`, and the
  // fields PromptCard, its clone button and the detail page show.
  prompts: [
    ...SHARED,
    "is_public",
    "summary",
    "example_output",
    "copies_count",
    "published_at",
  ],
  skills: [...SHARED, "published"],
  workflows: [...SHARED, "published", "json", "filename", "scope"],
  prompt_kits: [...SHARED, "published"],
};

/**
 * A detail page reads every column a list does: the server loader writes
 * whatever it returns into the HTML as the router's page data, so a column
 * nobody reads costs every visitor. Since 2026-10-07 the route loader is the
 * only fetch a detail page makes, so this is also what the page itself has.
 * When a table gains a column a page needs, add it to the list above.
 */
export const ARTIFACT_DETAIL_COLUMNS: Record<ArtifactListTable, string[]> =
  ARTIFACT_LIST_COLUMNS;

const AUTHOR = "profiles:author_id (id, display_name, avatar_url)";

/** The PostgREST select string for one artifact list. */
export function artifactListSelect(table: ArtifactListTable): string {
  return `${ARTIFACT_LIST_COLUMNS[table].join(", ")}, ${AUTHOR}`;
}

/** The PostgREST select string for one artifact's detail page. */
export function artifactDetailSelect(table: ArtifactListTable): string {
  return `${ARTIFACT_DETAIL_COLUMNS[table].join(", ")}, ${AUTHOR}`;
}
