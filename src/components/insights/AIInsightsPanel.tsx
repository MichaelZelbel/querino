import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, ChevronLeft, RefreshCw, Sparkles, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAICreditsGate } from '@/hooks/useAICreditsGate';

type ItemType = 'prompt' | 'skill' | 'workflow' | 'claw';

interface AIInsightsPanelProps {
  itemType: ItemType;
  itemId: string;
  teamId?: string | null;
}

export function AIInsightsPanel({ itemType, itemId, teamId }: AIInsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { user, profile } = useAuthContext();
  const { insights, loading, generating, error, generateInsights, refreshInsights, hasInsights } = useAIInsights(itemType, itemId);
  const { checkCredits } = useAICreditsGate();

  // Check if user has premium access
  const isPremium = profile?.plan_type === 'premium';

  // Gated generate/refresh functions
  const handleGenerate = () => {
    if (!checkCredits()) return;
    generateInsights();
  };

  const handleRefresh = () => {
    if (!checkCredits()) return;
    refreshInsights();
  };

  // Don't render anything for anonymous users
  if (!user) {
    return null;
  }

  // Collapsed state for free users - show lock icon
  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 rounded-l-lg rounded-r-none border-r-0 z-40"
      >
        <ChevronLeft className="h-4 w-4" />
        {isPremium ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Locked state for free users
  if (!isPremium) {
    return (
      <div className="w-80 border-l bg-card flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">AI Insights</h3>
            <Badge variant="secondary" className="text-xs gap-1">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Locked Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">Premium Feature</h4>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            AI Insights is a Premium feature. Upgrade to unlock advanced summaries & recommendations.
          </p>
          <Link to="/pricing">
            <Button className="gap-2">
              <Crown className="h-4 w-4" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Full access for premium/team users
  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Insights</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={hasInsights ? handleRefresh : handleGenerate}
            disabled={generating}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : !hasInsights ? (
          <div className="p-6 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Generate AI-powered insights for this {itemType}
            </p>
            <Button onClick={handleGenerate} disabled={generating} size="sm">
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
            {error && (
              <p className="text-xs text-destructive mt-3">{error}</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4">
              {insights?.summary ? (
                <div className="text-sm space-y-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-muted-foreground [&_li]:my-1 [&_strong]:text-foreground [&_strong]:font-medium [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
                  <ReactMarkdown>{insights.summary}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No insights available</p>
              )}
            </div>
          </ScrollArea>
        )}

        {generating && hasInsights && (
          <div className="p-4 text-center">
            <RefreshCw className="h-6 w-6 mx-auto animate-spin text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Refreshing insights...</p>
          </div>
        )}
      </div>
    </div>
  );
}
