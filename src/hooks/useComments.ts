import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Comment, ItemType } from '@/types/comment';
import { triggerNotification } from '@/lib/notifications';

export const useComments = (itemType: ItemType, itemId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!itemId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
        `)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Organize into threaded structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      (data || []).forEach((comment: any) => {
        const formattedComment: Comment = {
          ...comment,
          author: comment.author,
          replies: []
        };
        commentMap.set(comment.id, formattedComment);
      });

      commentMap.forEach(comment => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          commentMap.get(comment.parent_id)!.replies!.push(comment);
        } else if (!comment.parent_id) {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemType, itemId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = async (content: string, parentId?: string) => {
    if (!user) throw new Error('Must be logged in to comment');

    const { data, error: createError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        parent_id: parentId || null,
        content
      })
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `)
      .single();

    if (createError) throw createError;

    // Log activity
    await supabase.from('activity_events').insert({
      actor_id: user.id,
      action: 'comment',
      item_type: itemType,
      item_id: itemId,
      metadata: { commentId: data.id, parentId: parentId || null }
    });

    triggerNotification('new-comment', { itemType, itemId, commentId: data.id, parentId });
    
    await fetchComments();
    return data;
  };

  const editComment = async (commentId: string, content: string) => {
    if (!user) throw new Error('Must be logged in to edit');

    const { error: updateError } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Log activity
    await supabase.from('activity_events').insert({
      actor_id: user.id,
      action: 'comment_edit',
      item_type: itemType,
      item_id: itemId,
      metadata: { commentId }
    });

    triggerNotification('comment-edit', { itemType, itemId, commentId });
    
    await fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    if (!user) throw new Error('Must be logged in to delete');

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase.from('activity_events').insert({
      actor_id: user.id,
      action: 'comment_delete',
      item_type: itemType,
      item_id: itemId,
      metadata: { commentId }
    });

    triggerNotification('comment-delete', { itemType, itemId, commentId });
    
    await fetchComments();
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return {
    comments,
    loading,
    error,
    totalCount,
    createComment,
    editComment,
    deleteComment,
    refetch: fetchComments
  };
};
