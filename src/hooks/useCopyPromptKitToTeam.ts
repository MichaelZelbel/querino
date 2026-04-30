import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CopyResult {
  id: string;
  slug: string;
  teamName: string;
}

export function useCopyPromptKitToTeam() {
  const [copying, setCopying] = useState(false);

  const copyKitToTeam = async (
    source: {
      id: string;
      title: string;
      description: string | null;
      content: string;
      category: string | null;
      tags?: string[] | null;
    },
    teamId: string,
    teamName: string,
    userId: string,
    options: { includeMetadata: boolean } = { includeMetadata: true }
  ): Promise<CopyResult | null> => {
    setCopying(true);
    try {
      const insertData: any = {
        title: source.title,
        content: source.content,
        author_id: userId,
        team_id: teamId,
        published: false,
      };
      if (options.includeMetadata) {
        insertData.description = source.description;
        insertData.category = source.category;
        insertData.tags = source.tags || [];
      } else {
        insertData.description = "";
        insertData.tags = [];
      }

      const { data, error } = await (supabase.from("prompt_kits") as any)
        .insert(insertData)
        .select("id, slug")
        .single();

      if (error) {
        console.error("Error copying prompt kit to team:", error);
        toast.error("Failed to copy prompt kit to team");
        return null;
      }

      return { id: data.id, slug: data.slug, teamName };
    } catch (err) {
      console.error("Error copying prompt kit to team:", err);
      toast.error("Failed to copy prompt kit to team");
      return null;
    } finally {
      setCopying(false);
    }
  };

  return { copyKitToTeam, copying };
}
