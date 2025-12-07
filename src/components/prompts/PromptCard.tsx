import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Star, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Prompt } from "@/types/prompt";

interface PromptCardProps {
  prompt: Prompt;
  showAuthorBadge?: boolean;
  currentUserId?: string;
}

export function PromptCard({ prompt, showAuthorBadge, currentUserId }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const isAuthor = currentUserId && prompt.author_id === currentUserId;

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

  return (
    <Card variant="prompt" className="flex h-full flex-col">
      <Link to={`/prompts/${prompt.id}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
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
                {prompt.short_description}
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

      <CardFooter className="flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium">{Number(prompt.rating_avg).toFixed(1)}</span>
          </div>
          <span className="text-border">•</span>
          <span>{prompt.copies_count.toLocaleString()} copies</span>
        </div>

        <div className="flex items-center gap-2">
          {isAuthor && (
            <Link to={`/prompts/${prompt.id}/edit`}>
              <Button size="sm" variant="ghost" className="gap-1.5 h-8 px-2">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
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
      </CardFooter>
    </Card>
  );
}