import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useDebounce } from "@/hooks/useDebounce";

export type ArtefactType = "prompt" | "skill" | "workflow";

export interface SearchResult {
  id: string;
  title: string;
  type: ArtefactType;
  description?: string | null;
  isPublic?: boolean;
  teamId?: string | null;
  teamName?: string | null;
}

export function useCommandPaletteSearch(query: string) {
  const [artefacts, setArtefacts] = useState<SearchResult[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 200);
  const { user } = useAuthContext();
  const { currentWorkspace, currentTeam, teams } = useWorkspace();

  // Search local/team artefacts
  useEffect(() => {
    if (!user || !debouncedQuery.trim()) {
      setArtefacts([]);
      return;
    }

    const searchArtefacts = async () => {
      setIsLoading(true);
      const results: SearchResult[] = [];
      const searchTerm = `%${debouncedQuery}%`;

      try {
        // Build team IDs to search
        const teamIds = teams.map(t => t.id);

        // Search prompts
        let promptQuery = supabase
          .from("prompts")
          .select("id, title, short_description, is_public, team_id")
          .or(`title.ilike.${searchTerm},short_description.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .limit(10);

        if (currentWorkspace === "personal") {
          promptQuery = promptQuery.eq("author_id", user.id).is("team_id", null);
        } else {
          promptQuery = promptQuery.or(`author_id.eq.${user.id},team_id.in.(${teamIds.join(",")})`);
        }

        const { data: prompts } = await promptQuery;
        prompts?.forEach((p) => {
          results.push({
            id: p.id,
            title: p.title,
            type: "prompt",
            description: p.short_description,
            isPublic: p.is_public,
            teamId: p.team_id,
            teamName: teams.find(t => t.id === p.team_id)?.name,
          });
        });

        // Search skills
        let skillQuery = supabase
          .from("skills")
          .select("id, title, description, published, team_id")
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .limit(10);

        if (currentWorkspace === "personal") {
          skillQuery = skillQuery.eq("author_id", user.id).is("team_id", null);
        } else {
          skillQuery = skillQuery.or(`author_id.eq.${user.id},team_id.in.(${teamIds.join(",")})`);
        }

        const { data: skills } = await skillQuery;
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
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10);

        if (currentWorkspace === "personal") {
          workflowQuery = workflowQuery.eq("author_id", user.id).is("team_id", null);
        } else {
          workflowQuery = workflowQuery.or(`author_id.eq.${user.id},team_id.in.(${teamIds.join(",")})`);
        }

        const { data: workflows } = await workflowQuery;
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

        setArtefacts(results.slice(0, 10));
      } catch (error) {
        console.error("Command palette search error:", error);
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
      const searchTerm = `%${debouncedQuery}%`;

      try {
        const { data } = await supabase
          .from("prompts")
          .select("id, title, short_description")
          .eq("is_public", true)
          .or(`title.ilike.${searchTerm},short_description.ilike.${searchTerm}`)
          .order("rating_avg", { ascending: false })
          .limit(8);

        setPublicPrompts(
          (data || []).map((p) => ({
            id: p.id,
            title: p.title,
            type: "prompt" as ArtefactType,
            description: p.short_description,
            isPublic: true,
          }))
        );
      } catch (error) {
        console.error("Public search error:", error);
      }
    };

    searchPublic();
  }, [debouncedQuery]);

  return {
    artefacts,
    publicPrompts,
    isLoading,
    hasQuery: debouncedQuery.trim().length > 0,
  };
}
