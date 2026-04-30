import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useClonePromptKit() {
  const navigate = useNavigate();
  const [cloning, setCloning] = useState(false);

  const cloneKit = async (
    source: {
      id: string;
      title: string;
      description: string | null;
      content: string;
      category: string | null;
      tags?: string[] | null;
    },
    userId: string
  ) => {
    setCloning(true);
    try {
      const { data, error } = await (supabase.from("prompt_kits") as any)
        .insert({
          title: `Copy of ${source.title}`,
          description: source.description,
          content: source.content,
          category: source.category,
          tags: source.tags || [],
          author_id: userId,
          published: false,
        })
        .select("id, slug")
        .single();

      if (error) {
        console.error("Error cloning prompt kit:", error);
        toast.error("Failed to clone prompt kit");
        return null;
      }

      toast.success("Prompt kit cloned to your library!");
      navigate(`/prompt-kits/${data.slug}/edit`);
      return data.id as string;
    } catch (err) {
      console.error("Error cloning prompt kit:", err);
      toast.error("Failed to clone prompt kit");
      return null;
    } finally {
      setCloning(false);
    }
  };

  return { cloneKit, cloning };
}
