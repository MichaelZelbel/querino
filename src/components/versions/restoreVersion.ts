import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Restoring an old version, in one place. The version history panel and the
// /library/$slug/versions page each had their own copy, and the page's copy
// wrote "Restored from vN" into the history before updating the prompt and
// never noticed an update that changed zero rows, so a refused restore still
// left a history entry claiming it happened (2026-10-07).

export interface RestoreTableConfig {
  versionsTable: string;
  idColumn: string;
  artifactTable: string;
}

export interface RestoreCurrent {
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
}

export interface RestoreVersion {
  version_number: number;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
}

/**
 * Snapshot the current content when history does not already hold it, update
 * the artifact, and only then record the restore. Tells the user what went
 * wrong itself; resolves true when the artifact now holds the version.
 */
export async function restoreArtifactVersion(opts: {
  config: RestoreTableConfig;
  artifactId: string;
  current: RestoreCurrent;
  version: RestoreVersion;
  artifactLabel: string;
}): Promise<boolean> {
  const { config, artifactId, current, version, artifactLabel } = opts;
  // The four versions tables and the four artifact tables share the columns
  // used here, so the client is typed against the prompt tables.
  const versionsTable = () =>
    supabase.from(config.versionsTable as "prompt_versions");
  const idColumn = config.idColumn as "prompt_id";

  // Fetch the latest version fresh so the next number can't collide with
  // inserts made since the page loaded.
  const { data: latestRow, error: latestError } = await versionsTable()
    .select("version_number, title, description, content, tags")
    .eq(idColumn, artifactId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error("Error fetching latest version:", latestError);
    toast.error("Failed to restore version. Please try again.");
    return false;
  }

  const latest = latestRow as unknown as Partial<RestoreVersion> | null;
  let nextVersionNumber = (latest?.version_number ?? 0) + 1;

  // Snapshot the current content first if it isn't already saved as the
  // latest version, otherwise restoring would silently discard it.
  const currentMatchesLatest =
    latest &&
    latest.title === current.title &&
    (latest.description ?? "") === (current.description ?? "") &&
    latest.content === current.content;

  let snapshotId: string | null = null;
  if (!currentMatchesLatest) {
    const { data: snapshotRow, error: snapshotError } = await versionsTable()
      .insert({
        [config.idColumn]: artifactId,
        version_number: nextVersionNumber,
        title: current.title,
        description: current.description,
        content: current.content,
        tags: current.tags,
        change_notes: `Snapshot before restoring v${version.version_number}`,
      } as never)
      .select("id")
      .maybeSingle();

    if (snapshotError) {
      console.error("Error snapshotting current content:", snapshotError);
      toast.error("Failed to preserve current content. Restore cancelled.");
      return false;
    }
    snapshotId = (snapshotRow as { id: string } | null)?.id ?? null;
    nextVersionNumber += 1;
  }

  // Update the live artifact before writing the "Restored" row. There is no
  // author filter here: RLS decides who may edit (team editors too), and an
  // update it refuses comes back as zero rows, not as an error.
  const { data: updatedRows, error: updateError } = await supabase
    .from(config.artifactTable as "prompts")
    .update({
      title: version.title,
      description: version.description || "",
      content: version.content,
      tags: version.tags,
    })
    .eq("id", artifactId)
    .select("id");

  if (updateError || !updatedRows || updatedRows.length === 0) {
    console.error(
      `Restore did not update the ${artifactLabel}:`,
      updateError ?? artifactId,
    );
    // The restore did not happen, so the snapshot would be false history.
    if (snapshotId) {
      await versionsTable().delete().eq("id", snapshotId);
    }
    toast.error(
      `Failed to restore: the ${artifactLabel} could not be updated.`,
    );
    return false;
  }

  // Record the restoration in the history.
  const { error: versionError } = await versionsTable().insert({
    [config.idColumn]: artifactId,
    version_number: nextVersionNumber,
    title: version.title,
    description: version.description,
    content: version.content,
    tags: version.tags,
    change_notes: `Restored from version v${version.version_number}`,
  } as never);

  if (versionError) {
    // The content is restored; only the history entry is missing.
    console.error("Error creating restore version:", versionError);
    toast.warning(
      `Restored, but the history entry for v${version.version_number} could not be saved.`,
    );
  }

  toast.success(`Restored to version v${version.version_number}`);
  return true;
}
