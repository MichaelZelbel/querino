import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Pencil, Files, Grab, Pin, Star } from "lucide-react";
import { useCloneClaw } from "@/hooks/useCloneClaw";
import { toast } from "sonner";
import type { Claw, ClawAuthor } from "@/types/claw";
import { LanguageBadge } from "@/components/shared/LanguageBadge";

interface ClawCardProps {
  claw: Claw & { author?: ClawAuthor | null };
  showAuthorBadge?: boolean;
  showAuthorInfo?: boolean;
  currentUserId?: string;
  showEditButton?: boolean;
  isPinned?: boolean;
}

export function ClawCard({
  claw,
  showAuthorBadge,
  showAuthorInfo = false,
  currentUserId,
  showEditButton = false,
  isPinned = false,
}: ClawCardProps) {
  const [copied, setCopied] = useState(false);
  const { cloneClaw, cloning } = useCloneClaw();
  const isAuthor = currentUserId && claw.author_id === currentUserId;
  const detailUrl = `/claws/${claw.slug}`;

  const clawContent = claw.content || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clawContent);
      setCopied(true);
      toast.success("Claw content copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy claw");
    }
  };

  const getAuthorInitials = () => {
    if (claw.author?.display_name) {
      return claw.author.display_name
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
                <Grab className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold leading-tight text-foreground hover:text-primary transition-colors">
                  {claw.title}
                </h3>
                {showAuthorBadge && isAuthor && (
                  <Badge variant="secondary" className="text-xs">
                    Your claw
                  </Badge>
                )}
                <LanguageBadge language={claw.language} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {claw.description || "A callable capability for Clawbot."}
              </p>
            </div>
          </div>
        </CardHeader>
      </Link>

      <CardContent className="flex-1 pb-3">
        <div className="relative rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
          <div className="line-clamp-3 whitespace-pre-wrap">
            {clawContent.slice(0, 200)}{clawContent.length > 200 ? "..." : ""}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" />
        </div>

        {claw.tags && claw.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {claw.tags.slice(0, 3).map((tag) => (
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
            {showAuthorInfo && claw.author && (
              <Link 
                to={`/u/${encodeURIComponent(claw.author.display_name || "")}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={claw.author.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {getAuthorInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate max-w-[80px] hover:text-primary transition-colors">
                  {claw.author.display_name || "Anonymous"}
                </span>
              </Link>
            )}
            
            {/* Rating */}
            {claw.rating_count && claw.rating_count > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{Number(claw.rating_avg || 0).toFixed(1)}</span>
                <span className="text-muted-foreground">({claw.rating_count})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No ratings yet</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(isAuthor || showEditButton) && (
              <Link to={`/claws/${claw.slug}/edit`}>
                <Button size="sm" variant="ghost" className="gap-1.5 h-8 px-2">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            {currentUserId && !isAuthor && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => cloneClaw(claw, currentUserId)}
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
