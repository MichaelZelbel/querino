import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCloneWorkflow } from "@/hooks/useCloneWorkflow";
import { useSimilarWorkflows } from "@/hooks/useSimilarArtefacts";
import { useSuggestions } from "@/hooks/useSuggestions";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Check, ArrowLeft, Pencil, Lock, Calendar, Tag, Files, Workflow as WorkflowIcon, ChevronDown, ExternalLink, FolderPlus, GitPullRequest } from "lucide-react";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { ActivitySidebar } from "@/components/activity/ActivitySidebar";
import { SimilarWorkflowsSection } from "@/components/similar/SimilarArtefactsSection";
import { CommentsSection } from "@/components/comments";
import { AIInsightsPanel } from "@/components/insights";
import { DownloadMarkdownButton } from "@/components/markdown";
import { SuggestEditModal, SuggestionsTab } from "@/components/suggestions";
import { toast } from "sonner";
import type { Workflow, WorkflowAuthor } from "@/types/workflow";
import { format } from "date-fns";

interface WorkflowWithAuthor extends Workflow {
  author?: WorkflowAuthor | null;
}

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { cloneWorkflow, cloning } = useCloneWorkflow();
  const [workflow, setWorkflow] = useState<WorkflowWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const { items: similarWorkflows, loading: loadingSimilar } = useSimilarWorkflows(id);
  const { 
    suggestions, 
    loading: loadingSuggestions, 
    openCount,
    createSuggestion,
    reviewSuggestion,
    requestChanges,
    updateSuggestionAfterChanges
  } = useSuggestions('workflow', id || '');
  const isAuthor = workflow?.author_id && user?.id === workflow.author_id;

  useEffect(() => {
    async function fetchWorkflow() {
      if (!id) {
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
          .eq("id", id)
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
  }, [id]);

  const handleCopy = async () => {
    if (!workflow) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(workflow.json, null, 2));
      setCopied(true);
      toast.success("Workflow JSON copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy workflow");
    }
  };

  const handleApplySuggestion = async (suggestion: any) => {
    if (!workflow) return;
    
    // For workflows, the content is the JSON string - parse it back
    let jsonContent = workflow.json;
    try {
      jsonContent = JSON.parse(suggestion.content);
    } catch {
      // If not valid JSON, wrap it
      jsonContent = { content: suggestion.content };
    }
    
    const updates: any = { json: jsonContent };
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
      .eq("id", id)
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

  // For workflows, the "content" for suggestions is the JSON stringified
  const workflowContent = JSON.stringify(workflow.json, null, 2);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 py-12">
          <div className="container mx-auto max-w-4xl px-4">
          <Link
            to="/discover" 
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>

          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-sm gap-1">
                <WorkflowIcon className="h-3 w-3" />
                Workflow
              </Badge>
              {!workflow.published && isAuthor && (
                <Badge variant="outline" className="gap-1 text-sm">
                  <Lock className="h-3 w-3" />
                  Draft
                </Badge>
              )}
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

          <div className="mb-8">
            <Collapsible open={isJsonOpen} onOpenChange={setIsJsonOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between mb-4">
                  <span className="text-lg font-semibold">Workflow JSON</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isJsonOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="relative rounded-xl border border-border bg-muted/30 p-6 max-h-[500px] overflow-auto">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-foreground leading-relaxed">
                    {workflowContent}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
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
                  Copy JSON
                </>
              )}
            </Button>

            {isAuthor && (
              <Link to={`/workflows/${id}/edit`}>
                <Button size="lg" variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Workflow
                </Button>
              </Link>
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

            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              disabled
              title="Coming soon"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Antigravity
            </Button>

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
