import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Copy, Check, ArrowLeft, Pencil, Calendar, Tag, Package,
  History, GitFork, Users, MessageSquarePlus, MessageSquare,
  Pin, PinOff, FolderPlus, Activity as ActivityIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { PromptKit, PromptKitAuthor } from "@/types/promptKit";
import { format } from "date-fns";
import { parsePromptKitItems } from "@/lib/promptKitParser";
import { useClonePromptKit } from "@/hooks/useClonePromptKit";
import { CopyPromptKitToTeamModal } from "@/components/promptKits/CopyPromptKitToTeamModal";
import { PromptKitVersionHistoryPanel } from "@/components/promptKits/PromptKitVersionHistoryPanel";
import { useSuggestions } from "@/hooks/useSuggestions";
import { SuggestEditModal, SuggestionsTab } from "@/components/suggestions";
import { PromptKitReviewSection } from "@/components/promptKits/PromptKitReviewSection";
import { usePinnedPromptKits } from "@/hooks/usePinnedPromptKits";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { CommentsSection } from "@/components/comments";
import { ActivitySidebar } from "@/components/activity";

interface KitWithAuthor extends PromptKit {
  author?: PromptKitAuthor | null;
}

export default function PromptKitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { teams } = useWorkspace();
  const { cloneKit, cloning } = useClonePromptKit();
  const [kit, setKit] = useState<KitWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copyTeamOpen, setCopyTeamOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [pinning, setPinning] = useState(false);

  const isAuthor = kit?.author_id && user?.id === kit.author_id;
  const hasTeams = teams && teams.length > 0;

  const { isPinned: isKitPinned, togglePin: toggleKitPin } = usePinnedPromptKits();
  const isPinned = kit?.id ? isKitPinned(kit.id) : false;

  const handleTogglePin = async () => {
    if (!user) {
      toast.error("Sign in to pin prompt kits");
      return;
    }
    if (!kit) return;
    setPinning(true);
    const { error } = await toggleKitPin(kit.id);
    setPinning(false);
    if (error) {
      toast.error("Failed to update pin");
      return;
    }
    toast.success(isPinned ? "Unpinned" : "Pinned!");
  };

  const {
    suggestions,
    loading: loadingSuggestions,
    openCount,
    createSuggestion,
    reviewSuggestion,
    requestChanges,
    updateSuggestionAfterChanges,
  } = useSuggestions('prompt_kit', kit?.id || '');

  const handleApplySuggestion = async (suggestion: any) => {
    if (!kit) return;
    const updates: any = { content: suggestion.content };
    if (suggestion.title) updates.title = suggestion.title;
    if (suggestion.description) updates.description = suggestion.description;
    const { error } = await (supabase.from('prompt_kits') as any)
      .update(updates)
      .eq('id', kit.id);
    if (error) throw error;
    const { data } = await (supabase.from("prompt_kits") as any)
      .select(`*, profiles:author_id (id, display_name, avatar_url)`)
      .eq("slug", kit.slug)
      .maybeSingle();
    if (data) setKit({ ...data, author: data.profiles || null });
  };

  useEffect(() => {
    async function fetchKit() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await (supabase.from("prompt_kits") as any)
          .select(`*, profiles:author_id (id, display_name, avatar_url)`)
          .eq("slug", slug)
          .maybeSingle();
        if (error || !data) {
          // Try slug redirect
          const { data: redirect } = await (supabase.from("prompt_kit_slug_redirects") as any)
            .select("prompt_kit_id")
            .eq("old_slug", slug)
            .maybeSingle();
          if (redirect?.prompt_kit_id) {
            const { data: kit2 } = await (supabase.from("prompt_kits") as any)
              .select(`*, profiles:author_id (id, display_name, avatar_url), slug`)
              .eq("id", redirect.prompt_kit_id)
              .maybeSingle();
            if (kit2?.slug) {
              navigate(`/prompt-kits/${kit2.slug}`, { replace: true });
              return;
            }
          }
          setNotFound(true);
        } else {
          setKit({ ...data, author: data.profiles || null });
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchKit();
  }, [slug, navigate]);

  const handleCopyAll = async () => {
    if (!kit) return;
    try {
      await navigator.clipboard.writeText(kit.content);
      setCopiedAll(true);
      toast.success("Entire kit copied!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyItem = async (body: string, index: number) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedIdx(index);
      toast.success(`Prompt #${index} copied!`);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const getAuthorInitials = () => {
    if (kit?.author?.display_name) {
      return kit.author.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <Skeleton className="mb-4 h-8 w-48" />
            <Skeleton className="mb-8 h-12 w-3/4" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !kit) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">Prompt Kit Not Found</h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The prompt kit you're looking for doesn't exist or is no longer available.
            </p>
            <Link to="/discover">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Discover
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = parsePromptKitItems(kit.content || "");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-sm gap-1">
                <Package className="h-3 w-3" />
                Prompt Kit
              </Badge>
              <Badge variant="outline" className="text-sm">
                {items.length} {items.length === 1 ? "prompt" : "prompts"}
              </Badge>
              {kit.tags?.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline" className="text-sm gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
              {kit.title}
            </h1>
            {kit.description && (
              <p className="text-lg text-muted-foreground">{kit.description}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-6">
              {kit.author && (
                <Link
                  to={`/u/${encodeURIComponent(kit.author.display_name || "")}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={kit.author.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getAuthorInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      {kit.author.display_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </Link>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {format(new Date(kit.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant={copiedAll ? "success" : "default"}
              onClick={handleCopyAll}
              className="gap-2"
            >
              {copiedAll ? (
                <><Check className="h-4 w-4" />Copied!</>
              ) : (
                <><Copy className="h-4 w-4" />Copy entire kit</>
              )}
            </Button>
            {isAuthor && (
              <Link to={`/prompt-kits/${kit.slug}/edit`}>
                <Button size="lg" variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Kit
                </Button>
              </Link>
            )}
            {isAuthor && (
              <Button size="lg" variant="outline" onClick={() => setHistoryOpen(true)} className="gap-2">
                <History className="h-4 w-4" />
                History
              </Button>
            )}
            {user && !isAuthor && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => cloneKit(
                  { id: kit.id, title: kit.title, description: kit.description, content: kit.content, category: kit.category, tags: kit.tags },
                  user.id
                )}
                disabled={cloning}
                className="gap-2"
              >
                <GitFork className="h-4 w-4" />
                {cloning ? "Cloning..." : "Clone to my library"}
              </Button>
            )}
          {user && hasTeams && (
            <Button size="lg" variant="outline" onClick={() => setCopyTeamOpen(true)} className="gap-2">
              <Users className="h-4 w-4" />
              Copy to team
            </Button>
          )}
          {user && !isAuthor && (
            <Button size="lg" variant="outline" onClick={() => setSuggestOpen(true)} className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Suggest edit
            </Button>
          )}
          {user && (
            <Button
              size="lg"
              variant={isPinned ? "secondary" : "outline"}
              onClick={handleTogglePin}
              disabled={pinning}
              className="gap-2"
            >
              {isPinned ? (
                <><PinOff className="h-4 w-4" />Unpin</>
              ) : (
                <><Pin className="h-4 w-4" />Pin</>
              )}
            </Button>
          )}
          {user && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCollectionOpen(true)}
              className="gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Add to collection
            </Button>
          )}
        </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 p-6">
              <p className="text-muted-foreground">
                This kit doesn't contain any prompts yet (no <code className="font-mono">## Prompt:</code> headings found).
              </p>
              <pre className="mt-4 whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                {kit.content}
              </pre>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.index} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="shrink-0">#{item.index}</Badge>
                      <h3 className="font-semibold text-foreground truncate">
                        {item.title || "Untitled"}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant={copiedIdx === item.index ? "success" : "outline"}
                      onClick={() => handleCopyItem(item.body, item.index)}
                      className="gap-1.5 shrink-0"
                    >
                      {copiedIdx === item.index ? (
                        <><Check className="h-3.5 w-3.5" />Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" />Copy this prompt</>
                      )}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed p-4">
                    {item.body || <span className="text-muted-foreground italic">(empty)</span>}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Ratings & Reviews */}
          <PromptKitReviewSection
            kitId={kit.id}
            kitSlug={kit.slug || undefined}
            userId={user?.id}
            ratingAvg={kit.rating_avg || 0}
            ratingCount={kit.rating_count || 0}
          />

          {/* Tabbed Content Section */}
          <Tabs defaultValue="comments" className="mt-8">
            <TabsList>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Suggestions
                {openCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {openCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <ActivityIcon className="h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-6">
              <CommentsSection itemType="prompt_kit" itemId={kit.id} teamId={(kit as any).team_id} />
            </TabsContent>

            <TabsContent value="suggestions" className="mt-6">
              <SuggestionsTab
                suggestions={suggestions}
                loading={loadingSuggestions}
                itemType="prompt_kit"
                itemId={kit.id}
                originalTitle={kit.title}
                originalDescription={kit.description || ''}
                originalContent={kit.content}
                isOwner={!!isAuthor}
                onReviewSuggestion={reviewSuggestion}
                onRequestChanges={requestChanges}
                onUpdateSuggestion={updateSuggestionAfterChanges}
                onApplySuggestion={handleApplySuggestion}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <ActivitySidebar itemId={kit.id} itemType="prompt_kit" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      <AddToCollectionModal
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
        itemType="prompt_kit"
        itemId={kit.id}
      />

      <SuggestEditModal
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        itemType="prompt_kit"
        currentTitle={kit.title}
        currentDescription={kit.description || ''}
        currentContent={kit.content}
        onSubmit={createSuggestion}
      />

      {isAuthor && (
        <PromptKitVersionHistoryPanel
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          promptKitId={kit.id}
          currentKit={{
            id: kit.id,
            title: kit.title,
            description: kit.description,
            content: kit.content,
            tags: kit.tags,
          }}
        />
      )}

      {user && hasTeams && (
        <CopyPromptKitToTeamModal
          open={copyTeamOpen}
          onOpenChange={setCopyTeamOpen}
          promptKit={{
            id: kit.id,
            title: kit.title,
            description: kit.description,
            content: kit.content,
            category: kit.category,
            tags: kit.tags,
          }}
        />
      )}
    </div>
  );
}
