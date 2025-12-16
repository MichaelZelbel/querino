import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { CommentItem } from './CommentItem';
import { ItemType } from '@/types/comment';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface CommentsSectionProps {
  itemType: ItemType;
  itemId: string;
  teamId?: string | null;
}

export const CommentsSection = ({ itemType, itemId, teamId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { comments, loading, error, totalCount, createComment, editComment, deleteComment } = useComments(itemType, itemId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If team item and user not logged in, hide entirely
  if (teamId && !user) {
    return null;
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await createComment(newComment);
      setNewComment('');
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    try {
      await createComment(content, parentId);
      toast.success('Reply posted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post reply');
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await editComment(commentId, content);
      toast.success('Comment updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment');
    }
  };

  if (error) {
    return null; // Silently hide if can't load (e.g., no access)
  }

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Discussion</h2>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">({totalCount})</span>
        )}
      </div>

      {/* Comment editor */}
      {user ? (
        <div className="mb-6 space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-muted-foreground">
            <Link to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`} className="text-primary hover:underline">
              Sign in
            </Link>
            {' '}to join the discussion
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments list */}
      {!loading && comments.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No comments yet — be the first to start a discussion!
        </p>
      )}

      {!loading && comments.length > 0 && (
        <div className="divide-y">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
