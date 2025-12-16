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
import { Loader2, GitPullRequest } from 'lucide-react';
import { toast } from 'sonner';

interface SuggestEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'prompt' | 'skill' | 'workflow';
  currentTitle: string;
  currentDescription: string;
  currentContent: string;
  onSubmit: (data: { title?: string; description?: string; content: string }) => Promise<any>;
}

export function SuggestEditModal({
  open,
  onOpenChange,
  itemType,
  currentTitle,
  currentDescription,
  currentContent,
  onSubmit
}: SuggestEditModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [content, setContent] = useState(currentContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTitle(currentTitle);
      setDescription(currentDescription);
      setContent(currentContent);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title !== currentTitle ? title : undefined,
        description: description !== currentDescription ? description : undefined,
        content
      });
      toast.success('Edit suggestion submitted');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Suggest Edit to {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Propose changes to this {itemType}. The owner will review your suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="suggest-title">Title</Label>
            <Input
              id="suggest-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Suggested title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggest-description">Description</Label>
            <Textarea
              id="suggest-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Suggested description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggest-content">Content *</Label>
            <Textarea
              id="suggest-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Suggested content"
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
