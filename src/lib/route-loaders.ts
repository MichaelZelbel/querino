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
import {
  artifactDetailSelect,
  type ArtifactListTable,
} from "@/lib/artifactListColumns";
import { isUuid } from "@/lib/uuidRoute";

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

// The detail route of each table, which an old address is sent on to.
const DETAIL_ROUTE = {
  prompts: "/prompts/$slug",
  skills: "/skills/$slug",
  workflows: "/workflows/$slug",
  prompt_kits: "/prompt-kits/$slug",
} as const satisfies Record<ArtifactListTable, string>;

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
    to: DETAIL_ROUTE[table],
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
      // The column differs per table, which .eq()'s per-table column type
      // cannot follow across a union of tables; .filter() takes it as text.
      .filter(publicColumn, "eq", true)
      .order("title", { ascending: true })
      // Titles repeat. The key keeps a list longer than one page from showing
      // a tied row twice and another not at all (listOrder.ts).
      .order("id", { ascending: true })
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
