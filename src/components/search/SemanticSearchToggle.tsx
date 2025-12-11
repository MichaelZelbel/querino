import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SemanticSearchToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function SemanticSearchToggle({
  enabled,
  onToggle,
  disabled = false,
}: SemanticSearchToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Switch
              id="semantic-search"
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={disabled}
            />
            <Label
              htmlFor="semantic-search"
              className="flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Semantic</span>
            </Label>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-xs">
            Semantic search finds conceptually similar artefacts, even if exact words differ.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
