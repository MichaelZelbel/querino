import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Claw } from "@/types/claw";

export function useCopyClawToTeam() {
  const [copying, setCopying] = useState(false);

  const copyClawToTeam = async (claw: Claw, teamId: string) => {
    setCopying(true);
    
    try {
      const { error } = await (supabase
        .from("claws") as any)
        .insert({
          title: claw.title,
          description: claw.description,
          content: claw.content,
          category: claw.category,
          tags: claw.tags,
          source: claw.source,
          team_id: teamId,
          published: false,
        });

      if (error) {
        throw error;
      }

      toast.success("Claw copied to team!");
    } catch (err) {
      console.error("Error copying claw to team:", err);
      toast.error("Failed to copy claw to team");
    } finally {
      setCopying(false);
    }
  };

  return { copyClawToTeam, copying };
}
