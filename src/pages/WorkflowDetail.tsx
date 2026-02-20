import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCloneWorkflow } from "@/hooks/useCloneWorkflow";
import { useSimilarWorkflows } from "@/hooks/useSimilarArtefacts";
import { useSuggestions } from "@/hooks/useSuggestions";
import { usePremiumCheck } from "@/components/premium/usePremiumCheck";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Check, ArrowLeft, Pencil, Calendar, Tag, Files, Workflow as WorkflowIcon, ChevronDown, FolderPlus, GitPullRequest, FileText, UsersRound } from "lucide-react";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { ActivitySidebar } from "@/components/activity/ActivitySidebar";
import { SimilarWorkflowsSection } from "@/components/similar/SimilarArtefactsSection";
import { CommentsSection } from "@/components/comments";
import { AIInsightsPanel } from "@/components/insights";
import { DownloadMarkdownButton } from "@/components/markdown";
import { SuggestEditModal, SuggestionsTab } from "@/components/suggestions";
import { WorkflowReviewSection } from "@/components/workflows/WorkflowReviewSection";
import { CopyWorkflowToTeamModal } from "@/components/workflows/CopyWorkflowToTeamModal";
import { toast } from "sonner";
import type { Workflow, WorkflowAuthor } from "@/types/workflow";
import { format } from "date-fns";

interface WorkflowWithAuthor extends Workflow {
  author?: WorkflowAuthor | null;
}

