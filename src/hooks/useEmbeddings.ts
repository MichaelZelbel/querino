import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EmbeddingItemType = "prompt" | "skill" | "workflow";

interface UseEmbeddingsReturn {
  generateEmbedding: (text: string) => Promise<number[] | null>;
  updateEmbedding: (itemType: EmbeddingItemType, itemId: string, embedding: number[]) => Promise<boolean>;
  refreshEmbedding: (itemType: EmbeddingItemType, itemId: string, text: string) => Promise<boolean>;
  isGenerating: boolean;
}

export function useEmbeddings(): UseEmbeddingsReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateEmbedding = async (text: string): Promise<number[] | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-embedding", {
        body: { text },
      });

      if (error) {
        console.error("Error generating embedding:", error);
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.embedding || null;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  };

  const updateEmbedding = async (
    itemType: EmbeddingItemType,
    itemId: string,
    embedding: number[]
  ): Promise<boolean> => {
    try {
      // Convert array to PostgreSQL vector format
      const embeddingStr = `[${embedding.join(",")}]`;
      
      const { error } = await supabase.rpc("update_embedding", {
        p_item_type: itemType,
        p_item_id: itemId,
        p_embedding: embeddingStr,
      });

      if (error) {
        console.error("Error updating embedding:", error);
        throw new Error(error.message);
      }

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
      const embedding = await generateEmbedding(text);
      if (!embedding) {
        throw new Error("Failed to generate embedding");
      }

      await updateEmbedding(itemType, itemId, embedding);
      toast.success("Embedding refreshed successfully");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh embedding";
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
