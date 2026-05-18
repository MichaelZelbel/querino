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
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur"
    >
      <span className="px-2 text-sm font-medium text-foreground">
        {count} selected
      </span>
      <div className="h-5 w-px bg-border" />
      <Button size="sm" variant="ghost" onClick={onAddToCollection} className="gap-2">
        <FolderPlus className="h-4 w-4" />
        Add to Collection
      </Button>
      {onSyncMenerio && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onSyncMenerio}
          disabled={syncing}
          className="gap-2"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync to Menerio
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={deleting}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} item{count === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected artifacts and their versions will be permanently deleted.
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
      <div className="h-5 w-px bg-border" />
      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="gap-1"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
        Clear
      </Button>
    </div>
  );
}
