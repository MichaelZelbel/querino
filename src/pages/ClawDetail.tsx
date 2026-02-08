import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCloneClaw } from "@/hooks/useCloneClaw";
import { usePinnedClaws } from "@/hooks/usePinnedClaws";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Copy, Check, ArrowLeft, Pencil, Calendar, Tag, Files, Grab, ChevronDown,
  Pin, PinOff, History, FolderPlus, UsersRound
} from "lucide-react";
import { ClawReviewSection } from "@/components/claws/ClawReviewSection";
import { CopyClawToTeamModal } from "@/components/claws/CopyClawToTeamModal";
import { ClawVersionHistoryPanel } from "@/components/claws/ClawVersionHistoryPanel";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { DownloadMarkdownButton } from "@/components/markdown";
import { AIInsightsPanel } from "@/components/insights";
import { toast } from "sonner";
import type { Claw, ClawAuthor } from "@/types/claw";
import { format } from "date-fns";

interface ClawWithAuthor extends Claw {
  author?: ClawAuthor | null;
}

export default function ClawDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { cloneClaw, cloning } = useCloneClaw();
  const { isClawPinned, togglePin } = usePinnedClaws();
  const { isPremium } = usePremiumCheck();
  const { teams, currentWorkspace } = useWorkspace();
  
  const [claw, setClaw] = useState<ClawWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [isContentOpen, setIsContentOpen] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCopyToTeamModal, setShowCopyToTeamModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  
  const isAuthor = claw?.author_id && user?.id === claw.author_id;
  const isPinned = claw?.id ? isClawPinned(claw.id) : false;
  
  // Premium and team checks for "Copy to team" feature
  const isPersonalWorkspace = currentWorkspace === "personal";
  const hasTeams = teams.length > 0;
  const isPersonalClaw = !claw?.team_id;
  const canCopyToTeam = isAuthor && isPremium && hasTeams && isPersonalWorkspace && isPersonalClaw;

  useEffect(() => {
    async function fetchClaw() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await (supabase.from("claws") as any)
          .select(`*, profiles:author_id (id, display_name, avatar_url)`)
          .eq("slug", slug)
          .maybeSingle();
        if (error || !data) {
          setNotFound(true);
        } else {
          setClaw({ ...data, author: data.profiles || null });
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchClaw();
  }, [slug]);

  const handleCopy = async () => {
    if (!claw?.content && !claw?.skill_md_content) return;
    try {
      const contentToCopy = claw.skill_md_content || claw.content || "";
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast.success("Claw content copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy claw");
    }
  };

  const handleTogglePin = async () => {
    if (!claw?.id) return;
    
    if (!user) {
      navigate(`/auth?redirect=/claws/${claw.slug}`);
      return;
    }

    setPinning(true);
    const { error } = await togglePin(claw.id);
    setPinning(false);

    if (error) {
      toast.error("Failed to update pin");
      return;
    }

    if (isPinned) {
      toast.success("Unpinned");
    } else {
      toast.success("Pinned!");
    }
  };

  const getAuthorInitials = () => {
    if (claw?.author?.display_name) {
      return claw.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  // Get the display content (prefer skill_md_content over legacy content)
  const displayContent = claw?.skill_md_content || claw?.content || "";

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

  if (notFound || !claw) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">Claw Not Found</h1>
            <p className="mb-8 text-lg text-muted-foreground">The claw you're looking for doesn't exist.</p>
            <Link to="/discover"><Button className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Discover</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <Link to="/discover" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />Back to Discover
            </Link>

            <div className="mb-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="text-sm gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Grab className="h-3 w-3" />Claw
                </Badge>
                {claw.tags?.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-sm gap-1"><Tag className="h-3 w-3" />{tag}</Badge>
                ))}
              </div>
              <h1 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">{claw.title}</h1>
              {claw.description && <p className="text-lg text-muted-foreground">{claw.description}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-6">
                {claw.author && (
                  <Link to={`/u/${encodeURIComponent(claw.author.display_name || "")}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={claw.author.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">{getAuthorInitials()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">{claw.author.display_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">Author</p>
                    </div>
                  </Link>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /><span>Created {format(new Date(claw.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>

            <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen} className="mb-8">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between mb-4">
                  <span className="text-lg font-semibold">Claw Definition</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="relative rounded-xl border border-border bg-muted/30 p-6 max-h-[500px] overflow-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">{displayContent}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="mb-8 flex flex-wrap gap-3">
              <Button size="lg" variant={copied ? "success" : "default"} onClick={handleCopy} className="gap-2 bg-amber-500 hover:bg-amber-600">
                {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Content</>}
              </Button>
              
              {/* Pin Button */}
              {user && (
                <Button
                  size="lg"
                  variant={isPinned ? "secondary" : "outline"}
                  onClick={handleTogglePin}
                  disabled={pinning}
                  className="gap-2"
                >
                  {isPinned ? (
                    <>
                      <PinOff className="h-4 w-4" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" />
                      Pin
                    </>
                  )}
                </Button>
              )}
              
              {isAuthor && (
                <>
                  <Link to={`/claws/${claw.slug}/edit`}>
                    <Button size="lg" variant="outline" className="gap-2">
                      <Pencil className="h-4 w-4" />Edit Claw
                    </Button>
                  </Link>
                  
                  {/* Version History Button */}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowVersionHistory(true)}
                    className="gap-2"
                  >
                    <History className="h-4 w-4" />
                    Version History
                  </Button>
                  
                  {/* Copy to team - only for personal claws owned by premium users with teams */}
                  {canCopyToTeam && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setShowCopyToTeamModal(true)}
                      className="gap-2"
                    >
                      <UsersRound className="h-4 w-4" />
                      Copy to team…
                    </Button>
                  )}
                </>
              )}
              
              {user && !isAuthor && (
                <Button size="lg" variant="outline" onClick={() => cloneClaw(claw, user.id)} disabled={cloning} className="gap-2">
                  <Files className="h-4 w-4" />{cloning ? "Cloning..." : "Clone Claw"}
                </Button>
              )}
              
              {/* Add to Collection Button */}
              {user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowCollectionModal(true)}
                  className="gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  Add to Collection
                </Button>
              )}
              
              <DownloadMarkdownButton
                title={claw.title}
                type="claw"
                description={claw.description}
                tags={claw.tags}
                content={displayContent}
                size="lg"
                variant="outline"
              />
            </div>

            {/* Modals */}
            <AddToCollectionModal
              open={showCollectionModal}
              onOpenChange={setShowCollectionModal}
              itemType="claw"
              itemId={claw.id}
            />

            {isAuthor && (
              <>
                <ClawVersionHistoryPanel
                  open={showVersionHistory}
                  onOpenChange={setShowVersionHistory}
                  clawId={claw.id}
                  clawTitle={claw.title}
                />

                {canCopyToTeam && (
                  <CopyClawToTeamModal
                    open={showCopyToTeamModal}
                    onOpenChange={setShowCopyToTeamModal}
                    claw={claw}
                  />
                )}
              </>
            )}

            <ClawReviewSection clawId={claw.id} authorId={claw.author_id || undefined} />
          </div>
        </main>

        {/* AI Insights Panel */}
        <AIInsightsPanel 
          itemType="claw" 
          itemId={claw.id} 
          teamId={(claw as any).team_id} 
        />
      </div>
      <Footer />
    </div>
  );
}
