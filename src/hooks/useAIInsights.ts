import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useLogActivity';
import type { AIInsights, AIQuality } from '@/types/aiInsights';

type ItemType = 'prompt' | 'skill' | 'workflow';

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
      } else {
        const { data, error } = await supabase
          .from('workflows')
          .select('title, description, json, tags')
          .eq('id', itemId)
          .single();
        if (error || !data) return null;
        return { title: data.title, description: data.description, content: JSON.stringify(data.json), tags: data.tags };
      }
    } catch {
      return null;
    }
  }, [itemType, itemId]);

  const generateInsights = useCallback(async (isRefresh = false) => {
    // Use hardcoded URL for prompt insights, fallback to env var for other types
    const insightsUrl = itemType === 'prompt' 
      ? 'https://agentpool.app.n8n.cloud/webhook/prompt-insights'
      : import.meta.env.VITE_AI_INSIGHTS_URL;
    
    if (!insightsUrl) {
      setError('AI Insights URL not configured');
      return;
    }

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

      // Call n8n endpoint
      const response = await fetch(insightsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          title: artefact.title,
          description: artefact.description || '',
          content: artefact.content,
          tags: artefact.tags || [],
          metadata: { id: itemId },
          user_id: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      // Read response as text first, then try to parse
      const responseText = await response.text();
      
      let summary: string | null = null;
      let tags: string[] = [];
      let recommendations: string[] = [];
      let quality: AIQuality | null = null;

      try {
        const jsonResult = JSON.parse(responseText);
        
        // Handle n8n webhook format: [{ "output": "markdown string" }]
        if (Array.isArray(jsonResult) && jsonResult[0]?.output) {
          const output = jsonResult[0].output;
          if (typeof output === 'string') {
            summary = output;
          } else {
            // If output is an object with structured data
            summary = output.summary || null;
            tags = output.tags || [];
            recommendations = output.recommendations || [];
            quality = output.quality || null;
          }
        } else if (jsonResult.output) {
          // Handle { "output": "..." } format
          if (typeof jsonResult.output === 'string') {
            summary = jsonResult.output;
          } else {
            summary = jsonResult.output.summary || null;
            tags = jsonResult.output.tags || [];
            recommendations = jsonResult.output.recommendations || [];
            quality = jsonResult.output.quality || null;
          }
        } else {
          // Handle direct structured response
          summary = jsonResult.summary || null;
          tags = jsonResult.tags || [];
          recommendations = jsonResult.recommendations || [];
          quality = jsonResult.quality || null;
        }
      } catch {
        // If not valid JSON, treat as raw markdown text
        summary = responseText;
      }

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

      // Log activity
      await logActivity({
        action: isRefresh ? 'ai_insights_refreshed' : 'ai_insights_generated',
        itemType,
        itemId,
      });
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
