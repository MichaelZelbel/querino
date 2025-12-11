import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmbeddings } from "./useEmbeddings";
import { useState, useCallback } from "react";
import type { Prompt, PromptAuthor } from "@/types/prompt";
import type { Skill } from "@/types/skill";
import type { Workflow } from "@/types/workflow";

export interface SemanticPromptResult extends Prompt {
  similarity: number;
  author?: PromptAuthor | null;
}

export interface SemanticSkillResult {
  id: string;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
  author_id: string | null;
  published: boolean | null;
  created_at: string | null;
  similarity: number;
}

export interface SemanticWorkflowResult {
  id: string;
  title: string;
  description: string | null;
  json: any;
  tags: string[] | null;
  author_id: string | null;
  published: boolean | null;
  created_at: string | null;
  similarity: number;
}

interface UseSemanticSearchOptions {
  searchQuery: string;
  enabled?: boolean;
  matchThreshold?: number;
  matchCount?: number;
}

export function useSemanticSearchPrompts({
  searchQuery,
  enabled = true,
  matchThreshold = 0.3,
  matchCount = 50,
}: UseSemanticSearchOptions) {
  const { generateEmbedding } = useEmbeddings();
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);

  const shouldSearch = enabled && searchQuery.trim().length >= 2;

  // Generate embedding for search query
  const embeddingQuery = useQuery({
    queryKey: ["embedding", "query", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const embedding = await generateEmbedding(searchQuery);
      setQueryEmbedding(embedding);
      return embedding;
    },
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Perform semantic search
  const searchResults = useQuery({
    queryKey: ["semantic-search", "prompts", searchQuery, matchThreshold, matchCount],
    queryFn: async (): Promise<SemanticPromptResult[]> => {
      if (!queryEmbedding) return [];

      const embeddingStr = `[${queryEmbedding.join(",")}]`;
      
      const { data, error } = await supabase.rpc("search_prompts_semantic", {
        query_embedding: embeddingStr,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        console.error("Semantic search error:", error);
        throw new Error(error.message);
      }

      // Fetch author profiles for results
      const authorIds = [...new Set((data || []).map((p: any) => p.author_id).filter(Boolean))];
      let profilesMap: Record<string, PromptAuthor> = {};
      
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", authorIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, PromptAuthor>);
        }
      }

      return (data || []).map((item: any) => ({
        ...item,
        author: item.author_id ? profilesMap[item.author_id] : null,
      }));
    },
    enabled: shouldSearch && !!queryEmbedding,
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  return {
    data: searchResults.data,
    isLoading: embeddingQuery.isLoading || searchResults.isLoading,
    error: embeddingQuery.error || searchResults.error,
    isEmbeddingLoading: embeddingQuery.isLoading,
  };
}

export function useSemanticSearchSkills({
  searchQuery,
  enabled = true,
  matchThreshold = 0.3,
  matchCount = 50,
}: UseSemanticSearchOptions) {
  const { generateEmbedding } = useEmbeddings();
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);

  const shouldSearch = enabled && searchQuery.trim().length >= 2;

  const embeddingQuery = useQuery({
    queryKey: ["embedding", "query", "skills", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const embedding = await generateEmbedding(searchQuery);
      setQueryEmbedding(embedding);
      return embedding;
    },
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5,
  });

  const searchResults = useQuery({
    queryKey: ["semantic-search", "skills", searchQuery, matchThreshold, matchCount],
    queryFn: async (): Promise<SemanticSkillResult[]> => {
      if (!queryEmbedding) return [];

      const embeddingStr = `[${queryEmbedding.join(",")}]`;
      
      const { data, error } = await supabase.rpc("search_skills_semantic", {
        query_embedding: embeddingStr,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        console.error("Semantic search error:", error);
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: shouldSearch && !!queryEmbedding,
    staleTime: 1000 * 60,
  });

  return {
    data: searchResults.data,
    isLoading: embeddingQuery.isLoading || searchResults.isLoading,
    error: embeddingQuery.error || searchResults.error,
  };
}

export function useSemanticSearchWorkflows({
  searchQuery,
  enabled = true,
  matchThreshold = 0.3,
  matchCount = 50,
}: UseSemanticSearchOptions) {
  const { generateEmbedding } = useEmbeddings();
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);

  const shouldSearch = enabled && searchQuery.trim().length >= 2;

  const embeddingQuery = useQuery({
    queryKey: ["embedding", "query", "workflows", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const embedding = await generateEmbedding(searchQuery);
      setQueryEmbedding(embedding);
      return embedding;
    },
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5,
  });

  const searchResults = useQuery({
    queryKey: ["semantic-search", "workflows", searchQuery, matchThreshold, matchCount],
    queryFn: async (): Promise<SemanticWorkflowResult[]> => {
      if (!queryEmbedding) return [];

      const embeddingStr = `[${queryEmbedding.join(",")}]`;
      
      const { data, error } = await supabase.rpc("search_workflows_semantic", {
        query_embedding: embeddingStr,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        console.error("Semantic search error:", error);
        throw new Error(error.message);
      }

      // Map workflow_json back to json
      return (data || []).map((item: any) => ({
        ...item,
        json: item.workflow_json,
      }));
    },
    enabled: shouldSearch && !!queryEmbedding,
    staleTime: 1000 * 60,
  });

  return {
    data: searchResults.data,
    isLoading: embeddingQuery.isLoading || searchResults.isLoading,
    error: embeddingQuery.error || searchResults.error,
  };
}
