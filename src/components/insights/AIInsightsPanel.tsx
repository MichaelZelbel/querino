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
  // Split into lines to handle block-level elements properly
  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Escape HTML entities first (but preserve structure)
    line = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Headers (must be at start of line)
    if (line.match(/^### /)) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h3>${line.slice(4)}</h3>`);
      continue;
    }
    if (line.match(/^## /)) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h2>${line.slice(3)}</h2>`);
      continue;
    }
    if (line.match(/^# /)) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h1>${line.slice(2)}</h1>`);
      continue;
    }
    
    // List items
    if (line.match(/^\s*[-*]\s+/)) {
      if (!inList) { htmlLines.push('<ul>'); inList = true; }
      const content = line.replace(/^\s*[-*]\s+/, '');
      htmlLines.push(`<li>${formatInline(content)}</li>`);
      continue;
    }
    
    // Numbered list items
    if (line.match(/^\s*\d+\.\s+/)) {
      if (!inList) { htmlLines.push('<ul>'); inList = true; }
      const content = line.replace(/^\s*\d+\.\s+/, '');
      htmlLines.push(`<li>${formatInline(content)}</li>`);
      continue;
    }
    
    // Close list if we hit a non-list line
    if (inList && line.trim() !== '') {
      htmlLines.push('</ul>');
      inList = false;
    }
    
    // Empty lines
    if (line.trim() === '') {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      continue;
    }
    
    // Regular paragraph
    htmlLines.push(`<p>${formatInline(line)}</p>`);
  }
  
  // Close any open list
  if (inList) htmlLines.push('</ul>');
  
  return htmlLines.join('');
}

// Format inline elements (bold, italic, code)
function formatInline(text: string): string {
  return text
    // Bold and italic combined
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>');
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
