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
import { useAuthContext } from "@/contexts/AuthContext";
import { useCollections, useCreateCollection } from "@/hooks/useCollections";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type BulkSelectionItem = {
  type: "prompt" | "skill" | "workflow" | "prompt_kit";
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
  const { user } = useAuthContext();
  const { data: collections, isLoading } = useCollections(user?.id);
  const queryClient = useQueryClient();
  const createCollection = useCreateCollection();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // One insert for the whole selection and one toast. It used to add item by
  // item through the single-item mutation, which showed its own "Added to
  // collection!" toast every time: twenty items, twenty toasts (2026-10-07).
  // Items already in the collection are left alone by the unique key
  // (collection_id, item_type, item_id) and counted from what came back.
  const addAll = async (collectionId: string) => {
    setBusyId(collectionId);
    try {
      const { data: last, error: lastError } = await supabase
        .from("collection_items")
        .select("sort_order")
        .eq("collection_id", collectionId)
        .order("sort_order", { ascending: false })
        .limit(1);
      if (lastError) throw lastError;
      const start = (last?.[0]?.sort_order ?? -1) + 1;

      const { data: inserted, error } = await supabase
        .from("collection_items")
        .upsert(
          items.map((item, i) => ({
            collection_id: collectionId,
            item_type: item.type,
            item_id: item.id,
            sort_order: start + i,
          })),
          {
            onConflict: "collection_id,item_type,item_id",
            ignoreDuplicates: true,
          },
        )
        .select("id");
      if (error) throw error;

      const added = inserted?.length ?? 0;
      const already = items.length - added;
      const parts = [
        `Added ${added} item${added === 1 ? "" : "s"} to the collection`,
      ];
      if (already > 0)
        parts.push(
          `${already} ${already === 1 ? "was" : "were"} already in it`,
        );
      toast.success(`${parts.join(", ")}.`);
      onOpenChange(false);
      onDone?.();
    } catch (err) {
      console.error("Error adding to collection:", err);
      toast.error("Nothing was added to the collection. Please try again.");
    } finally {
      setBusyId(null);
      void queryClient.invalidateQueries({
        queryKey: ["collection-items", collectionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
    }
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
          <DialogTitle>
            Add {items.length} item{items.length === 1 ? "" : "s"} to Collection
          </DialogTitle>
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
                    disabled={
                      !newTitle.trim() || createCollection.isPending || !!busyId
                    }
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
                      <span className="flex-1 text-left truncate">
                        {collection.title}
                      </span>
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
