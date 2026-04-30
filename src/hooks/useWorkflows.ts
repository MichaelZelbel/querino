import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Workflow, WorkflowAuthor } from "@/types/workflow";
import { mergeWithSemantic } from "./useSemanticMerge";

async function fetchWorkflowsByIds(ids: string[]): Promise<(Workflow & { author?: WorkflowAuthor | null })[]> {
  if (ids.length === 0) return [];
  const { data, error } = await (supabase.from("workflows") as any)
    .select(`*, profiles:author_id (id, display_name, avatar_url)`)
    .in("id", ids);
  if (error || !data) return [];
  return (data as any[]).map((item) => ({ ...item, author: item.profiles || null }));
}

interface UseWorkflowsOptions {
  searchQuery?: string;
  published?: boolean;
  authorId?: string;
  teamId?: string;
}

export function useWorkflows(options: UseWorkflowsOptions = {}) {
  const { searchQuery = "", published, authorId, teamId } = options;

  return useQuery({
    queryKey: ["workflows", searchQuery, published, authorId, teamId],
    queryFn: async () => {
      let query = (supabase
        .from("workflows") as any)
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (published !== undefined) {
        query = query.eq("published", published);
      }

      if (teamId) {
        query = query.eq("team_id", teamId);
      } else if (authorId) {
        query = query.eq("author_id", authorId).is("team_id", null);
      }

      if (searchQuery.trim()) {
        query = query.textSearch(
          "title,description,content",
          searchQuery.trim(),
          { type: "websearch", config: "simple" }
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const ftsResults = (data || []).map((item: any) => ({
        ...item,
        author: item.profiles || null,
      })) as (Workflow & { author?: WorkflowAuthor | null })[];

      if (published === true && searchQuery.trim().length >= 3) {
        return await mergeWithSemantic(
          "workflow",
          searchQuery.trim(),
          ftsResults,
          fetchWorkflowsByIds,
        );
      }

      return ftsResults;
    },
  });
}
