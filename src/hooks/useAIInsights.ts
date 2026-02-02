import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useLogActivity';
import type { AIInsights, AIQuality } from '@/types/aiInsights';

type ItemType = 'prompt' | 'skill' | 'workflow' | 'claw';

interface ArtefactData {
  title: string;
  description: string | null;
  content: string;
  tags: string[] | null;
}

export function useAIInsights(itemType: ItemType, itemId: string) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logActivity } = useLogActivity();

  const fetchCachedInsights = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (data) {
        setInsights({
          ...data,
          item_type: data.item_type as ItemType,
          tags: (data.tags as string[]) || [],
          recommendations: (data.recommendations as string[]) || [],
          quality: (data.quality as unknown as AIQuality) || null,
        });
      }
      return data;
    } catch (err) {
      console.error('Error fetching cached insights:', err);
      return null;
    }
  }, [itemType, itemId]);

  const fetchArtefact = useCallback(async (): Promise<ArtefactData | null> => {
    try {
      if (itemType === 'prompt') {
        const { data, error } = await supabase
          .from('prompts')
          .select('title, description, content, tags')
          .eq('id', itemId)
          .single();
        if (error || !data) return null;
        return { title: data.title, description: data.description, content: data.content, tags: data.tags };
      } else if (itemType === 'skill') {
        const { data, error } = await supabase
          .from('skills')
          .select('title, description, content, tags')
          .eq('id', itemId)
          .single();
        if (error || !data) return null;
        return { title: data.title, description: data.description, content: data.content, tags: data.tags };
      } else if (itemType === 'workflow') {
        const { data, error } = await supabase
          .from('workflows')
          .select('title, description, json, tags')
          .eq('id', itemId)
          .single();
        if (error || !data) return null;
        return { title: data.title, description: data.description, content: JSON.stringify(data.json), tags: data.tags };
      } else if (itemType === 'claw') {
        const { data, error } = await supabase
          .from('claws')
          .select('title, description, content, tags')
          .eq('id', itemId)
          .single();
        if (error || !data) return null;
        return { title: data.title, description: data.description, content: data.content || '', tags: data.tags };
      }
      return null;
    } catch {
      return null;
    }
  }, [itemType, itemId]);

  const generateInsights = useCallback(async (isRefresh = false) => {
    setGenerating(true);
    setError(null);

    try {
      // Get current user for tracking
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch artefact data
      const artefact = await fetchArtefact();
      if (!artefact) {
        throw new Error('Failed to fetch artefact data');
      }

      // Call edge function instead of direct n8n webhook
      const { data: response, error: fnError } = await supabase.functions.invoke('ai-insights', {
        body: {
          item_type: itemType,
          title: artefact.title,
          description: artefact.description || '',
          content: artefact.content,
          tags: artefact.tags || [],
          metadata: { id: itemId },
          user_id: user?.id,
        },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message || 'Failed to generate insights');
      }

      // Edge function already normalizes the response
      const summary = response.summary || null;
      const tags: string[] = response.tags || [];
      const recommendations: string[] = response.recommendations || [];
      const quality: AIQuality | null = response.quality || null;

      // Upsert into cache
      const insightData = {
        item_type: itemType,
        item_id: itemId,
        summary,
        tags,
        recommendations,
        quality,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertError } = await supabase
        .from('ai_insights')
        .upsert(insightData as any, { onConflict: 'item_type,item_id' })
        .select()
        .single();

      if (upsertError) throw upsertError;

      setInsights({
        ...upserted,
        item_type: upserted.item_type as ItemType,
        tags: (upserted.tags as string[]) || [],
        recommendations: (upserted.recommendations as string[]) || [],
        quality: (upserted.quality as unknown as AIQuality) || null,
      });

      // Log activity (only for types that support it)
      if (itemType !== 'claw') {
        await logActivity({
          action: isRefresh ? 'ai_insights_refreshed' : 'ai_insights_generated',
          itemType: itemType as 'prompt' | 'skill' | 'workflow',
          itemId,
        });
      }
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  }, [itemType, itemId, fetchArtefact, logActivity]);

  const refreshInsights = useCallback(async () => {
    // Delete existing cache
    await supabase
      .from('ai_insights')
      .delete()
      .eq('item_type', itemType)
      .eq('item_id', itemId);

    setInsights(null);
    await generateInsights(true);
  }, [itemType, itemId, generateInsights]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      await fetchCachedInsights();
      if (mounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchCachedInsights]);

  return {
    insights,
    loading,
    generating,
    error,
    generateInsights: () => generateInsights(false),
    refreshInsights,
    hasInsights: !!insights,
  };
}
