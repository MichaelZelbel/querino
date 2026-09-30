import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  artifactKindForTable,
  invalidateArtifactQueries,
} from "@/lib/invalidateArtifactQueries";

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
export function createCopyToTeamHook<S extends { id: string }>(
  config: CopyToTeamConfig<S>,
) {
  return function useCopyArtifactToTeam() {
    const [copying, setCopying] = useState(false);
    const queryClient = useQueryClient();

    const copyToTeam = async (
      source: S,
      teamId: string,
      teamName: string,
      userId: string,
      options: CopyOptions = { includeMetadata: true },
    ): Promise<CopyResult | null> => {
      setCopying(true);

      try {
        // The copy keeps the source's language, as clone and duplicate do.
        // Left out, it took the column default "en": a German prompt copied
        // to a team was labelled English there.
        const language = (source as { language?: string | null }).language;
        const insertData = {
          ...config.buildInsert(source, options.includeMetadata !== false),
          ...(language ? { language } : {}),
          author_id: userId,
          team_id: teamId,
        };

        const { data, error } = await (
          supabase.from(config.table as any) as any
        )
          .insert(insertData)
          .select("id, slug")
          .single();

        if (error) {
          console.error(`Error copying ${config.label} to team:`, error);
          toast.error(`Failed to copy ${config.label} to team`);
          return null;
        }

        // The team's lists were cached without the copy. Clone and duplicate
        // refresh them since 2026-09-23; copying to a team did not, so the
        // team Library missed the new item for up to a minute.
        const kind = artifactKindForTable(config.table);
        if (kind) void invalidateArtifactQueries(queryClient, kind);

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