export default function WorkflowDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { cloneWorkflow, cloning } = useCloneWorkflow();
  const [workflow, setWorkflow] = useState<WorkflowWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isContentOpen, setIsContentOpen] = useState(true);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showCopyToTeamModal, setShowCopyToTeamModal] = useState(false);
  const { items: similarWorkflows, loading: loadingSimilar } = useSimilarWorkflows(workflow?.id);
  const { 
    suggestions, 
    loading: loadingSuggestions, 
    openCount,
    createSuggestion,
    reviewSuggestion,
    requestChanges,
    updateSuggestionAfterChanges
  } = useSuggestions('workflow', workflow?.id || '');
  const isAuthor = workflow?.author_id && user?.id === workflow.author_id;

  // Premium and team checks for "Copy to team" feature
  const { isPremium } = usePremiumCheck();
  const { teams, currentWorkspace } = useWorkspace();
  const isPersonalWorkspace = currentWorkspace === "personal";
  const hasTeams = teams.length > 0;
  // Show "Copy to team" only for personal workflows the user owns (no team_id)
  const isPersonalWorkflow = !(workflow as any)?.team_id;
  const canCopyToTeam = isAuthor && isPremium && hasTeams && isPersonalWorkspace && isPersonalWorkflow;

  useEffect(() => {
    async function fetchWorkflow() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase
          .from("workflows") as any)
          .select(`
            *,
            profiles:author_id (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          console.error("Error fetching workflow:", error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else {
          const workflowData: WorkflowWithAuthor = {
            ...data,
            author: data.profiles || null,
          };
          setWorkflow(workflowData);
        }
      } catch (err) {
        console.error("Error fetching workflow:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflow();
  }, [slug]);

  // Get workflow content - use new content field, or fall back to json for legacy
  const getWorkflowContent = (): string => {
    if (!workflow) return "";
    if (workflow.content) return workflow.content;
    // Legacy fallback: stringify JSON
    if (workflow.json) {
      return typeof workflow.json === 'string' ? workflow.json : JSON.stringify(workflow.json, null, 2);
    }
    return "";
  };

  const workflowContent = getWorkflowContent();

  const handleCopy = async () => {
    if (!workflow) return;
    
    try {
      await navigator.clipboard.writeText(workflowContent);
      setCopied(true);
      toast.success("Workflow content copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy workflow");
    }
  };

  const handleApplySuggestion = async (suggestion: any) => {
    if (!workflow) return;
    
    const updates: any = { content: suggestion.content };
    if (suggestion.title) updates.title = suggestion.title;
    if (suggestion.description) updates.description = suggestion.description;
    
    const { error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', workflow.id);
    
    if (error) throw error;
    
    const { data } = await (supabase
      .from("workflows") as any)
      .select(`*, profiles:author_id (id, display_name, avatar_url)`)
      .eq("slug", slug)
      .maybeSingle();
    
    if (data) {
      setWorkflow({ ...data, author: data.profiles || null });
    }
  };

  const getAuthorInitials = () => {
    if (workflow?.author?.display_name) {
      return workflow.author.display_name
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

  if (notFound || !workflow) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Workflow Not Found
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The workflow you're looking for doesn't exist or is no longer available.
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
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
                <WorkflowIcon className="h-3 w-3" />
                Workflow
              </Badge>
              {workflow.tags && workflow.tags.length > 0 && (
                <>
                  {workflow.tags.slice(0, 5).map((tag) => (
                    <Badge 
                      key={tag}
                      variant="outline" 
                      className="text-sm gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </>
              )}
            </div>
            
            <h1 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
              {workflow.title}
            </h1>
            
            {workflow.description && (
              <p className="text-lg text-muted-foreground">
                {workflow.description}
              </p>
            )}

            {/* Filename display */}
            {workflow.filename && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <code className="font-mono bg-muted px-2 py-0.5 rounded">{workflow.filename}</code>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-6">
              {workflow.author && (
                <Link 
                  to={`/u/${encodeURIComponent(workflow.author.display_name || "")}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={workflow.author.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getAuthorInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      {workflow.author.display_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </Link>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {format(new Date(workflow.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Action Bar - above content */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant={copied ? "success" : "default"}
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Content
                </>
              )}
            </Button>

            {isAuthor && (
              <>
                <Link to={`/workflows/${workflow.slug}/edit`}>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit Workflow
                  </Button>
                </Link>
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
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => cloneWorkflow(workflow, user.id)}
                  disabled={cloning}
                  className="gap-2"
                >
                  <Files className="h-4 w-4" />
                  {cloning ? "Cloning..." : "Clone Workflow"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowSuggestModal(true)}
                  className="gap-2"
                >
                  <GitPullRequest className="h-4 w-4" />
                  Suggest Edit
                </Button>
              </>
            )}

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
              title={workflow.title}
              type="workflow"
              description={workflow.description}
              tags={workflow.tags}
              content={workflowContent}
            />
          </div>

          {/* Workflow Content */}
          <div className="mb-8">
            <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between mb-4">
                  <span className="text-lg font-semibold">Workflow Content</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="relative rounded-xl border border-border bg-muted/30 p-6 max-h-[500px] overflow-auto">
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                    {workflowContent}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Modals */}
          <AddToCollectionModal
            open={showCollectionModal}
            onOpenChange={setShowCollectionModal}
            itemType="workflow"
            itemId={workflow.id}
          />

          <SuggestEditModal
            open={showSuggestModal}
            onOpenChange={setShowSuggestModal}
            itemType="workflow"
            currentTitle={workflow.title}
            currentDescription={workflow.description || ''}
            currentContent={workflowContent}
            onSubmit={createSuggestion}
          />

          {canCopyToTeam && (
            <CopyWorkflowToTeamModal
              open={showCopyToTeamModal}
              onOpenChange={setShowCopyToTeamModal}
              workflow={workflow}
            />
          )}

          {/* Ratings & Reviews Section */}
          <WorkflowReviewSection
            workflowId={workflow.id}
            workflowSlug={workflow.slug || undefined}
            userId={user?.id}
            ratingAvg={workflow.rating_avg || 0}
            ratingCount={workflow.rating_count || 0}
          />

          {/* Tabbed Content Section */}
          <Tabs defaultValue="details" className="mt-8">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2">
                Suggestions
                {openCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {openCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <SimilarWorkflowsSection items={similarWorkflows} loading={loadingSimilar} />
              <div className="mt-8">
                <ActivitySidebar itemId={workflow.id} itemType="workflow" />
              </div>
            </TabsContent>
            
            <TabsContent value="comments" className="mt-6">
              <CommentsSection itemType="workflow" itemId={workflow.id} teamId={(workflow as any).team_id} />
            </TabsContent>
            
            <TabsContent value="suggestions" className="mt-6">
              <SuggestionsTab
                suggestions={suggestions}
                loading={loadingSuggestions}
                itemType="workflow"
                itemId={workflow.id}
                originalTitle={workflow.title}
                originalDescription={workflow.description || ''}
                originalContent={workflowContent}
                isOwner={!!isAuthor}
                onReviewSuggestion={reviewSuggestion}
                onRequestChanges={requestChanges}
                onUpdateSuggestion={updateSuggestionAfterChanges}
                onApplySuggestion={handleApplySuggestion}
              />
            </TabsContent>
          </Tabs>
        </div>
        </main>

        {/* AI Insights Panel */}
        <AIInsightsPanel 
          itemType="workflow" 
          itemId={workflow.id} 
          teamId={(workflow as any).team_id} 
        />
      </div>
      <Footer />
    </div>
  );
}
