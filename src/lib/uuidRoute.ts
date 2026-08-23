import { supabase } from "@/integrations/supabase/client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when a `:slug` route param is actually a legacy UUID id. */
export function isUuid(value: string | undefined): boolean {
  return !!value && UUID_RE.test(value);
}

/**
 * Legacy /<route>/<uuid> URLs are still indexed by Google from before slugs
 * existed. Detail pages look artifacts up by slug only, so those URLs render
 * the not-found branch and Google reports them as Soft 404. Resolve the id to
 * its current slug and redirect instead.
 *
 * Returns the canonical slug, or null when the artifact is gone / has no slug.
 */
export async function resolveSlugFromId(
  table: "prompts" | "skills" | "workflows" | "prompt_kits",
  id: string,
): Promise<string | null> {
  const { data } = await (supabase.from(table) as any)
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  return data?.slug ?? null;
}
