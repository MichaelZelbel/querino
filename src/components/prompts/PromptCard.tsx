import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Star, Pencil, Files } from "lucide-react";
import { SendToLLMButtons } from "@/components/prompts/SendToLLMButtons";
import { useClonePrompt } from "@/hooks/useClonePrompt";
import { toast } from "sonner";
import type { Prompt, PromptAuthor } from "@/types/prompt";

interface PromptCardProps {
  prompt: Prompt & { author?: PromptAuthor | null };
  showAuthorBadge?: boolean;
  showAuthorInfo?: boolean;
  currentUserId?: string;
  editPath?: "library" | "prompts";
  userRating?: number;
  showSendToLLM?: boolean;
}

export function PromptCard({ 
  prompt, 
  showAuthorBadge, 
  showAuthorInfo = false,
  currentUserId, 
  editPath = "prompts",
  userRating,
  showSendToLLM = false,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const { clonePrompt, cloning } = useClonePrompt();
  const isAuthor = currentUserId && prompt.author_id === currentUserId;
  const editUrl = editPath === "library" ? `/library/${prompt.id}/edit` : `/prompts/${prompt.id}/edit`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy prompt");
    }
  };

  const getAuthorInitials = () => {
    if (prompt.author?.display_name) {
      return prompt.author.display_name
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
      <Link to={`/prompts/${prompt.id}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold leading-tight text-foreground hover:text-primary transition-colors">
                  {prompt.title}
                </h3>
                {showAuthorBadge && isAuthor && (
                  <Badge variant="secondary" className="text-xs">
                    Your prompt
                  </Badge>
                )}
                {!prompt.is_public && (
                  <Badge variant="outline" className="text-xs">
                    Private
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {prompt.summary || prompt.short_description}
              </p>
            </div>
          </div>
        </CardHeader>
      </Link>

      <CardContent className="flex-1 pb-3">
        <div className="relative rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
          <div className="line-clamp-3 whitespace-pre-wrap">
            {prompt.content}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" />
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {prompt.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/50 pt-4">
        {/* User's own rating (if present and not author) */}
        {userRating && !isAuthor && (
          <Link to={`/prompts/${prompt.id}`} className="w-full">
            <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <span>Your rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= userRating
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </Link>
        )}
        
        <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {/* Author Info */}
          {showAuthorInfo && prompt.author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={prompt.author.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-muted">
                  {getAuthorInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate max-w-[80px]">
                {prompt.author.display_name || "Anonymous"}
              </span>
            </div>
          )}
          
          {/* Rating */}
          {prompt.rating_count > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="font-medium">{Number(prompt.rating_avg).toFixed(1)}</span>
              <span className="text-muted-foreground">({prompt.rating_count})</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No ratings yet</span>
          )}
          
          {!showAuthorInfo && prompt.rating_count > 0 && (
            <>
              <span className="text-border">•</span>
              <span>{prompt.copies_count.toLocaleString()} copies</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isAuthor && (
            <Link to={editUrl}>
              <Button size="sm" variant="ghost" className="gap-1.5 h-8 px-2">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          {currentUserId && !isAuthor && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clonePrompt(prompt, currentUserId)}
              disabled={cloning}
              className="gap-1.5 h-8 px-2"
              title="Clone to my library"
            >
              <Files className="h-3.5 w-3.5" />
            </Button>
          )}
          {showSendToLLM && (
            <SendToLLMButtons
              title={prompt.title}
              content={prompt.content}
              variant="compact"
            />
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