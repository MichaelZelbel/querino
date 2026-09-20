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
 * Every loader returns null rather than throwing when the record is missing. The page
 * components already render their own "not found" state, and a thrown loader error would
 * replace that with the router's error boundary, which is a behaviour change.
 */
import { supabase } from "@/integrations/supabase/client";
import { fetchPublicPost } from "@/hooks/usePublicBlog";
import type { BlogPost } from "@/types/blog";

const AUTHOR = "profiles:author_id ( id, display_name, avatar_url )";

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
  [key: string]: unknown;
}

// A pre-slug UUID in the slug position is a legacy URL. The components already redirect
// those; the loader simply declines to guess, so the component's redirect still runs.
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const SEARCH_INTERNALS = [
  "embedding",
  "embedding_attempts",
  "embedding_error",
  "embedding_failed_at",
  "fts",
] as const;

async function loadBySlug(
  table: string,
  slug: string,
): Promise<LoadedArtefact | null> {
  if (!slug || isUuid(slug)) return null;
  const { data, error } = await supabase
    .from(table as never)
    .select(`*, ${AUTHOR}`)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const row = { ...(data as Record<string, unknown>) };
  // Whatever a loader returns is written into the HTML as the router's page data.
  // The search internals are 1,536 floats and a word index: most of the 37 KB an
  // artefact page weighed, read by nobody. The page's own fetch still gets the whole
  // row after hydration, so nothing that renders depends on these.
  for (const column of SEARCH_INTERNALS) delete row[column];
  return {
    ...row,
    author: (row.profiles as LoadedArtefact["author"]) ?? null,
  } as LoadedArtefact;
}

export const loadPrompt = (slug: string) => loadBySlug("prompts", slug);
export const loadSkill = (slug: string) => loadBySlug("skills", slug);
export const loadWorkflow = (slug: string) => loadBySlug("workflows", slug);
export const loadPromptKit = (slug: string) => loadBySlug("prompt_kits", slug);

/**
 * The plain lists behind /prompts, /skills and /workflows.
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
export interface PublicIndexEntry {
  slug: string;
  title: string;
  description: string | null;
}

const INDEX_PAGE = 1000;

async function loadPublicIndex(
  table: "prompts" | "skills" | "workflows",
  publicColumn: "is_public" | "published",
): Promise<PublicIndexEntry[]> {
  const entries: PublicIndexEntry[] = [];
  for (let from = 0; ; from += INDEX_PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("slug, title, description")
      .eq(publicColumn, true as never)
      .order("title", { ascending: true })
      .range(from, from + INDEX_PAGE - 1);
    // A thrown error reaches the router's error boundary and answers 500, which a
    // crawler retries. A short list would be taken at its word.
    if (error)
      throw new Error(`Index query for ${table} failed: ${error.message}`);
    const page = (data ?? []) as Array<{
      slug: string | null;
      title: string | null;
      description: string | null;
    }>;
    for (const row of page) {
      if (!row.slug || !row.title) continue;
      entries.push({
        slug: row.slug,
        title: row.title,
        description: row.description,
      });
    }
    if (page.length < INDEX_PAGE) break;
  }
  return entries;
}

export const loadPromptIndex = () => loadPublicIndex("prompts", "is_public");
export const loadSkillIndex = () => loadPublicIndex("skills", "published");
export const loadWorkflowIndex = () =>
  loadPublicIndex("workflows", "published");

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

/** The public profile page keys off display_name, the way UserProfile does. */
export async function loadProfile(username: string) {
  if (!username) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, website, twitter, github")
    .eq("display_name", username)
    .maybeSingle();
  if (error || !data) return null;
  return data;
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
