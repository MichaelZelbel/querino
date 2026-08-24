import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SimilarArtefactType = "prompt" | "skill" | "workflow";

export interface SimilarPrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  rating_avg: number;
  rating_count: number;
  copies_count: number;
  author_id: string | null;
  team_id: string | null;
  tags: string[];
  similarity: number;
}

export interface SimilarSkill {
  id: string;
  title: string;
  description: string | null;
  author_id: string | null;
  team_id: string | null;
  tags: string[];
  similarity: number;
}

export interface SimilarWorkflow {
  id: string;
  title: string;
  description: string | null;
  author_id: string | null;
  team_id: string | null;
  tags: string[];
  similarity: number;
}

export function useSimilarPrompts(promptId: string | undefined, limit = 6) {
  const [items, setItems] = useState<SimilarPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!promptId) {
      setLoading(false);
      return;
    }

    // Captured after the guard: the async function below closes over the
    // parameter, so the narrowing above does not reach inside it.
    const targetId = promptId;

    async function fetchSimilar() {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_similar_prompts", {
          target_id: targetId,
          match_limit: limit,
        });

        if (error) {
          console.error("Error fetching similar prompts:", error);
          setItems([]);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch similar prompts:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [promptId, limit]);

  return { items, loading };
}

export function useSimilarSkills(skillId: string | undefined, limit = 6) {
  const [items, setItems] = useState<SimilarSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!skillId) {
      setLoading(false);
      return;
    }

    // Captured after the guard: the async function below closes over the
    // parameter, so the narrowing above does not reach inside it.
    const targetId = skillId;

    async function fetchSimilar() {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_similar_skills", {
          target_id: targetId,
          match_limit: limit,
        });

        if (error) {
          console.error("Error fetching similar skills:", error);
          setItems([]);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch similar skills:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [skillId, limit]);

  return { items, loading };
}

export function useSimilarWorkflows(workflowId: string | undefined, limit = 6) {
  const [items, setItems] = useState<SimilarWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workflowId) {
      setLoading(false);
      return;
    }

    // Captured after the guard: the async function below closes over the
    // parameter, so the narrowing above does not reach inside it.
    const targetId = workflowId;

    async function fetchSimilar() {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_similar_workflows", {
          target_id: targetId,
          match_limit: limit,
        });

        if (error) {
          console.error("Error fetching similar workflows:", error);
          setItems([]);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch similar workflows:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [workflowId, limit]);

  return { items, loading };
}
