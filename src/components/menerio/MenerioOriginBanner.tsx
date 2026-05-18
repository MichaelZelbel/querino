import { CloudDownload, Copy, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MenerioOriginBannerProps {
  /** Set when the artifact has a linked Menerio note. */
  menerioNoteId?: string | null;
  /** True when the current viewer owns the artifact — banner is then hidden. */
  isAuthor?: boolean;
  /** Invoked when the user clicks "Duplicate to edit". */
  onDuplicate?: () => void;
  /** Disables the CTA while a duplicate request is in flight. */
  busy?: boolean;
  /** When true, the CTA is hidden (e.g. anonymous viewer, no edit pathway). */
  canDuplicate?: boolean;
}

/**
 * Trust badge surfaced on artifact detail pages whose source is a Menerio
 * note. Explains provenance to non-authors and offers a "Duplicate to edit"
 * shortcut so they can make a personal, editable copy.
 */
export function MenerioOriginBanner({
  menerioNoteId,
  isAuthor,
  onDuplicate,
  busy,
  canDuplicate = true,
}: MenerioOriginBannerProps) {
  if (!menerioNoteId || isAuthor) return null;

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <CloudDownload className="h-4 w-4 text-primary" />
      <AlertTitle className="text-sm font-medium">Synced from Menerio</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          This artifact stays in sync with a note in its author's Menerio workspace. Duplicate it to
          create your own editable copy.
        </span>
        {canDuplicate && onDuplicate && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicate}
            disabled={busy}
            className="shrink-0 gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Duplicate to edit
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
