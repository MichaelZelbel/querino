import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(
  mode: string,
  artifactType: string,
  canvasContent: string,
): string {
  const modeInstructions =
    mode === "chat_only"
      ? `The user wants advice only. Do NOT modify the prompt. Set canvas.updated to false.`
      : mode === "rewrite"
        ? `The user wants a full rewrite. Return the complete updated content in canvas.content. Set canvas.updated to true.`
        : `The user wants collaborative editing. If the request is clear, return the full updated content in canvas.content with canvas.updated = true. If the request is unclear, ask ONE concise clarification question and set canvas.updated to false.`;

  return `You are a professional prompt engineering assistant ("Prompt Coach").
You are helping the user improve their ${artifactType} content.

CURRENT CANVAS CONTENT:
---
${canvasContent}
---

MODE: ${mode}
${modeInstructions}

RULES:
- You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no extra text.
- JSON schema:
  {
    "assistantMessage": "string — your explanation, advice, or clarification question",
    "canvas": {
      "updated": boolean,
      "content": "string — the FULL updated content (only if updated is true)",
      "changeNote": "string — brief description of changes (only if updated is true)"
    }
  }
- When canvas.updated is false, omit content and changeNote or set them to null.
- When canvas.updated is true, return the COMPLETE content, not a diff.
- Be concise but helpful in your assistantMessage.
- If the user's request is unclear, ask ONE clarification question and do NOT modify the canvas.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artifactType, artifactId, mode, message, canvasContent, selection } =
      await req.json();

    if (!message || !canvasContent) {
      return new Response(
        JSON.stringify({ error: "message and canvasContent are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(mode || "chat_only", artifactType || "prompt", canvasContent);

    let userMessage = message;
    if (selection?.text) {
      userMessage += `\n\n[Selected text (lines ${selection.start}-${selection.end})]: "${selection.text}"`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("[canvas-ai] Gateway error:", response.status, t);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const completion = await response.json();
    const rawContent = completion.choices?.[0]?.message?.content || "";

    // Parse the JSON response safely
    let result: { assistantMessage: string; canvas?: { updated: boolean; content?: string; changeNote?: string } };

    try {
      // Strip markdown code fences if present
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }
      result = JSON.parse(jsonStr);
    } catch {
      // Fallback: treat entire response as a chat message
      console.warn("[canvas-ai] Failed to parse JSON, using raw text");
      result = {
        assistantMessage: rawContent,
        canvas: { updated: false },
      };
    }

    // Validate structure
    if (!result.assistantMessage || typeof result.assistantMessage !== "string") {
      result.assistantMessage = rawContent || "I processed your request.";
    }
    if (!result.canvas) {
      result.canvas = { updated: false };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[canvas-ai] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Canvas AI failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
