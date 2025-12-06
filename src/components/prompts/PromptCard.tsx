import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Star } from "lucide-react";
import { toast } from "sonner";
import type { Prompt } from "@/data/mockPrompts";

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <h3 className="font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
              {prompt.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {prompt.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="relative rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
          <div className="line-clamp-3 whitespace-pre-wrap">
            {prompt.content}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {prompt.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium">{prompt.rating}</span>
          </div>
          <span className="text-border">•</span>
          <span>{prompt.copies.toLocaleString()} copies</span>
        </div>

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
      </CardFooter>
    </Card>
  );
}
