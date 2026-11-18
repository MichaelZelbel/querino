/**
 * The rules for the four lists on a public profile (/u/<name>), kept apart
 * from the loader, which needs the Supabase client, so they can be tested.
 *
 * A list is paged: the route loader brings the first page, and "Load more"
 * asks for the next one from where the shown list ends, until every public
 * item of the person has been shown. There is no cap (2026-11-18: michael has
 * 135 public prompts and the profile used to stop at the 60 newest).
 */
import {
  ARTIFACT_LIST_COLUMNS,
  ARTIFACT_PUBLIC_COLUMN,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";

/** How many artifacts of each kind one page of a profile list holds. */
export const PROFILE_PAGE_SIZE = 30;

/** The part of a PostgREST query builder (`supabase.from(table)`) a profile list uses. */
export interface ProfileListSource<Result> {
  select(
    columns: string,
    options: { count: "exact" },
  ): ProfileListFilters<Result>;
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
  range(from: number, to: number): Result;
}

/**
 * One page of a profile list: the author's public rows of one table, newest
 * first, starting at `offset`, with the count of all of them.
 *
 * The public filter is explicit, not left to row-level security: a signed-in
 * owner or team member running the loader in the browser can read their own
 * drafts and team-only items, and the profile must still show only what the
 * public sees. The count comes from the same filtered query, so it counts
 * only public rows too.
 */
export function profileListQuery<Result>(
  from: ProfileListSource<Result>,
  table: ArtifactListTable,
  authorId: string,
  offset = 0,
): Result {
  return (
    from
      .select(ARTIFACT_LIST_COLUMNS[table].join(", "), { count: "exact" })
      .eq("author_id", authorId)
      .filter(ARTIFACT_PUBLIC_COLUMN[table], "eq", true)
      .order("created_at", { ascending: false })
      // Timestamps can tie: the key gives the rows one fixed order, so one
      // page ends exactly where the next begins (listOrder.ts).
      .order("id", { ascending: true })
      .range(offset, offset + PROFILE_PAGE_SIZE - 1)
  );
}

/** A list as the profile holds it: the items shown and how many there are. */
export interface ProfileList<T> {
  items: T[];
  total: number;
}

/**
 * The list with the next page added. An item that is already shown is not
 * added again: something published between two pages pushes every later row
 * one place on, so the next page starts with the last row already shown.
 */
export function appendProfilePage<T extends { id: string }>(
  list: ProfileList<T>,
  page: ProfileList<T>,
): ProfileList<T> {
  const shown = new Set(list.items.map((item) => item.id));
  return {
    items: [...list.items, ...page.items.filter((item) => !shown.has(item.id))],
    total: page.total,
  };
}

/** Whether "Load more" has anything left to bring. */
export function hasMoreInProfileList(list: ProfileList<unknown>): boolean {
  return list.items.length < list.total;
}

/**
 * The profile name in an address (`/u/<name>`, `/u/<name>/`), decoded, or
 * null for any other address, its sub-pages included.
 */
export function profileNameFromPath(pathname: string): string | null {
  const match = /^\/u\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
