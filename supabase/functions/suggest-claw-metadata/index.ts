import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claw_content, user_id } = await req.json();

    if (!claw_content || typeof claw_content !== "string") {
      return new Response(
        JSON.stringify({ error: "claw_content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating claw metadata via Lovable AI, content length:", claw_content.length, "user_id:", user_id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a metadata extraction assistant. Analyze the provided SKILL.md content for a "Claw" (a callable capability for an AI agent called Clawbot) and extract appropriate metadata.

Your task is to:
1. Generate a concise, descriptive title (max 60 characters)
2. Write a clear description (1-2 sentences, max 200 characters) explaining what this Claw does
3. Select the most appropriate category from this list: writing, coding, analysis, marketing, education, productivity, creative, business, other
4. Suggest 3-5 relevant tags (lowercase, hyphenated)

Base your suggestions ONLY on the actual content provided. Do not make up features or capabilities that aren't described in the content.`;

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
          { role: "user", content: `Analyze this SKILL.md content and extract metadata:\n\n${claw_content}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_claw_metadata",
              description: "Return metadata suggestions for a Claw based on its SKILL.md content.",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "A concise, descriptive title for the Claw (max 60 chars)"
                  },
                  description: {
                    type: "string",
                    description: "A clear 1-2 sentence description of what the Claw does (max 200 chars)"
                  },
                  category: {
                    type: "string",
                    enum: ["writing", "coding", "analysis", "marketing", "education", "productivity", "creative", "business", "other"],
                    description: "The most appropriate category for this Claw"
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 relevant tags (lowercase, hyphenated)"
                  }
                },
                required: ["title", "description", "category", "tags"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_claw_metadata" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response:", JSON.stringify(aiResponse));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "suggest_claw_metadata") {
      throw new Error("Unexpected AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Parsed metadata result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating claw metadata:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate suggestions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
