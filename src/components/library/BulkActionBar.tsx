import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FolderPlus, RefreshCw, Trash2, X, Loader2 } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onAddToCollection: () => void;
  onSyncMenerio?: () => void;
  onDelete: () => void;
  deleting?: boolean;
  syncing?: boolean;
}

export function BulkActionBar({
  count,
  onClear,
  onAddToCollection,
  onSyncMenerio,
  onDelete,
  deleting,
  syncing,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      // On a 375px phone the labelled buttons overflowed the screen: the bar is
      // capped to the viewport, wraps, and shows icons only below "sm".
      className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur sm:rounded-full"
    >
      <span className="px-2 text-sm font-medium text-foreground">
        {count} selected
      </span>
      <div className="hidden h-5 w-px bg-border sm:block" />
      <Button
        size="sm"
        variant="ghost"
        onClick={onAddToCollection}
        className="gap-2"
        aria-label="Add selected to a collection"
      >
        <FolderPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Add to Collection</span>
      </Button>
      {onSyncMenerio && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onSyncMenerio}
          disabled={syncing}
          className="gap-2"
          aria-label="Sync selected to Menerio"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Sync to Menerio</span>
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={deleting}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete selected"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {count} item{count === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected artifacts and their
              versions will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="hidden h-5 w-px bg-border sm:block" />
      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="gap-1"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">Clear</span>
      </Button>
    </div>
  );
}
