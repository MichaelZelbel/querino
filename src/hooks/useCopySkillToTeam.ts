import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CopyOptions {
  includeMetadata?: boolean;
}

interface CopyResult {
  id: string;
  slug: string;
  teamName: string;
}

export function useCopySkillToTeam() {
  const [copying, setCopying] = useState(false);

  const copySkillToTeam = async (
    sourceSkill: {
      id: string;
      title: string;
      description?: string | null;
      content: string;
      category?: string | null;
      tags?: string[] | null;
    },
    teamId: string,
    teamName: string,
    userId: string,
    options: CopyOptions = { includeMetadata: true }
  ): Promise<CopyResult | null> => {
    setCopying(true);

    try {
      const insertData: any = {
        title: sourceSkill.title,
        content: sourceSkill.content,
        author_id: userId,
        team_id: teamId,
        published: false,
        rating_avg: 0,
        rating_count: 0,
      };

      if (options.includeMetadata) {
        insertData.description = sourceSkill.description || null;
        insertData.category = sourceSkill.category || null;
        insertData.tags = sourceSkill.tags || [];
      } else {
        insertData.description = null;
        insertData.category = null;
        insertData.tags = [];
      }

      const { data, error } = await supabase
        .from("skills")
        .insert(insertData)
        .select("id, slug")
        .single();

      if (error) {
        console.error("Error copying skill to team:", error);
        toast.error("Failed to copy skill to team");
        return null;
      }

      console.log("Skill copied to team", { 
        sourceId: sourceSkill.id, 
        newId: data.id, 
        teamId 
      });

      return {
        id: data.id,
        slug: data.slug,
        teamName,
      };
    } catch (err) {
      console.error("Error copying skill to team:", err);
      toast.error("Failed to copy skill to team");
      return null;
    } finally {
      setCopying(false);
    }
  };

  return { copySkillToTeam, copying };
}
