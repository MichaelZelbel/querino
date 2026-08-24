import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useDebounce } from "@/hooks/useDebounce";
import { allTermsFilters, ownedByUserOrTeams } from "@/lib/postgrestFilter";

export type ArtefactType = "prompt" | "skill" | "workflow" | "prompt_kit";

// All four tables keep their text in the same three columns, and someone
// typing into the palette does not know which one holds the word they
// remember. The MCP server searches exactly these, so the box and the agent
// answer the same question.
const SEARCH_COLUMNS = ["title", "description", "content"] as const;

/**
 * "Every word appears somewhere in these columns."
 *
 * Each word becomes its own `or(...)`, and PostgREST ANDs repeated parameters,
 * so a two-word search no longer requires the two words to sit side by side in
 * one column. That requirement is what made multi-word searches come back
 * empty; see the note in supabase/functions/_shared/postgrestFilter.ts.
 */
function withAllTerms<T extends { or(filters: string): T }>(
  builder: T,
  columns: readonly string[],
  query: string,
): T {
  return allTermsFilters(columns, query).reduce((acc, filter) => acc.or(filter), builder);
}

export interface SearchResult {
  id: string;
  title: string;
  type: ArtefactType;
  description?: string | null;
  isPublic?: boolean | null;
  teamId?: string | null;
  teamName?: string | null;
}

export function useCommandPaletteSearch(query: string) {
  const [artefacts, setArtefacts] = useState<SearchResult[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 200);
  const { user } = useAuthContext();
  const { currentWorkspace, currentTeam, teams } = useWorkspace();

  // Search local/team artefacts
  useEffect(() => {
    if (!user || !debouncedQuery.trim()) {
      setArtefacts([]);
      setError(null);
      return;
    }

    const searchArtefacts = async () => {
      setIsLoading(true);
      setError(null);
      const results: SearchResult[] = [];

      try {
        // Build team IDs to search
        const teamIds = teams.map(t => t.id);

        // "Mine, or one of my teams'". With no teams this drops the team
        // clause rather than emitting team_id.in.(), which is a syntax error
        // that used to fail the whole query silently (finding M3).
        const scope = ownedByUserOrTeams("author_id", user.id, "team_id", teamIds);

        // Search prompts
        let promptQuery = supabase
          .from("prompts")
          .select("id, title, description, is_public, team_id")
          .limit(10);
        promptQuery = withAllTerms(promptQuery, SEARCH_COLUMNS, debouncedQuery);

        if (currentWorkspace === "personal") {
          promptQuery = promptQuery.eq("author_id", user.id).is("team_id", null);
        } else {
          promptQuery = promptQuery.or(scope);
        }

        const { data: prompts, error: promptError } = await promptQuery;
        if (promptError) throw promptError;
        prompts?.forEach((p) => {
          results.push({
            id: p.id,
            title: p.title,
            type: "prompt",
            description: p.description,
            isPublic: p.is_public,
            teamId: p.team_id,
            teamName: teams.find(t => t.id === p.team_id)?.name,
          });
        });

        // Search skills
        let skillQuery = supabase
          .from("skills")
          .select("id, title, description, published, team_id")
          .limit(10);
        skillQuery = withAllTerms(skillQuery, SEARCH_COLUMNS, debouncedQuery);

        if (currentWorkspace === "personal") {
          skillQuery = skillQuery.eq("author_id", user.id).is("team_id", null);
        } else {
          skillQuery = skillQuery.or(scope);
        }

        const { data: skills, error: skillError } = await skillQuery;
        if (skillError) throw skillError;
        skills?.forEach((s) => {
          results.push({
            id: s.id,
            title: s.title,
            type: "skill",
            description: s.description,
            isPublic: s.published,
            teamId: s.team_id,
            teamName: teams.find(t => t.id === s.team_id)?.name,
          });
        });

        // Search workflows
        let workflowQuery = supabase
          .from("workflows")
          .select("id, title, description, published, team_id")
          .limit(10);
        workflowQuery = withAllTerms(workflowQuery, SEARCH_COLUMNS, debouncedQuery);

        if (currentWorkspace === "personal") {
          workflowQuery = workflowQuery.eq("author_id", user.id).is("team_id", null);
        } else {
          workflowQuery = workflowQuery.or(scope);
        }

        const { data: workflows, error: workflowError } = await workflowQuery;
        if (workflowError) throw workflowError;
        workflows?.forEach((w) => {
          results.push({
            id: w.id,
            title: w.title,
            type: "workflow",
            description: w.description,
            isPublic: w.published,
            teamId: w.team_id,
            teamName: teams.find(t => t.id === w.team_id)?.name,
          });
        });

        // Search prompt kits (route uses slug, so we expose slug as id)
        let kitQuery = (supabase.from("prompt_kits") as any)
          .select("id, slug, title, description, published, team_id")
          .limit(10);
        kitQuery = withAllTerms(kitQuery, SEARCH_COLUMNS, debouncedQuery);

        if (currentWorkspace === "personal") {
          kitQuery = kitQuery.eq("author_id", user.id).is("team_id", null);
        } else {
          kitQuery = kitQuery.or(scope);
        }

        const { data: kits, error: kitError } = await kitQuery;
        if (kitError) throw kitError;
        (kits as any[] | null)?.forEach((k) => {
          results.push({
            id: k.slug || k.id,
            title: k.title,
            type: "prompt_kit",
            description: k.description,
            isPublic: k.published,
            teamId: k.team_id,
            teamName: teams.find(t => t.id === k.team_id)?.name,
          });
        });

        setArtefacts(results.slice(0, 12));
      } catch (err) {
        // Never swallow this. An empty list and a failed query look identical
        // to the user, and telling them apart is the whole of finding M2.
        console.error("Command palette search error:", err);
        setArtefacts([]);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    };

    searchArtefacts();
  }, [debouncedQuery, user, currentWorkspace, teams]);

  // Search public prompts (fallback when no local results)
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPublicPrompts([]);
      return;
    }

    const searchPublic = async () => {
      try {
        const publicQuery = withAllTerms(
          supabase.from("prompts").select("id, title, description").eq("is_public", true),
          SEARCH_COLUMNS,
          debouncedQuery,
        );
        const { data, error: publicError } = await publicQuery
          .order("rating_avg", { ascending: false })
          .limit(8);
        if (publicError) throw publicError;

        setPublicPrompts(
          (data || []).map((p) => ({
            id: p.id,
            title: p.title,
            type: "prompt" as ArtefactType,
            description: p.description,
            isPublic: true,
          }))
        );
      } catch (err) {
        console.error("Public search error:", err);
        setPublicPrompts([]);
      }
    };

    searchPublic();
  }, [debouncedQuery]);

  return {
    artefacts,
    publicPrompts,
    isLoading,
    error,
    hasQuery: debouncedQuery.trim().length > 0,
  };
}
