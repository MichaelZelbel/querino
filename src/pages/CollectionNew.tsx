import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateCollection } from "@/hooks/useCollections";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function CollectionNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const createCollection = useCreateCollection();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate("/auth?redirect=/collections/new");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    try {
      const collection = await createCollection.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
        owner_id: user.id,
      });
      navigate(`/collections/${collection.id}/edit`);
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/collections")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collections
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My awesome collection"
                  required
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

              <Button
                type="submit"
                className="w-full"
                disabled={!title.trim() || createCollection.isPending}
              >
                {createCollection.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Collection"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
