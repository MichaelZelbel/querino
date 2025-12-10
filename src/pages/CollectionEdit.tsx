import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Code,
  Workflow,
  GripVertical,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useCollection,
  useCollectionItems,
  useUpdateCollection,
  useDeleteCollection,
  useAddToCollection,
  useRemoveFromCollection,
  useUpdateItemOrder,
} from "@/hooks/useCollections";
import { usePrompts } from "@/hooks/usePrompts";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function CollectionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const { data: collection, isLoading: loadingCollection } = useCollection(id || "");
  const { data: items, isLoading: loadingItems } = useCollectionItems(id || "");
  const { data: prompts } = usePrompts();
  const { data: skills } = useSkills();
  const { data: workflows } = useWorkflows();
  
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const addToCollection = useAddToCollection();
  const removeFromCollection = useRemoveFromCollection();
  const updateItemOrder = useUpdateItemOrder();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItemType, setAddItemType] = useState<'prompt' | 'skill' | 'workflow'>('prompt');
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize form when collection loads
  if (collection && !initialized) {
    setTitle(collection.title);
    setDescription(collection.description || "");
    setIsPublic(collection.is_public);
    setInitialized(true);
  }

  // Authorization check
  if (!authLoading && (!user || (collection && user.id !== collection.owner_id))) {
    navigate("/collections");
    return null;
  }

  const handleSave = async () => {
    if (!id || !title.trim()) return;

    await updateCollection.mutateAsync({
      id,
      title: title.trim(),
      description: description.trim() || undefined,
      is_public: isPublic,
    });
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteCollection.mutateAsync(id);
    navigate("/collections");
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!id) return;
    await removeFromCollection.mutateAsync({
      collectionId: id,
      itemId,
    });
  };

  // Get user's artefacts for adding
  const userPrompts = prompts?.filter((p) => p.author_id === user?.id) || [];
  const userSkills = skills?.filter((s) => s.author_id === user?.id) || [];
  const userWorkflows = workflows?.filter((w) => w.author_id === user?.id) || [];

  const getAvailableItems = () => {
    const existingIds = new Set(items?.map((i) => i.item_id) || []);
    let available: any[] = [];

    if (addItemType === 'prompt') {
      available = userPrompts.filter((p) => !existingIds.has(p.id));
    } else if (addItemType === 'skill') {
      available = userSkills.filter((s) => !existingIds.has(s.id));
    } else {
      available = userWorkflows.filter((w) => !existingIds.has(w.id));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      available = available.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    return available;
  };

  const handleAddItem = async (itemId: string) => {
    if (!id) return;
    await addToCollection.mutateAsync({
      collection_id: id,
      item_type: addItemType,
      item_id: itemId,
    });
  };

  // Get full item data
  const itemsWithData = items?.map((item) => {
    let data = null;
    if (item.item_type === "prompt") {
      data = prompts?.find((p) => p.id === item.item_id);
    } else if (item.item_type === "skill") {
      data = skills?.find((s) => s.id === item.item_id);
    } else if (item.item_type === "workflow") {
      data = workflows?.find((w) => w.id === item.item_id);
    }
    return { ...item, data };
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case "prompt":
        return <FileText className="h-4 w-4" />;
      case "skill":
        return <Code className="h-4 w-4" />;
      case "workflow":
        return <Workflow className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loadingCollection || loadingItems) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Collection not found</h1>
          <Button onClick={() => navigate("/collections")}>
            Back to Collections
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(`/collections/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collection
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Collection title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this collection about?"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Public collections can be viewed by anyone
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!title.trim() || updateCollection.isPending}
                  className="flex-1"
                >
                  {updateCollection.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the collection and remove all items from it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items ({itemsWithData?.length || 0})</CardTitle>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {itemsWithData && itemsWithData.length > 0 ? (
                <div className="space-y-2">
                  {itemsWithData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="p-2 bg-muted rounded">
                        {getItemIcon(item.item_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {item.data?.title || "Unknown"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.item_type}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No items yet. Add some!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Item Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Item to Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={addItemType}
                onValueChange={(v) => setAddItemType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prompt">Prompt</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search your items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {getAvailableItems().map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      handleAddItem(item.id);
                      setShowAddModal(false);
                      setSearchQuery("");
                    }}
                  >
                    {getItemIcon(addItemType)}
                    <span className="truncate">{item.title}</span>
                  </Button>
                ))}
                {getAvailableItems().length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No items available to add
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
