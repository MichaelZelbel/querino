import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles } from "lucide-react";
import { useEmbeddings, EmbeddingItemType } from "@/hooks/useEmbeddings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RefreshEmbeddingButtonProps {
  itemType: EmbeddingItemType;
  itemId: string;
  text: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function RefreshEmbeddingButton({
  itemType,
  itemId,
  text,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: RefreshEmbeddingButtonProps) {
  const { refreshEmbedding, isGenerating } = useEmbeddings();

  const handleClick = async () => {
    await refreshEmbedding(itemType, itemId, text);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {showLabel && (
              <span className="ml-1.5">
                {isGenerating ? "Generating..." : "Refresh Embedding"}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Generate AI embedding for better semantic search results
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
