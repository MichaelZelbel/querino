import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EmbeddingItemType = "prompt" | "skill" | "workflow" | "claw";

interface UseEmbeddingsReturn {
  generateEmbedding: (
    text: string,
    itemType?: EmbeddingItemType,
    itemId?: string
  ) => Promise<number[] | null>;
  updateEmbedding: (
    itemType: EmbeddingItemType,
    itemId: string,
    embedding: number[]
  ) => Promise<boolean>;
  refreshEmbedding: (
    itemType: EmbeddingItemType,
    itemId: string,
    text: string
  ) => Promise<boolean>;
  isGenerating: boolean;
}

/**
 * Calls the `generate-embedding` edge function (replaces the old n8n webhook).
 * When itemType + itemId are provided, the edge function writes the embedding
 * into the matching artefact table directly via the `update_embedding` RPC.
 */
export function useEmbeddings(): UseEmbeddingsReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateEmbedding = async (
    text: string,
    itemType?: EmbeddingItemType,
    itemId?: string
  ): Promise<number[] | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-embedding", {
        body: {
          text: text.slice(0, 8000),
          itemType,
          itemId,
        },
      });

      if (error) {
        console.error("generate-embedding error:", error);
        throw new Error(error.message || "Embedding function error");
      }

      const embedding = (data as { embedding?: number[] } | null)?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Invalid embedding response");
      }

      return embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  };

  /**
   * Manual fallback: write a precomputed embedding via the RPC.
   * Most callers should NOT need this — `generateEmbedding(text, itemType, itemId)`
   * already persists for them.
   */
  const updateEmbedding = async (
    itemType: EmbeddingItemType,
    itemId: string,
    embedding: number[]
  ): Promise<boolean> => {
    try {
      const embeddingStr = `[${embedding.join(",")}]`;
      const { error } = await supabase.rpc("update_embedding", {
        p_item_type: itemType,
        p_item_id: itemId,
        p_embedding: embeddingStr,
      });
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      console.error("Failed to update embedding:", error);
      throw error;
    }
  };

  const refreshEmbedding = async (
    itemType: EmbeddingItemType,
    itemId: string,
    text: string
  ): Promise<boolean> => {
    setIsGenerating(true);
    try {
      // Edge function persists for us when itemType + itemId are provided.
      const embedding = await generateEmbedding(text, itemType, itemId);
      if (!embedding) {
        throw new Error("Failed to generate embedding");
      }
      toast.success("Embedding refreshed successfully");
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to refresh embedding";
      toast.error(message);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateEmbedding,
    updateEmbedding,
    refreshEmbedding,
    isGenerating,
  };
}
