import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Key family shared by useAICreditsSummary (header pill) and useAICredits
 * (settings page), so one invalidation refreshes both.
 */
export const AI_CREDITS_QUERY_KEY = "ai-credits-summary";

/**
 * Edge functions that charge the caller's credit allowance. Each of them ends
 * up in callLovableAI (supabase/functions/_shared/llm.ts), the coaches through
 * _shared/coach.ts and the suggest-* family through _shared/suggest.ts. After
 * a successful call to any of these the balance on screen is stale.
 */
export const CREDIT_CHARGING_FUNCTIONS: ReadonlySet<string> = new Set([
  "ai-insights",
  "canvas-ai",
  "prompt-coach",
  "skill-coach",
  "workflow-coach",
  "prompt-kit-coach",
  "prompt-wizard",
  "refine-prompt",
  "translate-artifact",
  "suggest-metadata",
  "suggest-skill-metadata",
  "suggest-workflow-metadata",
  "suggest-promptkit-metadata",
  "generate-embedding",
]);

// Plain lib code such as runCanvasAI has no hook access, so the app's
// QueryClient is bound here once by useAuth, which is always mounted under
// the QueryClientProvider (see src/routes/__root.tsx).
let boundClient: QueryClient | null = null;

export function bindAICreditsQueryClient(queryClient: QueryClient): void {
  boundClient = queryClient;
}

/** Mark every cached credits read stale so the visible balance refetches. */
export function refreshAICredits(
  queryClient: QueryClient | null = boundClient,
): Promise<void> {
  if (!queryClient) return Promise.resolve();
  return queryClient.invalidateQueries({ queryKey: [AI_CREDITS_QUERY_KEY] });
}

let installed = false;

/**
 * Refresh the credits after any successful call to a charging edge function,
 * wherever in the app it is made. The AI calls are spread over a dozen pages
 * and modals that each invoke supabase.functions directly, and none of them
 * refreshed the balance afterwards, so the refresh lives in the one place that
 * sees all of them instead of being re-remembered at every call site.
 */
export function installAICreditsRefresh(queryClient: QueryClient): void {
  bindAICreditsQueryClient(queryClient);
  if (installed) return;
  installed = true;

  const functions = supabase.functions;
  const invoke = functions.invoke.bind(functions);
  functions.invoke = async (name, options) => {
    const result = await invoke(name, options);
    if (!result.error && CREDIT_CHARGING_FUNCTIONS.has(name)) {
      void refreshAICredits(queryClient);
    }
    return result;
  };
}
