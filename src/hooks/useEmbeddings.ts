import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EmbeddingItemType = "prompt" | "skill" | "workflow";

interface UseEmbeddingsReturn {
  generateEmbedding: (text: string, itemType?: EmbeddingItemType, itemId?: string) => Promise<number[] | null>;
  updateEmbedding: (itemType: EmbeddingItemType, itemId: string, embedding: number[]) => Promise<boolean>;
  refreshEmbedding: (itemType: EmbeddingItemType, itemId: string, text: string) => Promise<boolean>;
  isGenerating: boolean;
}

export function useEmbeddings(): UseEmbeddingsReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateEmbedding = async (
    text: string,
    itemType?: EmbeddingItemType,
    itemId?: string
  ): Promise<number[] | null> => {
    const url = import.meta.env.VITE_EMBEDDING_URL;
    
    if (!url) {
      console.warn("VITE_EMBEDDING_URL is not configured, skipping embedding generation");
      return null;
    }

    try {
      const payload: Record<string, string> = {
        text: text.slice(0, 8000), // Limit text length
      };
      
      // Include itemType and itemId if provided (for artefact embeddings)
      if (itemType) payload.itemType = itemType;
      if (itemId) payload.itemId = itemId;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Embedding API error:", response.status, errorText);
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      const embedding = data?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Invalid embedding response from backend");
      }

      console.log(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
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
      const embedding = await generateEmbedding(text, itemType, itemId);
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
