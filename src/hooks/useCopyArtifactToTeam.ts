import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CopyOptions {
  includeMetadata?: boolean;
}

export interface CopyResult {
  id: string;
  slug: string;
  teamName: string;
}

interface CopyToTeamConfig<S> {
  /** Target table, e.g. "skills" */
  table: string;
  /** Human label for error messages, e.g. "skill" */
  label: string;
  /** Per-type insert payload (WITHOUT author_id/team_id — added centrally). */
  buildInsert: (source: S, includeMetadata: boolean) => Record<string, unknown>;
}

/**
 * Shared copy-to-team hook. The four per-type hooks differed only in table
 * name and insert-field mapping; they now delegate here.
 */
export function createCopyToTeamHook<S extends { id: string }>(config: CopyToTeamConfig<S>) {
  return function useCopyArtifactToTeam() {
    const [copying, setCopying] = useState(false);

    const copyToTeam = async (
      source: S,
      teamId: string,
      teamName: string,
      userId: string,
      options: CopyOptions = { includeMetadata: true }
    ): Promise<CopyResult | null> => {
      setCopying(true);

      try {
        const insertData = {
          ...config.buildInsert(source, options.includeMetadata !== false),
          author_id: userId,
          team_id: teamId,
        };

        const { data, error } = await (supabase.from(config.table as any) as any)
          .insert(insertData)
          .select("id, slug")
          .single();

        if (error) {
          console.error(`Error copying ${config.label} to team:`, error);
          toast.error(`Failed to copy ${config.label} to team`);
          return null;
        }

        return { id: data.id, slug: data.slug, teamName };
      } catch (err) {
        console.error(`Error copying ${config.label} to team:`, err);
        toast.error(`Failed to copy ${config.label} to team`);
        return null;
      } finally {
        setCopying(false);
      }
    };

    return { copyToTeam, copying };
  };
}
