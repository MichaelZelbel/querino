import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClawVersion {
  id: string;
  claw_id: string;
  version_number: number;
  title: string;
  description: string | null;
  content: string | null;
  skill_md_content: string | null;
  tags: string[] | null;
  change_notes: string | null;
  created_at: string;
}

export function useClawVersions(clawId: string | undefined) {
  return useQuery({
    queryKey: ["claw-versions", clawId],
    queryFn: async () => {
      if (!clawId) return [];

      const { data, error } = await (supabase
        .from("claw_versions") as any)
        .select("*")
        .eq("claw_id", clawId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return (data || []) as ClawVersion[];
    },
    enabled: !!clawId,
  });
}

export function useCreateClawVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: Omit<ClawVersion, "id" | "created_at">) => {
      const { data, error } = await (supabase
        .from("claw_versions") as any)
        .insert(version)
        .select()
        .single();

      if (error) throw error;
      return data as ClawVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["claw-versions", variables.claw_id],
      });
    },
  });
}

export function useRestoreClawVersion() {
  const queryClient = useQueryClient();
  const createVersion = useCreateClawVersion();

  return useMutation({
    mutationFn: async ({
      clawId,
      version,
      currentVersionNumber,
    }: {
      clawId: string;
      version: ClawVersion;
      currentVersionNumber: number;
    }) => {
      // Update the claw with the version's data
      const { error: updateError } = await (supabase
        .from("claws") as any)
        .update({
          title: version.title,
          description: version.description,
          content: version.content,
          skill_md_content: version.skill_md_content,
          tags: version.tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clawId);

      if (updateError) throw updateError;

      // Create a new version entry for the restore
      await createVersion.mutateAsync({
        claw_id: clawId,
        version_number: currentVersionNumber + 1,
        title: version.title,
        description: version.description,
        content: version.content,
        skill_md_content: version.skill_md_content,
        tags: version.tags,
        change_notes: `Restored from version v${version.version_number}`,
      });

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["claw-versions", variables.clawId],
      });
      queryClient.invalidateQueries({
        queryKey: ["claws"],
      });
    },
  });
}
