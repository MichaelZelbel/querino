/**
 * Server-side fetches for the public detail routes.
 *
 * A TanStack route `loader` runs on the server for the first request and on the client
 * for later navigations. That is what puts the artefact into the HTML instead of only
 * into the page after hydration, and it is what lets `head()` build a real title from a
 * real record.
 *
 * These use the same anon Supabase client the components use, so they are subject to the
 * same row-level security. A logged-out server request sees exactly what a logged-out
 * visitor sees, which is the point.
 *
 * The four artefact loaders answer the way a crawler needs (2026-10-07). They used to
 * return null for a database error, for a pre-slug UUID address and for a renamed slug
 * alike, and the page then went out as "Not Found | Querino", noindex, with HTTP 200:
 * Google's soft 404, and a link preview of an old link said "Not Found". Old addresses
 * were only sent on by the page's own script after hydration, which a crawler never runs.
 * Now a database error throws (the error page, HTTP 500, which a crawler retries), an old
 * address throws a 301 to the current one, and only a true miss is notFound() (HTTP 404).
 * The browser runs the same loader once more with the visitor's session when the server
 * found nothing, because a private or team row is invisible to the signed-out server
 * (useSignedInRetry).
 */
import { notFound, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublicPost } from "@/hooks/usePublicBlog";
import type { BlogPost } from "@/types/blog";
import { fetchCollection } from "@/hooks/useCollections";
import type { CollectionWithOwner } from "@/types/collection";
import {
  ARTIFACT_DETAIL_ROUTE,
  ARTIFACT_PUBLIC_COLUMN,
  artifactDetailSelect,
  type ArtifactListTable,
} from "@/lib/artifactListColumns";
import { profileListQuery, type ProfileList } from "@/lib/profileLists";
import type { Prompt } from "@/types/prompt";
import type { Skill } from "@/types/skill";
import type { Workflow } from "@/types/workflow";
import type { PromptKit } from "@/types/promptKit";
import { isUuid } from "@/lib/uuidRoute";
import {
  caseInsensitiveNamePattern,
  pickNameIgnoringCase,
} from "@/lib/profileName";
import { collectPublicIndex, type PublicIndexEntry } from "@/lib/publicIndex";
import { ITEM_TYPE_OF_TABLE, type PublicCreatorLink } from "@/lib/creatorLink";
import { fetchPublicCreatorLink } from "@/hooks/useCreatorLink";

export interface LoadedArtefact {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  summary?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  /** Only ever an approved link on a public item; read here so it is in the first response. */
  creator_link?: PublicCreatorLink | null;
  [key: string]: unknown;
}

// Prompts and kits remember the slugs they were renamed away from. Anon may read
// a redirect row exactly when it may read the item, so a public item's old link
// is answered on the server and a private one's in the browser's second run.
const RENAMED_SLUGS: Partial<
  Record<
    ArtifactListTable,
    {
      table: "prompt_slug_redirects" | "prompt_kit_slug_redirects";
      idColumn: "prompt_id" | "prompt_kit_id";
    }
  >
> = {
  prompts: { table: "prompt_slug_redirects", idColumn: "prompt_id" },
  prompt_kits: {
    table: "prompt_kit_slug_redirects",
    idColumn: "prompt_kit_id",
  },
};

// The thrown error travels to the browser inside the router's page state, so
// it says only what failed; the database's own message goes to the log.
function queryFailed(what: string, message: string): Error {
  console.error(`[route-loaders] ${what} could not be read:`, message);
  return new Error(`${what} could not be read`);
}

/** The current slug of the row with this id, or null when it is not visible. */
async function currentSlug(
  table: ArtifactListTable,
  id: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from(table)
    .select("slug")
    .eq("id", id)
    .maybeSingle<{ slug: string | null }>();
  if (error) throw queryFailed(table, error.message);
  return data?.slug ?? null;
}

// Permanent, so a search engine replaces the old address in its index rather
// than keeping both.
function movedTo(table: ArtifactListTable, slug: string) {
  return redirect({
    to: ARTIFACT_DETAIL_ROUTE[table],
    params: { slug },
    statusCode: 301,
  });
}

