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

export function useCopyWorkflowToTeam() {
  const [copying, setCopying] = useState(false);

  const copyWorkflowToTeam = async (
    sourceWorkflow: {
      id: string;
      title: string;
      description?: string | null;
      content?: string | null;
      json?: any;
      category?: string | null;
      tags?: string[] | null;
      filename?: string | null;
      scope?: string | null;
    },
    teamId: string,
    teamName: string,
    userId: string,
    options: CopyOptions = { includeMetadata: true }
  ): Promise<CopyResult | null> => {
    setCopying(true);

    try {
      const insertData: any = {
        title: sourceWorkflow.title,
        content: sourceWorkflow.content || null,
        json: sourceWorkflow.json || {},
        author_id: userId,
        team_id: teamId,
        published: false,
        rating_avg: 0,
        rating_count: 0,
      };

      if (options.includeMetadata) {
        insertData.description = sourceWorkflow.description || null;
        insertData.category = sourceWorkflow.category || null;
        insertData.tags = sourceWorkflow.tags || [];
        insertData.filename = sourceWorkflow.filename || null;
        insertData.scope = sourceWorkflow.scope || 'workspace';
      } else {
        insertData.description = null;
        insertData.category = null;
        insertData.tags = [];
        insertData.filename = null;
        insertData.scope = 'workspace';
      }

      const { data, error } = await supabase
        .from("workflows")
        .insert(insertData)
        .select("id, slug")
        .single();

      if (error) {
        console.error("Error copying workflow to team:", error);
        toast.error("Failed to copy workflow to team");
        return null;
      }

      console.log("Workflow copied to team", { 
        sourceId: sourceWorkflow.id, 
        newId: data.id, 
        teamId 
      });

      return {
        id: data.id,
        slug: data.slug,
        teamName,
      };
    } catch (err) {
      console.error("Error copying workflow to team:", err);
      toast.error("Failed to copy workflow to team");
      return null;
    } finally {
      setCopying(false);
    }
  };

  return { copyWorkflowToTeam, copying };
}
