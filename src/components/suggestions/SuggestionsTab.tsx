import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Eye, GitPullRequest } from 'lucide-react';
import { format } from 'date-fns';
import { SuggestionWithAuthor, SuggestionItemType } from '@/types/suggestion';
import { SuggestionReviewModal } from './SuggestionReviewModal';
import { CommentsSection } from '@/components/comments/CommentsSection';

interface SuggestionsTabProps {
  suggestions: SuggestionWithAuthor[];
  loading: boolean;
  itemType: SuggestionItemType;
  itemId: string;
  originalTitle: string;
  originalDescription: string;
  originalContent: string;
  isOwner: boolean;
  onReviewSuggestion: (
    suggestionId: string,
    status: 'accepted' | 'rejected',
    reviewComment?: string
  ) => Promise<void>;
  onApplySuggestion: (suggestion: SuggestionWithAuthor) => Promise<void>;
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20'
};

export function SuggestionsTab({
  suggestions,
  loading,
  itemType,
  itemId,
  originalTitle,
  originalDescription,
  originalContent,
  isOwner,
  onReviewSuggestion,
  onApplySuggestion
}: SuggestionsTabProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionWithAuthor | null>(null);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <GitPullRequest className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No suggestions yet</h3>
        <p className="text-muted-foreground">
          Be the first to suggest improvements to this {itemType}.
        </p>
      </div>
    );
  }

  const handleAccept = async (reviewComment?: string) => {
    if (!selectedSuggestion) return;
    await onApplySuggestion(selectedSuggestion);
    await onReviewSuggestion(selectedSuggestion.id, 'accepted', reviewComment);
  };

  const handleReject = async (reviewComment?: string) => {
    if (!selectedSuggestion) return;
    await onReviewSuggestion(selectedSuggestion.id, 'rejected', reviewComment);
  };

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={suggestion.author?.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {suggestion.author?.display_name || 'Anonymous'}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {format(new Date(suggestion.created_at), 'MMM d, yyyy')}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusColors[suggestion.status]}
                    >
                      {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {suggestion.title && suggestion.title !== originalTitle && (
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Title: </span>
                      <span className="font-medium">{suggestion.title}</span>
                    </p>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {suggestion.content.slice(0, 200)}
                    {suggestion.content.length > 200 && '...'}
                  </p>

                  {suggestion.status !== 'open' && suggestion.review_comment && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <span className="font-medium">
                        {suggestion.reviewer?.display_name || 'Reviewer'}:
                      </span>{' '}
                      {suggestion.review_comment}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && suggestion.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    Review
                  </Button>
                )}
                {!isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}
              </div>
            </div>

            {/* Comments toggle */}
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedComments(
                  expandedComments === suggestion.id ? null : suggestion.id
                )}
              >
                {expandedComments === suggestion.id ? 'Hide' : 'Show'} Comments
              </Button>
              
              {expandedComments === suggestion.id && (
                <div className="mt-3">
                  <CommentsSection
                    itemType="suggestion"
                    itemId={suggestion.id}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedSuggestion && (
        <SuggestionReviewModal
          open={!!selectedSuggestion}
          onOpenChange={(open) => !open && setSelectedSuggestion(null)}
          suggestion={selectedSuggestion}
          originalTitle={originalTitle}
          originalDescription={originalDescription}
          originalContent={originalContent}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