async function loadBySlug(
  table: ArtifactListTable,
  slug: string,
): Promise<LoadedArtefact> {
  if (!slug) throw notFound();

  // A pre-slug UUID in the slug position is a legacy address, still indexed by
  // Google from before slugs existed.
  if (isUuid(slug)) {
    const canonical = await currentSlug(table, slug);
    if (canonical) throw movedTo(table, canonical);
    throw notFound();
  }

  const { data, error } = await supabase
    .from(table as never)
    .select(artifactDetailSelect(table))
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw queryFailed(table, error.message);
  if (data) {
    const row = { ...(data as Record<string, unknown>) };
    return {
      ...row,
      author: (row.profiles as LoadedArtefact["author"]) ?? null,
      creator_link: await fetchPublicCreatorLink(
        ITEM_TYPE_OF_TABLE[table],
        row.id as string,
      ),
    } as LoadedArtefact;
  }

  const renamed = RENAMED_SLUGS[table];
  if (renamed) {
    const { data: hit, error: redirectError } = await supabase
      .from(renamed.table as never)
      .select(renamed.idColumn)
      .eq("old_slug", slug)
      .maybeSingle<Record<string, string>>();
    if (redirectError) throw queryFailed(renamed.table, redirectError.message);
    const id = hit?.[renamed.idColumn];
    if (id) {
      const canonical = await currentSlug(table, id);
      if (canonical && canonical !== slug) throw movedTo(table, canonical);
    }
  }

  throw notFound();
}

export const loadPrompt = (slug: string) => loadBySlug("prompts", slug);
export const loadSkill = (slug: string) => loadBySlug("skills", slug);
export const loadWorkflow = (slug: string) => loadBySlug("workflows", slug);
export const loadPromptKit = (slug: string) => loadBySlug("prompt_kits", slug);

/**
 * The plain lists behind /prompts, /skills, /workflows and /prompt-kits.
 *
 * Until these existed no ordinary link led to any public artefact: the home page and
 * /discover fill their cards from the browser, so a crawler that does not run scripts
 * found the detail pages only through the sitemap. These loaders run on the server, and
 * the pages they feed are nothing but <a href> elements.
 *
 * Same anon client and the same "public" column per table as the sitemap, so the list
 * and the sitemap cannot disagree about what a logged-out visitor may open. Paged for
 * the same reason the sitemap is: PostgREST stops at 1000 rows without saying so.
 */
export type { PublicIndexEntry };

// The paging loop and its one retry on a transient failure live in
// publicIndex.ts, where the unit tests can reach them without this client.
function loadPublicIndex(
  table: "prompts" | "skills" | "workflows" | "prompt_kits",
): Promise<PublicIndexEntry[]> {
  return collectPublicIndex(table, (from, to) =>
    supabase
      .from(table)
      .select("slug, title, description")
      // The column differs per table, which .eq()'s per-table column type
      // cannot follow across a union of tables; .filter() takes it as text.
      .filter(ARTIFACT_PUBLIC_COLUMN[table], "eq", true)
      .order("title", { ascending: true })
      // Titles repeat. The key keeps a list longer than one page from showing
      // a tied row twice and another not at all (listOrder.ts).
      .order("id", { ascending: true })
      .range(from, to),
  );
}

export const loadPromptIndex = () => loadPublicIndex("prompts");
export const loadSkillIndex = () => loadPublicIndex("skills");
export const loadWorkflowIndex = () => loadPublicIndex("workflows");
export const loadPromptKitIndex = () => loadPublicIndex("prompt_kits");

export type LoadedBlogPost = BlogPost;

/**
 * The same fetch the page's query runs, author and taxonomy included, so the
 * row can seed that query and the server-rendered HTML shows the whole
 * article. A bare `select("*")` used to leave the page on its skeleton.
 */
export async function loadBlogPost(
  slug: string,
): Promise<LoadedBlogPost | null> {
  if (!slug) return null;
  try {
    return await fetchPublicPost(slug);
  } catch {
    return null;
  }
}

export interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
}

export interface ProfilePageData {
  profile: PublicProfile;
  /** The first page of each list, and how many public items it has in all. */
  prompts: ProfileList<Prompt>;
  skills: ProfileList<Skill>;
  workflows: ProfileList<Workflow>;
  promptKits: ProfileList<PromptKit>;
}

/** The row type of each profile list's table. */
export interface ProfileListRow {
  prompts: Prompt;
  skills: Skill;
  workflows: Workflow;
  prompt_kits: PromptKit;
}

/**
 * One page of a profile list, from `offset` on: the loader asks for the
 * first, the page's "Load more" for each next one.
 */
