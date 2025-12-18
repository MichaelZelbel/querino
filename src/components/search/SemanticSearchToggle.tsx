import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Lock, Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthContext } from "@/contexts/AuthContext";
import { UpsellModal } from "@/components/premium";
import { Badge } from "@/components/ui/badge";

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
  const { user, profile } = useAuthContext();
  const [showUpsell, setShowUpsell] = useState(false);

  const isPremium = profile?.plan_type === 'premium' || profile?.plan_type === 'team';
  const isFreeUser = user && !isPremium;

  const handleToggle = (checked: boolean) => {
    if (isFreeUser && checked) {
      setShowUpsell(true);
      return;
    }
    onToggle(checked);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch
                id="semantic-search"
                checked={isPremium ? enabled : false}
                onCheckedChange={handleToggle}
                disabled={disabled}
              />
              <Label
                htmlFor="semantic-search"
                className="flex items-center gap-1.5 text-sm cursor-pointer"
              >
                {isFreeUser ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="text-muted-foreground">Semantic</span>
                {isFreeUser && (
                  <Badge variant="secondary" className="h-4 px-1 text-[9px] gap-0.5 bg-primary/10 text-primary border-0">
                    <Crown className="h-2 w-2" />
                    Pro
                  </Badge>
                )}
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs">
              {isFreeUser 
                ? "Semantic search is a Premium feature. Upgrade to find conceptually similar artefacts."
                : "Semantic search finds conceptually similar artefacts, even if exact words differ."
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpsellModal
        open={showUpsell}
        onOpenChange={setShowUpsell}
        feature="Semantic Search"
      />
    </>
  );
}
