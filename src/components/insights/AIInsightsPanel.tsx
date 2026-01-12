import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, RefreshCw, Sparkles, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useAuthContext } from '@/contexts/AuthContext';

type ItemType = 'prompt' | 'skill' | 'workflow';

// Simple markdown to HTML parser
function parseMarkdown(markdown: string): string {
  return markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>')
    // Wrap consecutive <li> elements in <ul>
    .replace(/(<li>.*<\/li>)(\s*<li>)/g, '$1$2')
    .replace(/(<li>.*<\/li>)/gs, (match) => {
      // Check if it's already inside a ul
      return `<ul>${match}</ul>`;
    })
    // Clean up nested ul tags
    .replace(/<\/ul>\s*<ul>/g, '')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    // Wrap in paragraphs
    .replace(/^(?!<[hup]|<li|<pre|<ul|<ol)(.+)$/gim, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br\/><\/p>/g, '');
}

interface AIInsightsPanelProps {
  itemType: ItemType;
  itemId: string;
  teamId?: string | null;
}

export function AIInsightsPanel({ itemType, itemId, teamId }: AIInsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { user, profile } = useAuthContext();
  const { insights, loading, generating, error, generateInsights, refreshInsights, hasInsights } = useAIInsights(itemType, itemId);

  // Check if user has premium access
  const isPremium = profile?.plan_type === 'premium' || profile?.plan_type === 'team';

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
            onClick={hasInsights ? refreshInsights : generateInsights}
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
            <Button onClick={generateInsights} disabled={generating} size="sm">
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
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                    prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                    prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2
                    prose-ul:my-2 prose-ul:text-muted-foreground
                    prose-ol:my-2 prose-ol:text-muted-foreground
                    prose-li:my-0.5
                    prose-strong:text-foreground prose-strong:font-medium
                    prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-muted prose-pre:text-foreground
                    [&_hr]:my-4 [&_hr]:border-border"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(insights.summary) }}
                />
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
