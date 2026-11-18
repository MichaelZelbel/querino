/**
 * The rules for the four lists on a public profile (/u/<name>), kept apart
 * from the loader, which needs the Supabase client, so they can be tested.
 */
import {
  ARTIFACT_LIST_COLUMNS,
  ARTIFACT_PUBLIC_COLUMN,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";

/** How many artifacts of each kind a profile page shows. */
export const PROFILE_LIST_LIMIT = 60;

/** The part of a PostgREST query builder (`supabase.from(table)`) a profile list uses. */
export interface ProfileListSource<Result> {
  select(columns: string): ProfileListFilters<Result>;
}

export interface ProfileListFilters<Result> {
  eq(column: "author_id", value: string): ProfileListFilters<Result>;
  filter(
    column: string,
    operator: "eq",
    value: boolean,
  ): ProfileListFilters<Result>;
  order(
    column: string,
    options: { ascending: boolean },
  ): ProfileListFilters<Result>;
  limit(count: number): Result;
}

/**
 * One profile list: the author's newest public rows of one table, one past the
 * limit (see cutProfileList).
 *
 * The public filter is explicit, not left to row-level security: a signed-in
 * owner or team member running the loader in the browser can read their own
 * drafts and team-only items, and the profile must still show only what the
 * public sees.
 */
export function profileListQuery<Result>(
  from: ProfileListSource<Result>,
  table: ArtifactListTable,
  authorId: string,
): Result {
  return (
    from
      .select(ARTIFACT_LIST_COLUMNS[table].join(", "))
      .eq("author_id", authorId)
      .filter(ARTIFACT_PUBLIC_COLUMN[table], "eq", true)
      .order("created_at", { ascending: false })
      // Timestamps can tie: the key makes the cut at the limit the same rows
      // on the server and in the browser (listOrder.ts).
      .order("id", { ascending: true })
      .limit(PROFILE_LIST_LIMIT + 1)
  );
}

/**
 * A profile asks for one row past the limit, shows the limit, and says there
 * are more when that extra row came back.
 */
export function cutProfileList<T>(rows: T[]): {
  items: T[];
  truncated: boolean;
} {
  return {
    items: rows.slice(0, PROFILE_LIST_LIMIT),
    truncated: rows.length > PROFILE_LIST_LIMIT,
  };
}
