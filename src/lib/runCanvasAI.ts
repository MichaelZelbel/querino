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
// Edge function routing per artifact type
// ---------------------------------------------------------------------------

const EDGE_FUNCTION_BY_TYPE: Record<ArtifactType, string> = {
  prompt: "prompt-coach",
  skill: "skill-coach",
  workflow: "workflow-coach",
};

// ---------------------------------------------------------------------------
// Session ID helpers
// ---------------------------------------------------------------------------

/** Key for storing a draft session id in localStorage (new artifact, not yet saved). */
export function draftSessionKey(artifactType: ArtifactType, workspaceScope: string, userId: string): string {
  return `prompt_coach_session:new:${artifactType}:${workspaceScope}:${userId}`;
}

/** Key for storing a saved-artifact session id in localStorage. */
export function artifactSessionKey(artifactType: ArtifactType, workspaceScope: string, userId: string, artifactId: string): string {
  return `prompt_coach_session:${artifactType}:${workspaceScope}:${userId}:${artifactId}`;
}

/** Deterministic session id for an existing artifact. */
export function deterministicSessionId(
  workspaceScope: string,
  userId: string,
  artifactId: string,
): string {
  return `${workspaceScope}:${userId}:${artifactId}`;
}

// Legacy aliases for backward compatibility with PromptCoachPanel and LibraryPromptEdit
export function promptSessionKey(workspaceScope: string, userId: string, promptId: string): string {
  return artifactSessionKey("prompt", workspaceScope, userId, promptId);
}

/**
 * Get or create a draft session id for a new artifact page.
 * Persisted in localStorage so it survives refreshes.
 */
export function getOrCreateDraftSessionId(workspaceScope: string, userId: string, artifactType: ArtifactType = "prompt"): string {
  const key = draftSessionKey(artifactType, workspaceScope, userId);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

/**
 * After a new artifact is created, "promote" the draft session to the final
 * deterministic session id and clean up the draft key.
 */
export function promoteDraftSession(
  workspaceScope: string,
  userId: string,
  newArtifactId: string,
  artifactType: ArtifactType = "prompt",
): string {
  const draftId = getOrCreateDraftSessionId(workspaceScope, userId, artifactType);
  const finalSessionId = deterministicSessionId(workspaceScope, userId, newArtifactId);
  const finalKey = artifactSessionKey(artifactType, workspaceScope, userId, newArtifactId);
  localStorage.setItem(finalKey, finalSessionId);

  // Migrate chat messages from draft session key to final session key
  const draftMsgKey = `prompt_coach_messages:${draftId}`;
  const finalMsgKey = `prompt_coach_messages:${finalSessionId}`;
  try {
    const draftMessages = localStorage.getItem(draftMsgKey);
    if (draftMessages) {
      localStorage.setItem(finalMsgKey, draftMessages);
      localStorage.removeItem(draftMsgKey);
    }
  } catch {
    // ignore storage errors
  }

  // Remove the draft session key
  const draftKey = draftSessionKey(artifactType, workspaceScope, userId);
  localStorage.removeItem(draftKey);

  return finalSessionId;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Provider abstraction for canvas AI.
 * Routes to the appropriate Supabase Edge Function based on artifact type.
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

  const edgeFunction = EDGE_FUNCTION_BY_TYPE[artifactType];

  const body = {
    user_id: userId,
    workspace_id: workspaceId ?? null,
    artifact_type: artifactType,
    prompt_id: artifactId === "draft" ? "draft" : artifactId,
    skill_id: artifactId === "draft" ? "draft" : artifactId,
    workflow_id: artifactId === "draft" ? "draft" : artifactId,
    mode,
    message,
    canvas_content: canvasContent,
    selection: selection ?? null,
    session_id: sessionId,
  };

  const { data, error } = await supabase.functions.invoke(edgeFunction, {
    body,
  });

  if (error) {
    console.error(`[runCanvasAI:${artifactType}] Edge function error:`, error);
    throw new Error(error.message || "AI request failed");
  }

  // Persist returned session id if provided
  if (data?.session?.id) {
    const workspaceScope = workspaceId ?? "personal";
    if (artifactId && artifactId !== "draft") {
      const key = artifactSessionKey(artifactType, workspaceScope, userId, artifactId);
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
