import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, RefreshCw, Sparkles, Tag, Lightbulb, BarChart3, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useAuthContext } from '@/contexts/AuthContext';

type ItemType = 'prompt' | 'skill' | 'workflow';

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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'B': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'C': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'D': return 'bg-red-500/20 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner':
      case 'Low': return 'bg-green-500/20 text-green-600';
      case 'Intermediate':
      case 'Medium': return 'bg-yellow-500/20 text-yellow-600';
      case 'Expert':
      case 'High': return 'bg-red-500/20 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="summary"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="tags"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
              >
                <Tag className="h-3 w-3 mr-1" />
                Tags
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Tips
              </TabsTrigger>
              <TabsTrigger
                value="quality"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-xs"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Quality
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="p-4 m-0">
              {insights?.summary ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insights.summary}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No summary available</p>
              )}
            </TabsContent>

            <TabsContent value="tags" className="p-4 m-0">
              {insights?.tags && insights.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {insights.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No tags suggested</p>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="p-4 m-0">
              {insights?.recommendations && insights.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {insights.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No recommendations available</p>
              )}
            </TabsContent>

            <TabsContent value="quality" className="p-4 m-0 space-y-4">
              {insights?.quality ? (
                <>
                  {/* Grade */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Readability</span>
                    <Badge className={cn("text-lg font-bold px-3", getGradeColor(insights.quality.readability))}>
                      {insights.quality.readability}
                    </Badge>
                  </div>

                  {/* Complexity */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Complexity</span>
                    <Badge className={getComplexityColor(insights.quality.complexity)}>
                      {insights.quality.complexity}
                    </Badge>
                  </div>

                  {/* LLM Complexity */}
                  {insights.quality.llmComplexity && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">LLM Complexity</span>
                      <Badge className={getComplexityColor(insights.quality.llmComplexity)}>
                        {insights.quality.llmComplexity}
                      </Badge>
                    </div>
                  )}

                  {/* Strengths */}
                  {insights.quality.strengths && insights.quality.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-green-600">Strengths</h4>
                      <ul className="space-y-1">
                        {insights.quality.strengths.map((strength, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-green-500">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {insights.quality.weaknesses && insights.quality.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600">Areas to Improve</h4>
                      <ul className="space-y-1">
                        {insights.quality.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-red-500">•</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">No quality insights available</p>
              )}
            </TabsContent>
          </Tabs>
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
