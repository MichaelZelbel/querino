import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Pencil, Package, Star } from "lucide-react";
import { toast } from "sonner";
import type { PromptKit, PromptKitAuthor } from "@/types/promptKit";
import { LanguageBadge } from "@/components/shared/LanguageBadge";
import { countPromptItems } from "@/lib/promptKitParser";

interface PromptKitCardProps {
  kit: PromptKit & { author?: PromptKitAuthor | null };
  showAuthorBadge?: boolean;
  showAuthorInfo?: boolean;
  currentUserId?: string;
  showEditButton?: boolean;
}

export function PromptKitCard({
  kit,
  showAuthorBadge,
  showAuthorInfo = false,
  currentUserId,
  showEditButton = false,
}: PromptKitCardProps) {
  const [copied, setCopied] = useState(false);
  const isAuthor = currentUserId && kit.author_id === currentUserId;
  const detailUrl = `/prompt-kits/${kit.slug}`;
  const promptCount = countPromptItems(kit.content || "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(kit.content);
      setCopied(true);
      toast.success("Prompt kit copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy kit");
    }
  };

  const getAuthorInitials = () => {
    if (kit.author?.display_name) {
      return kit.author.display_name
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
                <Package className="h-4 w-4 text-primary" />
                <h3 className="font-semibold leading-tight text-foreground hover:text-primary transition-colors">
                  {kit.title}
                </h3>
                {showAuthorBadge && isAuthor && (
                  <Badge variant="secondary" className="text-xs">Your kit</Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {promptCount} {promptCount === 1 ? "prompt" : "prompts"}
                </Badge>
                <LanguageBadge language={kit.language} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {kit.description || "No description"}
              </p>
            </div>
          </div>
        </CardHeader>
      </Link>

      <CardContent className="flex-1 pb-3">
        <div className="relative rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
          <div className="line-clamp-3 whitespace-pre-wrap">{kit.content}</div>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" />
        </div>

        {kit.tags && kit.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {kit.tags.slice(0, 3).map((tag) => (
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
            {showAuthorInfo && kit.author && (
              <Link
                to={`/u/${encodeURIComponent(kit.author.display_name || "")}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={kit.author.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {getAuthorInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate max-w-[80px] hover:text-primary transition-colors">
                  {kit.author.display_name || "Anonymous"}
                </span>
              </Link>
            )}
            {kit.rating_count && kit.rating_count > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{Number(kit.rating_avg || 0).toFixed(1)}</span>
                <span className="text-muted-foreground">({kit.rating_count})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No ratings yet</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(isAuthor || showEditButton) && (
              <Link to={`/prompt-kits/${kit.slug}/edit`}>
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
                <><Check className="h-3.5 w-3.5" />Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5" />Copy</>
              )}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
