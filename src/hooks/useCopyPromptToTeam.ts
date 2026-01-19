import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CopyOptions {
  includeMetadata: boolean;
}

interface CopyResult {
  id: string;
  slug: string;
  teamName: string;
}

export function useCopyPromptToTeam() {
  const [copying, setCopying] = useState(false);

  const copyPromptToTeam = async (
    sourcePrompt: {
      id: string;
      title: string;
      description: string;
      content: string;
      category: string;
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
        title: sourcePrompt.title,
        content: sourcePrompt.content,
        author_id: userId,
        team_id: teamId,
        is_public: false,
        rating_avg: 0,
        rating_count: 0,
        copies_count: 0,
      };

      if (options.includeMetadata) {
        insertData.description = sourcePrompt.description;
        insertData.category = sourcePrompt.category;
        insertData.tags = sourcePrompt.tags || [];
      } else {
        insertData.description = "";
        insertData.category = "writing"; // Default category
        insertData.tags = [];
      }

      const { data, error } = await supabase
        .from("prompts")
        .insert(insertData)
        .select("id, slug")
        .single();

      if (error) {
        console.error("Error copying prompt to team:", error);
        toast.error("Failed to copy prompt to team");
        return null;
      }

      console.log("Prompt copied to team", { 
        sourceId: sourcePrompt.id, 
        newId: data.id, 
        teamId 
      });

      return {
        id: data.id,
        slug: data.slug,
        teamName,
      };
    } catch (err) {
      console.error("Error copying prompt to team:", err);
      toast.error("Failed to copy prompt to team");
      return null;
    } finally {
      setCopying(false);
    }
  };

  return { copyPromptToTeam, copying };
}
