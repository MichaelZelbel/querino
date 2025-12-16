import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Suggestion, SuggestionWithAuthor, SuggestionItemType, SuggestionStatus } from '@/types/suggestion';

export const useSuggestions = (itemType: SuggestionItemType, itemId: string) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestionWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!itemId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('suggestions')
        .select(`
          *,
          author:profiles!suggestions_author_id_fkey(id, display_name, avatar_url),
          reviewer:profiles!suggestions_reviewer_id_fkey(id, display_name, avatar_url)
        `)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSuggestions((data || []) as SuggestionWithAuthor[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemType, itemId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const createSuggestion = async (data: {
    title?: string;
    description?: string;
    content: string;
  }) => {
    if (!user) throw new Error('Must be logged in to suggest edits');

    const { data: suggestion, error: createError } = await supabase
      .from('suggestions')
      .insert({
        item_type: itemType,
        item_id: itemId,
        author_id: user.id,
        title: data.title || null,
        description: data.description || null,
        content: data.content,
        status: 'open'
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log activity
    await supabase.from('activity_events').insert({
      actor_id: user.id,
      action: 'suggestion_created',
      item_type: itemType,
      item_id: itemId,
      metadata: { suggestionId: suggestion.id }
    });

    await fetchSuggestions();
    return suggestion;
  };

  const reviewSuggestion = async (
    suggestionId: string,
    status: 'accepted' | 'rejected',
    reviewComment?: string
  ) => {
    if (!user) throw new Error('Must be logged in to review');

    const { error: updateError } = await supabase
      .from('suggestions')
      .update({
        status,
        reviewer_id: user.id,
        review_comment: reviewComment || null,
        requested_changes: null
      })
      .eq('id', suggestionId);

    if (updateError) throw updateError;

    // Log activity
    await supabase.from('activity_events').insert({
      actor_id: user.id,
      action: status === 'accepted' ? 'suggestion_accepted' : 'suggestion_rejected',
      item_type: itemType,
      item_id: itemId,
      metadata: { suggestionId }
    });

    await fetchSuggestions();
  };

  const requestChanges = async (
    suggestionId: string,
    requestedChanges: string[],
    reviewComment?: string
  ) => {
    if (!user) throw new Error('Must be logged in to request changes');

    const { error: updateError } = await supabase
      .from('suggestions')
      .update({
        status: 'changes_requested',
        reviewer_id: user.id,
        review_comment: reviewComment || null,
        requested_changes: requestedChanges
      })
      .eq('id', suggestionId);

    if (updateError) throw updateError;

    // Log activity
    await supabase.from('activity_events').insert({
      actor_id: user.id,
      action: 'suggestion_changes_requested',
      item_type: itemType,
      item_id: itemId,
      metadata: { suggestionId, requestedChanges }
    });

    // Trigger notification placeholder
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('changes-requested', { 
        detail: { suggestionId } 
      }));
    }

    await fetchSuggestions();
  };

  const updateSuggestionAfterChanges = async (
    suggestionId: string,
    data: {
      title?: string;
      description?: string;
      content: string;
    }
  ) => {
    if (!user) throw new Error('Must be logged in to update suggestion');

    const { error: updateError } = await supabase
      .from('suggestions')
      .update({
        title: data.title || null,
        description: data.description || null,
        content: data.content,
        status: 'open',
        reviewer_id: null,
        review_comment: null,
        requested_changes: null
      })
      .eq('id', suggestionId)
      .eq('author_id', user.id);

    if (updateError) throw updateError;

    // Log activity
    await supabase.from('activity_events').insert({
      actor_id: user.id,
      action: 'suggestion_updated_after_changes_requested',
      item_type: itemType,
      item_id: itemId,
      metadata: { suggestionId }
    });

    await fetchSuggestions();
  };

  const deleteSuggestion = async (suggestionId: string) => {
    if (!user) throw new Error('Must be logged in to delete');

    const { error: deleteError } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', suggestionId)
      .eq('author_id', user.id);

    if (deleteError) throw deleteError;
    await fetchSuggestions();
  };

  const openCount = suggestions.filter(s => s.status === 'open').length;
  const changesRequestedCount = suggestions.filter(s => s.status === 'changes_requested').length;

  return {
    suggestions,
    loading,
    error,
    openCount,
    changesRequestedCount,
    createSuggestion,
    reviewSuggestion,
    requestChanges,
    updateSuggestionAfterChanges,
    deleteSuggestion,
    refetch: fetchSuggestions
  };
};
