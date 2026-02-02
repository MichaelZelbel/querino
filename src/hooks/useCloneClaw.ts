import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Claw } from "@/types/claw";

export function useCloneClaw() {
  const [cloning, setCloning] = useState(false);
  const navigate = useNavigate();

  const cloneClaw = async (claw: Claw, userId: string) => {
    setCloning(true);
    
    try {
      const { data: newClaw, error } = await (supabase
        .from("claws") as any)
        .insert({
          title: `Copy of ${claw.title}`,
          description: claw.description,
          content: claw.content,
          category: claw.category,
          tags: claw.tags,
          source: claw.source,
          author_id: userId,
          published: false,
        })
        .select("slug")
        .single();

      if (error) {
        throw error;
      }

      toast.success("Claw cloned to your library!");
      navigate(`/claws/${newClaw.slug}/edit`);
    } catch (err) {
      console.error("Error cloning claw:", err);
      toast.error("Failed to clone claw");
    } finally {
      setCloning(false);
    }
  };

  return { cloneClaw, cloning };
}
