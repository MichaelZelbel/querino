import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Plus, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollections, useAddToCollection, useCreateCollection } from "@/hooks/useCollections";
import { toast } from "sonner";

interface AddToCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'prompt' | 'skill' | 'workflow';
  itemId: string;
}

export function AddToCollectionModal({
  open,
  onOpenChange,
  itemType,
  itemId,
}: AddToCollectionModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: collections, isLoading } = useCollections(user?.id);
  const addToCollection = useAddToCollection();
  const createCollection = useCreateCollection();
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const handleAddToCollection = async (collectionId: string) => {
    setAddingTo(collectionId);
    try {
      await addToCollection.mutateAsync({
        collection_id: collectionId,
        item_type: itemType,
        item_id: itemId,
      });
      onOpenChange(false);
    } finally {
      setAddingTo(null);
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
      
      await addToCollection.mutateAsync({
        collection_id: collection.id,
        item_type: itemType,
        item_id: itemId,
      });
      
      onOpenChange(false);
      setNewTitle("");
      setShowNewForm(false);
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Sign in to create collections</p>
            <Button onClick={() => navigate(`/auth?redirect=${window.location.pathname}`)}>
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
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
                    disabled={!newTitle.trim() || createCollection.isPending}
                  >
                    {createCollection.isPending ? (
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
                      onClick={() => handleAddToCollection(collection.id)}
                      disabled={addingTo === collection.id}
                    >
                      {addingTo === collection.id ? (
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
