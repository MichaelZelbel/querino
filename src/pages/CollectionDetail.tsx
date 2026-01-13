import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Copy,
  Globe,
  Lock,
  FileText,
  BookOpen,
  Workflow,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useCollection,
  useCollectionItems,
  useCreateCollection,
  useAddToCollection,
  useRemoveFromCollection,
} from "@/hooks/useCollections";
import { usePrompts } from "@/hooks/usePrompts";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import { CommentsSection } from "@/components/comments";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  const { data: collection, isLoading: loadingCollection } = useCollection(id || "");
  const { data: items, isLoading: loadingItems } = useCollectionItems(id || "");
  const { data: prompts } = usePrompts();
  const { data: skills } = useSkills();
  const { data: workflows } = useWorkflows();
  
  const createCollection = useCreateCollection();
  const addToCollection = useAddToCollection();
  const removeFromCollection = useRemoveFromCollection();

  const isOwner = user?.id === collection?.owner_id;

  // Get full item data
  const itemsWithData = useMemo(() => {
    return items?.map((item) => {
      let data = null;
      if (item.item_type === "prompt") {
        data = prompts?.find((p) => p.id === item.item_id);
      } else if (item.item_type === "skill") {
        data = skills?.find((s) => s.id === item.item_id);
      } else if (item.item_type === "workflow") {
        data = workflows?.find((w) => w.id === item.item_id);
      }
      return { ...item, data };
    }) || [];
  }, [items, prompts, skills, workflows]);

  // Filter items by type
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return itemsWithData;
    return itemsWithData.filter((item) => item.item_type === activeFilter);
  }, [itemsWithData, activeFilter]);

  // Count items by type
  const itemCounts = useMemo(() => {
    const counts = { prompt: 0, skill: 0, workflow: 0 };
    itemsWithData.forEach((item) => {
      if (item.item_type in counts) {
        counts[item.item_type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [itemsWithData]);

  const handleCloneCollection = async () => {
    if (!user || !collection || !items) {
      toast.error("Please sign in to clone this collection");
      return;
    }

    try {
      const newCollection = await createCollection.mutateAsync({
        title: `Copy of ${collection.title}`,
        description: collection.description || undefined,
        is_public: false,
        owner_id: user.id,
      });

      // Add all items to the new collection
      for (const item of items) {
        await addToCollection.mutateAsync({
          collection_id: newCollection.id,
          item_type: item.item_type,
          item_id: item.item_id,
        });
      }

      toast.success("Collection cloned to your library!");
      navigate(`/collections/${newCollection.id}/edit`);
    } catch (error) {
      console.error("Error cloning collection:", error);
      toast.error("Failed to clone collection");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!id) return;
    
    try {
      await removeFromCollection.mutateAsync({
        collectionId: id,
        itemId: itemId,
      });
    } catch (error) {
      console.error("Error removing item:", error);
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
          <Button onClick={() => navigate("/library")}>
            Back to Library
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const ownerName = collection.owner?.display_name || "Anonymous";
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const getItemIcon = (type: string) => {
    switch (type) {
      case "prompt":
        return <FileText className="h-4 w-4" />;
      case "skill":
        return <BookOpen className="h-4 w-4" />;
      case "workflow":
        return <Workflow className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getItemLink = (item: any) => {
    switch (item.item_type) {
      case "prompt":
        return `/prompts/${item.data?.slug || item.item_id}`;
      case "skill":
        return `/skills/${item.data?.slug || item.item_id}`;
      case "workflow":
        return `/workflows/${item.data?.slug || item.item_id}`;
      default:
        return "#";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/library")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{collection.title}</h1>
                {collection.is_public ? (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              {collection.description && (
                <p className="text-muted-foreground">{collection.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              {isOwner ? (
                <Button asChild>
                  <Link to={`/collections/${collection.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleCloneCollection}
                  disabled={createCollection.isPending}
                >
                  {createCollection.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Clone Collection
                </Button>
              )}
            </div>
          </div>

          {/* Owner info */}
          <Link
            to={`/u/${ownerName}`}
            className="inline-flex items-center gap-2 hover:opacity-80"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={collection.owner?.avatar_url || undefined} />
              <AvatarFallback>{ownerInitial}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">by {ownerName}</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="h-5 px-1.5">
                {itemsWithData.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="prompt" className="gap-2">
              <FileText className="h-3.5 w-3.5" />
              Prompts
              {itemCounts.prompt > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {itemCounts.prompt}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="skill" className="gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Skills
              {itemCounts.skill > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {itemCounts.skill}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <Workflow className="h-3.5 w-3.5" />
              Workflows
              {itemCounts.workflow > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {itemCounts.workflow}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Items */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {activeFilter === "all" ? "All Items" : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}s`} ({filteredItems.length})
          </h2>
          
          {filteredItems.length > 0 ? (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Link to={getItemLink(item)} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-muted rounded">
                          {getItemIcon(item.item_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {item.data?.title || "Unknown item"}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.item_type}
                            </Badge>
                          </div>
                          {item.data?.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {item.data.description}
                            </p>
                          )}
                        </div>
                      </Link>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeFromCollection.isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {activeFilter === "all" 
                    ? "This collection is empty"
                    : `No ${activeFilter}s in this collection`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comments & Discussion */}
        <div className="mt-8">
          <CommentsSection itemType="collection" itemId={collection.id} teamId={(collection as any).team_id} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
