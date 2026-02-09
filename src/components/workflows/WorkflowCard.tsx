import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Pencil, Files, Workflow as WorkflowIcon, Pin, Star } from "lucide-react";
import { useCloneWorkflow } from "@/hooks/useCloneWorkflow";
import { toast } from "sonner";
import type { Workflow, WorkflowAuthor } from "@/types/workflow";
import { LanguageBadge } from "@/components/shared/LanguageBadge";

interface WorkflowCardProps {
  workflow: Workflow & { author?: WorkflowAuthor | null };
  showAuthorBadge?: boolean;
  showAuthorInfo?: boolean;
  currentUserId?: string;
  showEditButton?: boolean;
  isPinned?: boolean;
}

export function WorkflowCard({
  workflow,
  showAuthorBadge,
  showAuthorInfo = false,
  currentUserId,
  showEditButton = false,
  isPinned = false,
}: WorkflowCardProps) {
  const [copied, setCopied] = useState(false);
  const { cloneWorkflow, cloning } = useCloneWorkflow();
  const isAuthor = currentUserId && workflow.author_id === currentUserId;
  const detailUrl = `/workflows/${workflow.slug}`;

  // Get workflow content - use new content field, or fall back to json for legacy
  const getWorkflowContent = (): string => {
    if (workflow.content) return workflow.content;
    // Legacy fallback: stringify JSON
    if (workflow.json) {
      return typeof workflow.json === 'string' ? workflow.json : JSON.stringify(workflow.json, null, 2);
    }
    return "";
  };

  const workflowContent = getWorkflowContent();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workflowContent);
      setCopied(true);
      toast.success("Workflow content copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy workflow");
    }
  };

  const getAuthorInitials = () => {
    if (workflow.author?.display_name) {
      return workflow.author.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  return (
    <Card variant="prompt" className="flex h-full flex-col">
      <Link to={detailUrl} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isPinned && (
                  <Pin className="h-3.5 w-3.5 text-warning fill-warning" />
                )}
                <WorkflowIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold leading-tight text-foreground hover:text-primary transition-colors">
                  {workflow.title}
                </h3>
                {showAuthorBadge && isAuthor && (
                  <Badge variant="secondary" className="text-xs">
                    Your workflow
                  </Badge>
                )}
                <LanguageBadge language={workflow.language} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {workflow.description || "No description"}
              </p>
            </div>
          </div>
        </CardHeader>
      </Link>

      <CardContent className="flex-1 pb-3">
        <div className="relative rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
          <div className="line-clamp-3 whitespace-pre-wrap">
            {workflowContent.slice(0, 200)}...
          </div>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" />
        </div>

        {workflow.tags && workflow.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {workflow.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/50 pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {showAuthorInfo && workflow.author && (
              <Link 
                to={`/u/${encodeURIComponent(workflow.author.display_name || "")}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={workflow.author.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {getAuthorInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate max-w-[80px] hover:text-primary transition-colors">
                  {workflow.author.display_name || "Anonymous"}
                </span>
              </Link>
            )}
            
            {/* Rating */}
            {workflow.rating_count && workflow.rating_count > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{Number(workflow.rating_avg || 0).toFixed(1)}</span>
                <span className="text-muted-foreground">({workflow.rating_count})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No ratings yet</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(isAuthor || showEditButton) && (
              <Link to={`/workflows/${workflow.slug}/edit`}>
                <Button size="sm" variant="ghost" className="gap-1.5 h-8 px-2">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            {currentUserId && !isAuthor && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => cloneWorkflow(workflow, currentUserId)}
                disabled={cloning}
                className="gap-1.5 h-8 px-2"
                title="Clone to my library"
              >
                <Files className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant={copied ? "success" : "default"}
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
