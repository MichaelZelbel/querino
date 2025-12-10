import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Workflow } from "@/types/workflow";

export function useCloneWorkflow() {
  const [cloning, setCloning] = useState(false);
  const navigate = useNavigate();

  const cloneWorkflow = async (workflow: Workflow, userId: string) => {
    setCloning(true);
    
    try {
      const { data: newWorkflow, error } = await supabase
        .from("workflows")
        .insert({
          title: `Copy of ${workflow.title}`,
          description: workflow.description,
          json: workflow.json as any,
          tags: workflow.tags,
          author_id: userId,
          published: false,
        } as any)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      toast.success("Workflow cloned to your library!");
      navigate(`/workflows/${newWorkflow.id}/edit`);
    } catch (err) {
      console.error("Error cloning workflow:", err);
      toast.error("Failed to clone workflow");
    } finally {
      setCloning(false);
    }
  };

  return { cloneWorkflow, cloning };
}
