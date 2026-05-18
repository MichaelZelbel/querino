import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useCollections,
  useAddToCollection,
  useCreateCollection,
} from "@/hooks/useCollections";
import { toast } from "sonner";

export type BulkSelectionItem = {
  type: "prompt" | "skill" | "workflow" | "prompt_kit" | "claw";
  id: string;
};

interface BulkAddToCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BulkSelectionItem[];
  onDone?: () => void;
}

export function BulkAddToCollectionModal({
  open,
  onOpenChange,
  items,
  onDone,
}: BulkAddToCollectionModalProps) {
  const { user } = useAuth();
  const { data: collections, isLoading } = useCollections(user?.id);
  const addToCollection = useAddToCollection();
  const createCollection = useCreateCollection();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const addAll = async (collectionId: string) => {
    setBusyId(collectionId);
    let added = 0;
    let skipped = 0;
    let failed = 0;
    for (const item of items) {
      try {
        await addToCollection.mutateAsync({
          collection_id: collectionId,
          item_type: item.type,
          item_id: item.id,
        });
        added++;
      } catch (err: any) {
        if (err?.code === "23505") skipped++;
        else failed++;
      }
    }
    setBusyId(null);
    if (added > 0) toast.success(`Added ${added} item${added === 1 ? "" : "s"} to collection.`);
    if (skipped > 0) toast.info(`${skipped} already in collection.`);
    if (failed > 0) toast.error(`${failed} failed to add.`);
    onOpenChange(false);
    onDone?.();
  };

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim() || !user) return;
    try {
      const collection = await createCollection.mutateAsync({
        title: newTitle.trim(),
        is_public: false,
        owner_id: user.id,
      });
      await addAll(collection.id);
      setNewTitle("");
      setShowNewForm(false);
    } catch (err) {
      console.error("Error creating collection:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {items.length} item{items.length === 1 ? "" : "s"} to Collection</DialogTitle>
          <DialogDescription>
            Pick an existing collection or create a new one.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {showNewForm ? (
              <div className="space-y-3">
                <Input
                  placeholder="Collection name"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewTitle("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateAndAdd}
                    disabled={!newTitle.trim() || createCollection.isPending || !!busyId}
                  >
                    {createCollection.isPending || busyId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create & Add"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="h-4 w-4" />
                Create new collection
              </Button>
            )}

            {collections && collections.length > 0 && (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <Button
                      key={collection.id}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => addAll(collection.id)}
                      disabled={!!busyId}
                    >
                      {busyId === collection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                      <span className="flex-1 text-left truncate">{collection.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {collection.item_count || 0} items
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {collections && collections.length === 0 && !showNewForm && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No collections yet. Create one above!
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