export async function loadProfileListPage<Table extends ArtifactListTable>(
  table: Table,
  authorId: string,
  offset = 0,
): Promise<ProfileList<ProfileListRow[Table]>> {
  // The union, not the generic: the client cannot follow a type parameter.
  const source: ArtifactListTable = table;
  const { data, error, count } = await profileListQuery(
    supabase.from(source),
    table,
    authorId,
    offset,
  );
  if (error) throw queryFailed(table, error.message);
  // The column lists are built at run time, so the client cannot type the
  // rows from them. Prompt also promises non-null slug, ratings, counts,
  // is_public and created_at, which the prompts table allows NULL on; widening
  // it is recorded as a migration risk (migration/migration-risks.md).
  const items = (data ?? []) as unknown as ProfileListRow[Table][];
  return { items, total: count ?? offset + items.length };
}

const PROFILE_COLUMNS =
  "id, display_name, avatar_url, bio, website, twitter, github";

/**
 * The profile a /u/<name> address names: the one whose display_name is
 * exactly `name`, else the one whose name differs from it only in letter case
 * (`exact: false`), else null. The rules, and what the database allows, are
 * in profileName.ts. A database error throws.
 */
export async function findProfileByName(
  name: string,
): Promise<{ profile: PublicProfile; exact: boolean } | null> {
  const { data: exact, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("display_name", name)
    .maybeSingle();
  if (error) throw queryFailed("profiles", error.message);
  if (exact) return { profile: exact, exact: true };

  // The unique index on lower(display_name) allows one row here; a few more
  // are asked for so that pickNameIgnoringCase, not the limit, decides.
  const { data: candidates, error: ciError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .ilike("display_name", caseInsensitiveNamePattern(name))
    // Anon may read only the page's own columns (not created_at), so the
    // fixed order is the id's.
    .order("id", { ascending: true })
    .limit(10);
  if (ciError) throw queryFailed("profiles", ciError.message);
  const rows = candidates ?? [];
  const stored = pickNameIgnoringCase(
    name,
    rows.map((row) => row.display_name),
  );
  if (stored === null) return null;
  const profile = rows.find((row) => row.display_name === stored);
  return profile ? { profile, exact: stored === name } : null;
}

/**
 * The public profile page, keyed off display_name: the profile and the first
 * page of its public artifacts of all four kinds, so the first response
 * already shows the person and their work. The page makes no fetch of its own
 * until a visitor asks for more. An address that spells an existing name in
 * other letter case is a 301 to the stored spelling (#25). No profile with
 * that name in any case is notFound()
 * (HTTP 404, the not-found page, noindex), like an unknown artefact slug; a
 * database error throws, so a creator never shows as missing or empty because
 * a query failed.
 */
export async function loadProfile(username: string): Promise<ProfilePageData> {
  if (!username) throw notFound();
  const found = await findProfileByName(username);
  if (!found) throw notFound();
  const profile = found.profile;
  // The address spells the name in other letter case: one indexable URL per
  // person, so send it on to the stored spelling (#25, profileName.ts).
  if (!found.exact && profile.display_name) {
    throw redirect({
      to: "/u/$username",
      params: { username: profile.display_name },
      statusCode: 301,
    });
  }

  const [prompts, skills, workflows, promptKits] = await Promise.all([
    loadProfileListPage("prompts", profile.id),
    loadProfileListPage("skills", profile.id),
    loadProfileListPage("workflows", profile.id),
    loadProfileListPage("prompt_kits", profile.id),
  ]);
  return { profile, prompts, skills, workflows, promptKits };
}

/**
 * A collection, by id. A malformed id or an id no visible collection has is
 * notFound() (HTTP 404, noindex): both used to answer 200 with a "Collection
 * not found" text. A private collection is invisible to the signed-out
 * server, so the browser asks again with the session (useSignedInRetry), as
 * for a private artefact. A database error throws.
 */
export async function loadCollection(id: string): Promise<CollectionWithOwner> {
  // collections.id is a uuid: anything else could only fail the query.
  if (!isUuid(id)) throw notFound();
  let collection: CollectionWithOwner | null;
  try {
    collection = await fetchCollection(id);
  } catch (err) {
    throw queryFailed(
      "collections",
      // A PostgREST error is a plain object with a message, not always an Error.
      (err as { message?: string } | null)?.message ?? String(err),
    );
  }
  if (!collection) throw notFound();
  return collection;
}

/** Blog taxonomy pages. Both key off slug and both are public. */
export async function loadBlogCategory(slug: string) {
  if (!slug) return null;
  const { data, error } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description")
    .eq("slug", slug)
    .maybeSingle();
  return error ? null : data;
}

export async function loadBlogTag(slug: string) {
  if (!slug) return null;
  const { data, error } = await supabase
    .from("blog_tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  return error ? null : data;
}
