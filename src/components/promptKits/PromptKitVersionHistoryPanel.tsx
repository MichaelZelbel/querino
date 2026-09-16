import { useNavigate } from "@/lib/router-compat";
import {
  VersionHistoryPanel,
  type PromptVersion,
  type VersionTableConfig,
} from "@/components/versions";

// This used to be a copy of the generic panel with its own restore logic, and
// the copy drifted: it did not snapshot unsaved live content before restoring,
// it numbered the next version from a possibly stale list, and it toasted
// success when the kit update matched no row. It is now a thin wrapper so the
// kit pages keep their import and props while the generic panel does the work.

/** A kit version row: the same columns as a prompt version, keyed by kit id. */
export type PromptKitVersion = Omit<PromptVersion, "prompt_id"> & {
  prompt_kit_id: string;
};

interface CurrentKitData {
  id: string;
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
}

interface PromptKitVersionHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptKitId: string;
  currentKit: CurrentKitData;
  onRestoreComplete?: () => void;
}

const PROMPT_KIT_CONFIG: VersionTableConfig = {
  versionsTable: "prompt_kit_versions",
  idColumn: "prompt_kit_id",
  artifactTable: "prompt_kits",
};

export function PromptKitVersionHistoryPanel({
  open,
  onOpenChange,
  promptKitId,
  currentKit,
  onRestoreComplete,
}: PromptKitVersionHistoryPanelProps) {
  const navigate = useNavigate();

  return (
    <VersionHistoryPanel
      open={open}
      onOpenChange={onOpenChange}
      promptId={promptKitId}
      currentPrompt={{
        ...currentKit,
        description: currentKit.description ?? "",
      }}
      tableConfig={PROMPT_KIT_CONFIG}
      artifactLabel="prompt kit"
      // The generic panel's slug fallback leads to the prompt edit route, so
      // no slug is passed; a caller without a callback gets the page reload
      // the old panel did, which shows the restored content.
      onRestoreComplete={onRestoreComplete ?? (() => navigate(0))}
    />
  );
}
