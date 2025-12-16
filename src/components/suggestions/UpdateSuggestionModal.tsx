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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SuggestionWithAuthor } from '@/types/suggestion';

interface UpdateSuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: SuggestionWithAuthor;
  onSubmit: (data: { title?: string; description?: string; content: string }) => Promise<void>;
}

export function UpdateSuggestionModal({
  open,
  onOpenChange,
  suggestion,
  onSubmit
}: UpdateSuggestionModalProps) {
  const [title, setTitle] = useState(suggestion.title || '');
  const [description, setDescription] = useState(suggestion.description || '');
  const [content, setContent] = useState(suggestion.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        content: content.trim()
      });
      toast.success('Suggestion updated successfully');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Suggestion</DialogTitle>
          <DialogDescription>
            Revise your suggestion based on the requested changes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Requested Changes Reminder */}
          {suggestion.requested_changes && suggestion.requested_changes.length > 0 && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">
                  Requested Changes
                </span>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {suggestion.requested_changes.map((change, i) => (
                  <li key={i} className="text-muted-foreground">{change}</li>
                ))}
              </ul>
              {suggestion.review_comment && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  "{suggestion.review_comment}"
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Suggested title change"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Suggested description change"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your improved suggestion..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Updated Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}