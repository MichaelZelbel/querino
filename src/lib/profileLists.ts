/**
 * The rules for the four lists on a public profile (/u/<name>), kept apart
 * from the loader, which needs the Supabase client, so they can be tested.
 */
import type { ArtifactListTable } from "@/lib/artifactListColumns.ts";

/** How many artifacts of each kind a profile page shows. */
export const PROFILE_LIST_LIMIT = 60;

/**
 * The column that makes a row public. The filter is explicit in the query, not
 * left to row-level security: a signed-in owner or team member running the
 * loader in the browser can read their own drafts and team-only items, and the
 * profile must still show only what the public sees.
 */
export const PROFILE_PUBLIC_COLUMN = {
  prompts: "is_public",
  skills: "published",
  workflows: "published",
  prompt_kits: "published",
} as const satisfies Record<ArtifactListTable, "is_public" | "published">;

/**
 * A profile asks for one row past the limit, shows the limit, and says there
 * are more when that extra row came back.
 */
export function cutProfileList<T>(rows: T[] | null | undefined): {
  items: T[];
  truncated: boolean;
} {
  const all = rows ?? [];
  return {
    items: all.slice(0, PROFILE_LIST_LIMIT),
    truncated: all.length > PROFILE_LIST_LIMIT,
  };
}
