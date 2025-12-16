import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Pencil, Trash2, X, Check } from 'lucide-react';
import { Comment } from '@/types/comment';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isReply?: boolean;
}

export const CommentItem = ({ comment, onReply, onEdit, onDelete, isReply = false }: CommentItemProps) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.id === comment.user_id;
  const displayName = comment.author?.display_name || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setLoading(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setLoading(true);
    try {
      await onDelete(comment.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-8 pl-4 border-l border-border' : ''}`}>
      <div className="flex gap-3 py-4">
        <Link to={`/u/${comment.author?.display_name || comment.user_id}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              to={`/u/${comment.author?.display_name || comment.user_id}`}
              className="font-medium text-sm hover:underline"
            >
              {displayName}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={loading}>
                  <Check className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 mt-2">
              {user && !isReply && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setIsReplying(!isReplying)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" /> Reply
                </Button>
              )}
              {isOwner && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={loading || !replyContent.trim()}>
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies (max depth = 1) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
};
