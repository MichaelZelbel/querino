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
  author?: { id: string; display_name: string | null; avatar_url: string | null } | null;
  [key: string]: unknown;
}

// A pre-slug UUID in the slug position is a legacy URL. The components already redirect
// those; the loader simply declines to guess, so the component's redirect still runs.
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function loadBySlug(table: string, slug: string): Promise<LoadedArtefact | null> {
  if (!slug || isUuid(slug)) return null;
  const { data, error } = await supabase
    .from(table as never)
    .select(`*, ${AUTHOR}`)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return { ...row, author: (row.profiles as LoadedArtefact["author"]) ?? null } as LoadedArtefact;
}

export const loadPrompt = (slug: string) => loadBySlug("prompts", slug);
export const loadSkill = (slug: string) => loadBySlug("skills", slug);
export const loadWorkflow = (slug: string) => loadBySlug("workflows", slug);
export const loadPromptKit = (slug: string) => loadBySlug("prompt_kits", slug);

export interface LoadedBlogPost extends LoadedArtefact {
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
}

export async function loadBlogPost(slug: string): Promise<LoadedBlogPost | null> {
  if (!slug) return null;
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as LoadedBlogPost;
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
