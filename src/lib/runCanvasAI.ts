import { supabase } from "@/integrations/supabase/client";

export type ArtifactType = "prompt" | "skill" | "workflow";

export type RunCanvasAIArgs = {
  artifactType: ArtifactType;
  artifactId: string; // "draft" when not yet saved
  mode: "chat_only" | "collab_edit" | "rewrite";
  message: string;
  canvasContent: string;
  selection?: { start: number; end: number; text: string };
  userId: string;
  workspaceId?: string | null;
  sessionId: string;
};

export type RunCanvasAIResult = {
  assistantMessage: string;
  canvas?: { updated: boolean; content?: string; changeNote?: string };
};

// ---------------------------------------------------------------------------
// Session ID helpers
// ---------------------------------------------------------------------------

/** Key for storing a draft session id in localStorage (new prompt, not yet saved). */
export function draftSessionKey(workspaceScope: string, userId: string): string {
  return `prompt_coach_session:new:${workspaceScope}:${userId}`;
}

/** Key for storing a saved-prompt session id in localStorage. */
export function promptSessionKey(workspaceScope: string, userId: string, promptId: string): string {
  return `prompt_coach_session:prompt:${workspaceScope}:${userId}:${promptId}`;
}

/** Deterministic session id for an existing prompt. */
export function deterministicSessionId(
  workspaceScope: string,
  userId: string,
  promptId: string,
): string {
  return `${workspaceScope}:${userId}:${promptId}`;
}

/**
 * Get or create a draft session id for the /prompts/new page.
 * Persisted in localStorage so it survives refreshes.
 */
export function getOrCreateDraftSessionId(workspaceScope: string, userId: string): string {
  const key = draftSessionKey(workspaceScope, userId);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

/**
 * After a new prompt is created, "promote" the draft session to the final
 * deterministic session id and clean up the draft key.
 */
export function promoteDraftSession(
  workspaceScope: string,
  userId: string,
  newPromptId: string,
): string {
  const finalSessionId = deterministicSessionId(workspaceScope, userId, newPromptId);
  const finalKey = promptSessionKey(workspaceScope, userId, newPromptId);
  localStorage.setItem(finalKey, finalSessionId);

  // Remove the draft key
  const draftKey = draftSessionKey(workspaceScope, userId);
  localStorage.removeItem(draftKey);

  return finalSessionId;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Provider abstraction for canvas AI.
 * Calls the Supabase Edge Function `prompt-coach` which proxies to n8n.
 */
export async function runCanvasAI(args: RunCanvasAIArgs): Promise<RunCanvasAIResult> {
  const {
    artifactType,
    artifactId,
    mode,
    message,
    canvasContent,
    selection,
    userId,
    workspaceId,
    sessionId,
  } = args;

  const body = {
    user_id: userId,
    workspace_id: workspaceId ?? null,
    artifact_type: artifactType,
    prompt_id: artifactId === "draft" ? "draft" : artifactId,
    mode,
    message,
    canvas_content: canvasContent,
    selection: selection ?? null,
    session_id: sessionId,
  };

  const { data, error } = await supabase.functions.invoke("prompt-coach", {
    body,
  });

  if (error) {
    console.error("[runCanvasAI] Edge function error:", error);
    throw new Error(error.message || "AI request failed");
  }

  // Persist returned session id if provided
  if (data?.session?.id) {
    const workspaceScope = workspaceId ?? "personal";
    if (artifactId && artifactId !== "draft") {
      const key = promptSessionKey(workspaceScope, userId, artifactId);
      localStorage.setItem(key, data.session.id);
    }
  }

  // Force chat_only to never update canvas
  const canvas = data?.canvas ?? { updated: false };
  if (mode === "chat_only") {
    canvas.updated = false;
  }

  return {
    assistantMessage: data?.assistantMessage ?? "I processed your request.",
    canvas,
  };
}
