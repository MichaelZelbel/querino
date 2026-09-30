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
  return allTermsFilters(columns, query).reduce(
    (acc, filter) => acc.or(filter),
    builder,
  );
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

  // Search local/team artefacts.
  //
  // Each run can be overtaken: the next keystroke (after the debounce), a
  // workspace switch, or closing the palette. `cancelled` keeps an overtaken
  // run from writing its older results over the newer ones (an older search
  // that finished last used to win) and from putting results back into a
  // palette that had already been cleared. An overtaken run leaves the
  // spinner alone too, so the branch below that clears the box clears it.
  useEffect(() => {
    if (!user || !debouncedQuery.trim()) {
      setArtefacts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const searchArtefacts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // "Mine, or one of my teams'". With no teams this drops the team
        // clause rather than emitting team_id.in.(), which is a syntax error
        // that used to fail the whole query silently (finding M3).
        const scope = ownedByUserOrTeams(
          "author_id",
          user.id,
          "team_id",
          teams.map((t) => t.id),
        );

        const scoped = <
          T extends {
            or(filters: string): T;
            eq(column: string, value: string): T;
            is(column: string, value: null): T;
          },
        >(
          builder: T,
        ): T => {
          const matching = withAllTerms(
            builder,
            SEARCH_COLUMNS,
            debouncedQuery,
          );
          return currentWorkspace === "personal"
            ? matching.eq("author_id", user.id).is("team_id", null)
            : matching.or(scope);
        };

        // The four tables are independent, so they are asked at once rather
        // than one after another: four round trips in a row outlasted the
        // 200 ms debounce on every search.
        const [prompts, skills, workflows, kits] = await Promise.all([
          scoped(
            supabase
              .from("prompts")
              .select("id, title, description, is_public, team_id")
              .limit(10),
          ),
          scoped(
            supabase
              .from("skills")
              .select("id, title, description, published, team_id")
              .limit(10),
          ),
          scoped(
            supabase
              .from("workflows")
              .select("id, title, description, published, team_id")
              .limit(10),
          ),
          scoped(
            // Prompt kit routes use the slug, so it is exposed as the id.
            supabase
              .from("prompt_kits")
              .select("id, slug, title, description, published, team_id")
              .limit(10),
          ),
        ]);
        if (cancelled) return;

        const failed = [prompts, skills, workflows, kits].find((r) => r.error);
        if (failed?.error) throw failed.error;

        const teamName = (teamId: string | null) =>
          teams.find((t) => t.id === teamId)?.name;
        const results: SearchResult[] = [
          ...(prompts.data ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            type: "prompt" as const,
            description: p.description,
            isPublic: p.is_public,
            teamId: p.team_id,
            teamName: teamName(p.team_id),
          })),
          ...(skills.data ?? []).map((s) => ({
            id: s.id,
            title: s.title,
            type: "skill" as const,
            description: s.description,
            isPublic: s.published,
            teamId: s.team_id,
            teamName: teamName(s.team_id),
          })),
          ...(workflows.data ?? []).map((w) => ({
            id: w.id,
            title: w.title,
            type: "workflow" as const,
            description: w.description,
            isPublic: w.published,
            teamId: w.team_id,
            teamName: teamName(w.team_id),
          })),
          ...(kits.data ?? []).map((k) => ({
            id: k.slug || k.id,
            title: k.title,
            type: "prompt_kit" as const,
            description: k.description,
            isPublic: k.published,
            teamId: k.team_id,
            teamName: teamName(k.team_id),
          })),
        ];

        setArtefacts(results.slice(0, 12));
      } catch (err) {
        if (cancelled) return;
        // Never swallow this. An empty list and a failed query look identical
        // to the user, and telling them apart is the whole of finding M2.
        console.error("Command palette search error:", err);
        setArtefacts([]);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    searchArtefacts();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, user, currentWorkspace, teams]);

  // Search public prompts (fallback when no local results)
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPublicPrompts([]);
      return;
    }

    let cancelled = false;

    const searchPublic = async () => {
      try {
        const publicQuery = withAllTerms(
          supabase
            .from("prompts")
            .select("id, title, description")
            .eq("is_public", true),
          SEARCH_COLUMNS,
          debouncedQuery,
        );
        const { data, error: publicError } = await publicQuery
          .order("rating_avg", { ascending: false })
          .limit(8);
        if (cancelled) return;
        if (publicError) throw publicError;

        setPublicPrompts(
          (data || []).map((p) => ({
            id: p.id,
            title: p.title,
            type: "prompt" as ArtefactType,
            description: p.description,
            isPublic: true,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Public search error:", err);
        setPublicPrompts([]);
      }
    };

    searchPublic();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return {
    artefacts,
    publicPrompts,
    isLoading,
    error,
    hasQuery: debouncedQuery.trim().length > 0,
  };
}
