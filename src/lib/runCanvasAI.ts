import { supabase } from "@/integrations/supabase/client";

export type ArtifactType = "prompt" | "skill" | "workflow";

export type RunCanvasAIArgs = {
  artifactType: ArtifactType;
  artifactId: string;
  mode: "chat_only" | "collab_edit" | "rewrite";
  message: string;
  canvasContent: string;
  selection?: { start: number; end: number; text: string };
};

export type RunCanvasAIResult = {
  assistantMessage: string;
  canvas?: { updated: boolean; content?: string; changeNote?: string };
};

/**
 * Provider abstraction for canvas AI.
 * Phase 1: Uses Lovable AI via the canvas-ai edge function.
 * Phase 2: Can be swapped to an n8n webhook without changing UI code.
 */
export async function runCanvasAI(args: RunCanvasAIArgs): Promise<RunCanvasAIResult> {
  const { data, error } = await supabase.functions.invoke("canvas-ai", {
    body: args,
  });

  if (error) {
    console.error("[runCanvasAI] Edge function error:", error);
    throw new Error(error.message || "AI request failed");
  }

  // The edge function returns the parsed result directly
  return data as RunCanvasAIResult;
}
