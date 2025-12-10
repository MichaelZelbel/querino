import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Folder, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollections } from "@/hooks/useCollections";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Collections() {
  const { user } = useAuth();
  const { data: myCollections, isLoading: loadingMy } = useCollections(user?.id);
  const { data: publicCollections, isLoading: loadingPublic } = useCollections();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="text-muted-foreground mt-1">
              Curate and share sets of prompts, skills, and workflows
            </p>
          </div>
          
          {user && (
            <Button asChild>
              <Link to="/collections/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Collection
              </Link>
            </Button>
          )}
        </div>

        {/* My Collections */}
        {user && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">My Collections</h2>
            
            {loadingMy ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myCollections && myCollections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    showOwner={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  You haven't created any collections yet
                </p>
                <Button asChild>
                  <Link to="/collections/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first collection
                  </Link>
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Public Collections */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Public Collections</h2>
          
          {loadingPublic ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : publicCollections && publicCollections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  showOwner={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No public collections yet
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
