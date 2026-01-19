import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface JoinResult {
  teamId: string;
  teamName: string;
}

export function useJoinTeam() {
  const [isJoining, setIsJoining] = useState(false);
  const queryClient = useQueryClient();

  const joinTeam = async (teamId: string, userId: string): Promise<JoinResult | null> => {
    setIsJoining(true);
    
    try {
      // First, verify the team exists and get its name
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        toast.error("Team not found", {
          description: "Please check the team ID and try again.",
        });
        return null;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingMember) {
        toast.error("Already a member", {
          description: `You're already a member of ${team.name}.`,
        });
        return null;
      }

      // Join the team as a member
      const { error: insertError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: userId,
          role: "member",
        });

      if (insertError) {
        console.error("Join team error:", insertError);
        if (insertError.message.includes("premium")) {
          toast.error("Premium required", {
            description: "Only Premium users can join teams.",
          });
        } else {
          toast.error("Failed to join team", {
            description: insertError.message,
          });
        }
        return null;
      }

      // Invalidate queries to refresh team lists
      queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      
      toast.success(`Joined ${team.name}!`, {
        description: "You're now a member of this team.",
      });

      return {
        teamId: team.id,
        teamName: team.name,
      };
    } catch (error) {
      console.error("Join team error:", error);
      toast.error("Failed to join team");
      return null;
    } finally {
      setIsJoining(false);
    }
  };

  return {
    joinTeam,
    isJoining,
  };
}
