import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  artifactKindForTable,
  invalidateArtifactQueries,
} from "@/lib/invalidateArtifactQueries";

interface CloneConfig<S> {
  /** Target table, e.g. "skills" */
  table: string;
  /** Human label for toasts, e.g. "skill" */
  label: string;
  /** Insert payload for the clone (WITHOUT author_id — added centrally). */
  buildInsert: (source: S) => Record<string, unknown>;
  /** Route to open after cloning, from the inserted row. */
  editPath: (row: { id: string; slug: string | null }) => string;
}

/**
 * Shared clone hook. The four per-type clone hooks differed only in table,
 * insert fields and post-clone route; they now delegate here.
 */
export function createCloneHook<S extends { id: string; title: string }>(
  config: CloneConfig<S>,
) {
  return function useCloneArtifact() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [cloning, setCloning] = useState(false);

    const clone = async (source: S, userId: string): Promise<string | null> => {
      setCloning(true);

      try {
        const { data, error } = await (
          supabase.from(config.table as any) as any
        )
          .insert({
            ...config.buildInsert(source),
            title: `Copy of ${source.title}`,
            author_id: userId,
          })
          .select("id, slug")
          .single();

        if (error) {
          console.error(`Error cloning ${config.label}:`, error);
          toast.error(`Failed to clone ${config.label}`);
          return null;
        }

        // The table a clone goes into decides which cached lists refetch.
        const kind = artifactKindForTable(config.table);
        if (kind) void invalidateArtifactQueries(queryClient, kind);
        toast.success(
          `${config.label[0].toUpperCase()}${config.label.slice(1)} cloned to your library!`,
        );
        navigate(config.editPath(data));
        return data.id as string;
      } catch (err) {
        console.error(`Error cloning ${config.label}:`, err);
        toast.error(`Failed to clone ${config.label}`);
        return null;
      } finally {
        setCloning(false);
      }
    };

    return { clone, cloning };
  };
}
