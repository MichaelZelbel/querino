import { supabase } from "@/integrations/supabase/client";
import { moderateContent } from "@/lib/moderateContent";
import { toast } from "sonner";
import type { SuggestionItemType } from "@/types/suggestion";

/** Where each suggestable artifact and its version history live. */
const TABLES: Record<
  SuggestionItemType,
  { table: string; versionsTable: string; idColumn: string }
> = {
  prompt: {
    table: "prompts",
    versionsTable: "prompt_versions",
    idColumn: "prompt_id",
  },
  skill: {
    table: "skills",
    versionsTable: "skill_versions",
    idColumn: "skill_id",
  },
  workflow: {
    table: "workflows",
    versionsTable: "workflow_versions",
    idColumn: "workflow_id",
  },
  prompt_kit: {
    table: "prompt_kits",
    versionsTable: "prompt_kit_versions",
    idColumn: "prompt_kit_id",
  },
};

/** The live artifact as the detail page holds it right now. */
export interface SuggestionTarget {
  id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
  /** prompts.is_public, or published for skills, workflows and kits. */
  isPublic: boolean;
}

export interface SuggestionChange {
  title?: string | null;
  description?: string | null;
  content: string;
}

interface LatestVersion {
  version_number: number;
  title: string;
  description: string | null;
  content: string;
}

/**
 * Snapshot the current content into the versions table so applying a
 * suggestion never overwrites it without a trace. Versions are author-only
 * under RLS, so for anyone else this is skipped rather than failing the apply.
 * Returns the id of the inserted row, or null when nothing was inserted.
 */
async function snapshotCurrent(
  itemType: SuggestionItemType,
  target: SuggestionTarget,
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId || target.author_id !== userId) return null;
  const { versionsTable, idColumn } = TABLES[itemType];
  try {
    const { data: latestRow, error: latestError } = await supabase
      .from(versionsTable as "prompt_versions")
      .select("version_number, title, description, content")
      .eq(idColumn as "prompt_id", target.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) {
      console.warn("[applySuggestion] Could not read versions:", latestError);
      return null;
    }
    const latest = latestRow as LatestVersion | null;
    const alreadySaved =
      latest &&
      latest.title === target.title &&
      (latest.description ?? "") === (target.description ?? "") &&
      latest.content === target.content;
    if (alreadySaved) return null;

    const { data: inserted, error: insertError } = await supabase
      .from(versionsTable as "prompt_versions")
      .insert({
        [idColumn]: target.id,
        version_number: (latest?.version_number ?? 0) + 1,
        title: target.title,
        description: target.description,
        content: target.content,
        tags: target.tags,
        change_notes: "Snapshot before applying a suggestion",
      } as never)
      .select("id")
      .maybeSingle();
    if (insertError) {
      console.warn("[applySuggestion] Snapshot not saved:", insertError);
      return null;
    }
    return (inserted as { id: string } | null)?.id ?? null;
  } catch (err) {
    console.warn("[applySuggestion] Snapshot failed:", err);
    return null;
  }
}

/**
 * Apply an accepted suggestion to its artifact: moderation when the artifact
 * is public, a version snapshot of the current content, then the update.
 * Returns false (after telling the user why) when the suggestion was not
 * applied; throws on an unexpected database error.
 */
export async function applySuggestionToArtifact(
  itemType: SuggestionItemType,
  target: SuggestionTarget,
  suggestion: SuggestionChange,
  userId: string | null | undefined,
): Promise<boolean> {
  const updates: { content: string; title?: string; description?: string } = {
    content: suggestion.content,
  };
  if (suggestion.title) updates.title = suggestion.title;
  if (suggestion.description) updates.description = suggestion.description;

  if (target.isPublic) {
    const result = await moderateContent(
      {
        title: updates.title ?? target.title,
        description: updates.description ?? target.description,
        content: updates.content,
      },
      "edit_public",
      itemType,
      target.id,
    );
    if (!result.approved) {
      toast.error(
        result.reason ||
          "This suggestion was blocked by moderation and cannot be applied to public content.",
      );
      return false;
    }
  }

  const { table, versionsTable } = TABLES[itemType];
  const snapshotId = await snapshotCurrent(itemType, target, userId);

  const { data: updatedRows, error } = await supabase
    .from(table as "prompts")
    .update(updates)
    .eq("id", target.id)
    .select("id");

  const applied = !error && !!updatedRows && updatedRows.length > 0;
  if (!applied && snapshotId) {
    // The apply did not happen, so the snapshot would be a false history row.
    await supabase
      .from(versionsTable as "prompt_versions")
      .delete()
      .eq("id", snapshotId);
  }
  if (error) throw error;
  if (!applied) {
    toast.error("You do not have permission to change this item.");
    return false;
  }
  return true;
}
