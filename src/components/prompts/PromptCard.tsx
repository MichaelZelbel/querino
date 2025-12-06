import { Prompt } from "@/types/prompt";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1 text-lg">{prompt.title}</CardTitle>
          <div className="flex items-center text-yellow-500 text-sm font-medium">
            <Star className="w-4 h-4 mr-1 fill-current" />
            {prompt.rating_avg.toFixed(1)} <span className="text-muted-foreground ml-1">({prompt.rating_count})</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{prompt.category}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{prompt.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {prompt.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied" : "Copy Prompt"}
        </Button>
      </CardFooter>
    </Card>
  );
}
