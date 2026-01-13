import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Skill } from "@/types/skill";

export function useCloneSkill() {
  const [cloning, setCloning] = useState(false);
  const navigate = useNavigate();

  const cloneSkill = async (skill: Skill, userId: string) => {
    setCloning(true);
    
    try {
      const { data: newSkill, error } = await supabase
        .from("skills")
        .insert({
          title: `Copy of ${skill.title}`,
          description: skill.description,
          content: skill.content,
          tags: skill.tags,
          author_id: userId,
          published: false,
        })
        .select("id, slug")
        .single();

      if (error) {
        throw error;
      }

      toast.success("Skill cloned to your library!");
      navigate(`/skills/${newSkill.slug}/edit`);
    } catch (err) {
      console.error("Error cloning skill:", err);
      toast.error("Failed to clone skill");
    } finally {
      setCloning(false);
    }
  };

  return { cloneSkill, cloning };
}
