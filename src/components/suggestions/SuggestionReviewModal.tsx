import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { SuggestionWithAuthor } from '@/types/suggestion';
import { format } from 'date-fns';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

function computeSimpleDiff(original: string, suggested: string): { left: DiffLine[]; right: DiffLine[] } {
  const originalLines = original.split('\n');
  const suggestedLines = suggested.split('\n');
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  const maxLines = Math.max(originalLines.length, suggestedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] ?? '';
    const suggLine = suggestedLines[i] ?? '';

    if (i >= originalLines.length) {
      left.push({ type: 'unchanged', content: '', lineNumber: i + 1 });
      right.push({ type: 'added', content: suggLine, lineNumber: i + 1 });
    } else if (i >= suggestedLines.length) {
      left.push({ type: 'removed', content: origLine, lineNumber: i + 1 });
      right.push({ type: 'unchanged', content: '', lineNumber: i + 1 });
    } else if (origLine !== suggLine) {
      left.push({ type: 'removed', content: origLine, lineNumber: i + 1 });
      right.push({ type: 'added', content: suggLine, lineNumber: i + 1 });
    } else {
      left.push({ type: 'unchanged', content: origLine, lineNumber: i + 1 });
      right.push({ type: 'unchanged', content: suggLine, lineNumber: i + 1 });
    }
  }

  return { left, right };
}

interface SuggestionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: SuggestionWithAuthor;
  originalTitle: string;
  originalDescription: string;
  originalContent: string;
  onAccept: (reviewComment?: string) => Promise<void>;
  onReject: (reviewComment?: string) => Promise<void>;
}

export function SuggestionReviewModal({
  open,
  onOpenChange,
  suggestion,
  originalTitle,
  originalDescription,
  originalContent,
  onAccept,
  onReject
}: SuggestionReviewModalProps) {
  const [reviewComment, setReviewComment] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const suggestedTitle = suggestion.title || originalTitle;
  const suggestedDescription = suggestion.description || originalDescription;
  const suggestedContent = suggestion.content;

  const contentDiff = computeSimpleDiff(originalContent, suggestedContent);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(reviewComment || undefined);
      toast.success('Suggestion accepted and applied');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept suggestion');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(reviewComment || undefined);
      toast.success('Suggestion rejected');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject suggestion');
    } finally {
      setIsRejecting(false);
    }
  };

  const isProcessing = isAccepting || isRejecting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Suggestion</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={suggestion.author?.avatar_url || ''} />
              <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
            </Avatar>
            <span>{suggestion.author?.display_name || 'Anonymous'}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {format(new Date(suggestion.created_at), 'MMM d, yyyy')}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Title/Description changes */}
          {(suggestion.title || suggestion.description) && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              {suggestion.title && suggestion.title !== originalTitle && (
                <div>
                  <Label className="text-xs text-muted-foreground">Title Change</Label>
                  <div className="flex gap-2 items-center text-sm">
                    <span className="line-through text-muted-foreground">{originalTitle}</span>
                    <span>→</span>
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                </div>
              )}
              {suggestion.description && suggestion.description !== originalDescription && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description Change</Label>
                  <div className="text-sm">
                    <div className="line-through text-muted-foreground">{originalDescription || '(empty)'}</div>
                    <div className="font-medium">{suggestion.description}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Diff */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-xs text-muted-foreground mb-2 block">Content Changes</Label>
            <div className="grid grid-cols-2 gap-2 h-[300px]">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-1.5 text-xs font-medium border-b">Original</div>
                <ScrollArea className="h-[268px]">
                  <div className="p-2 font-mono text-xs">
                    {contentDiff.left.map((line, i) => (
                      <div
                        key={i}
                        className={`px-2 py-0.5 ${
                          line.type === 'removed' ? 'bg-destructive/20 text-destructive' : ''
                        }`}
                      >
                        <span className="text-muted-foreground mr-2 select-none w-6 inline-block">
                          {line.lineNumber}
                        </span>
                        {line.content || ' '}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-1.5 text-xs font-medium border-b">Suggested</div>
                <ScrollArea className="h-[268px]">
                  <div className="p-2 font-mono text-xs">
                    {contentDiff.right.map((line, i) => (
                      <div
                        key={i}
                        className={`px-2 py-0.5 ${
                          line.type === 'added' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''
                        }`}
                      >
                        <span className="text-muted-foreground mr-2 select-none w-6 inline-block">
                          {line.lineNumber}
                        </span>
                        {line.content || ' '}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Review Comment (optional)</Label>
            <Textarea
              id="review-comment"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Add a comment about your decision..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isProcessing}
          >
            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <X className="mr-1 h-4 w-4" />
            Reject
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
          >
            {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="mr-1 h-4 w-4" />
            Accept & Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
