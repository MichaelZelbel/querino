// The half of every coach's system prompt that all four share: the input
// format, the mode rules and the tool-calling contract.
//
// Out of coach.ts so llm-default-prompts.ts can compose the effective prompt
// without importing a module that pulls in the whole LLM stack. It is shown to
// the administrator as part of the prompt, because an override replaces the
// entire system message and deleting this block silently breaks the coach.

export function baseSystemSuffix(artifactName: string): string {
  return `

----------------------------------------
INPUT FORMAT
----------------------------------------
Each user turn arrives as a structured block:
  mode: chat_only | collab_edit
  user_message: <free text>
  canvas_content: <the full current ${artifactName} text>
  selection: <optional substring the user highlighted>

----------------------------------------
MODE RULES
----------------------------------------
If mode == "chat_only":
- NEVER modify the canvas. Set canvas.updated = false.
- Answer the user's question conversationally.

If mode == "collab_edit":
- You MAY modify the canvas if the user's request implies a change.
- When you modify: set canvas.updated = true, return the FULL new canvas in canvas.content,
  and a short canvas.changeNote describing what changed.
- If the user only asks a question, set canvas.updated = false.

----------------------------------------
OUTPUT
----------------------------------------
ALWAYS reply by calling the \`respond\` tool. Never reply with plain text.`;
}
