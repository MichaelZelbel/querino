import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useClonePrompt() {
  const navigate = useNavigate();
  const [cloning, setCloning] = useState(false);

  const clonePrompt = async (
    sourcePrompt: {
      id: string;
      title: string;
      description: string;
      content: string;
      category: string;
      tags?: string[] | null;
    },
    userId: string
  ) => {
    setCloning(true);

    try {
      const { data, error } = await supabase
        .from("prompts")
        .insert({
          title: `Copy of ${sourcePrompt.title}`,
          description: sourcePrompt.description,
          content: sourcePrompt.content,
          category: sourcePrompt.category,
          tags: sourcePrompt.tags || [],
          author_id: userId,
          is_public: false,
          rating_avg: 0,
          rating_count: 0,
          copies_count: 0,
        })
        .select("id, slug")
        .single();

      if (error) {
        console.error("Error cloning prompt:", error);
        toast.error("Failed to clone prompt");
        return null;
      }

      console.log("Prompt cloned", { sourceId: sourcePrompt.id, newId: data.id });
      toast.success("Prompt cloned to your library!");
      navigate(`/library/${data.slug}/edit`);
      return data.id;
    } catch (err) {
      console.error("Error cloning prompt:", err);
      toast.error("Failed to clone prompt");
      return null;
    } finally {
      setCloning(false);
    }
  };

  return { clonePrompt, cloning };
}
