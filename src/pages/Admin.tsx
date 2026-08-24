import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Users, Sparkles, Database, Cpu } from "lucide-react";
import { AICreditSettings } from "@/components/admin/AICreditSettings";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { EmbeddingsBackfillPanel } from "@/components/admin/EmbeddingsBackfillPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";

const LLMConfigPanel = lazy(() => import("@/components/admin/LLMConfigPanel"));
const LLMUsagePanel = lazy(() => import("@/components/admin/LLMUsagePanel"));

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Access control check. Unchanged: it still runs before any tab renders.
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        toast.error("You don't have permission to view the admin panel.");
        navigate("/");
        return;
      }
      if (!isAdmin) {
        toast.error("You don't have permission to view the admin panel.");
        navigate("/");
        return;
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  // Don't render anything until auth check is complete
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, credits, moderation and AI configuration
            </p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Credits
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Moderation
            </TabsTrigger>
            <TabsTrigger value="embeddings" className="gap-1.5">
              <Database className="h-3.5 w-3.5" /> Embeddings
            </TabsTrigger>
            <TabsTrigger value="llm" className="gap-1.5">
              <Cpu className="h-3.5 w-3.5" /> LLM Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersPanel />
          </TabsContent>
          <TabsContent value="credits" className="mt-6">
            <AICreditSettings />
          </TabsContent>
          <TabsContent value="moderation" className="mt-6">
            <ModerationPanel />
          </TabsContent>
          <TabsContent value="embeddings" className="mt-6">
            <EmbeddingsBackfillPanel />
          </TabsContent>
          <TabsContent value="llm" className="mt-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <div className="space-y-6">
                <LLMConfigPanel />
                <LLMUsagePanel />
              </div>
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
