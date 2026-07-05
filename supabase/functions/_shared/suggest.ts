// Shared metadata-suggestion server. The four suggest-*-metadata functions
// were ~90% identical (auth, credit gate, tool schema, response shaping,
// error mapping); only the system prompt, body field and labels differ.
// Mirrors the startCoachServer(cfg) pattern in coach.ts.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor } from "./cors.ts";
import {
  callLovableAI,
  assertCredits,
  getCallerUserId,
  CreditsExhaustedError,
  RateLimitedError,
  GatewayError,
  DEFAULT_MODEL,
  type ToolDefinition,
} from "./llm.ts";

export interface SuggestConfig {
  /** Usage-ledger feature name, e.g. "suggest-skill-metadata" */
  feature: string;
  /** Artifact label used in the user message + metadata, e.g. "skill" */
  artifact: string;
  /** Accepted request-body fields carrying the content (first match wins). */
  bodyFields: string[];
  /** Full system prompt including the category list for this artifact type. */
  systemPrompt: string;
}

const MAX_CONTENT_CHARS = 8000;

export function startSuggestServer(cfg: SuggestConfig) {
  const tool: ToolDefinition = {
    type: "function",
    function: {
      name: "return_metadata",
      description: `Return suggested metadata for the ${cfg.artifact}.`,
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title, max 60 chars." },
          description: { type: "string", description: "One-sentence description, max 160 chars." },
          category: { type: "string", description: "One of the allowed categories." },
          tags: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 6,
            description: "3–6 lowercase tags.",
          },
        },
        required: ["title", "description", "category", "tags"],
        additionalProperties: false,
      },
    },
  };

  serve(async (req) => {
    const corsHeaders = corsHeadersFor(req);
    const json = (payload: unknown, status = 200) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      const user_id = await getCallerUserId(req);
      const body = await req.json();

      let content = "";
      for (const field of cfg.bodyFields) {
        const value = body?.[field];
        if (typeof value === "string" && value.trim()) {
          content = value.trim();
          break;
        }
      }
      if (!content) {
        return json({ error: `${cfg.bodyFields[0]} is required` }, 400);
      }

      await assertCredits(user_id);

      const truncated = content.slice(0, MAX_CONTENT_CHARS);
      const result = await callLovableAI({
        user_id,
        feature: cfg.feature,
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: cfg.systemPrompt },
          { role: "user", content: `Suggest metadata for this ${cfg.artifact}:\n\n${truncated}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_metadata" } },
        metadata: { artifact: cfg.artifact, content_length: content.length },
      });

      const call = result.tool_calls[0];
      if (!call?.function?.arguments) {
        return json({ error: "Model returned no metadata" }, 502);
      }

      let parsed: { title?: string; description?: string; category?: string; tags?: string[] };
      try {
        parsed = JSON.parse(call.function.arguments);
      } catch (e) {
        console.error(`[${cfg.feature}] JSON parse error:`, e);
        return json({ error: "Invalid model response" }, 502);
      }

      return json({
        title: (parsed.title ?? "").toString().slice(0, 80),
        description: (parsed.description ?? "").toString().slice(0, 200),
        category: (parsed.category ?? "Other").toString(),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6).map((t) => String(t)) : [],
      });
    } catch (error) {
      if (error instanceof CreditsExhaustedError) {
        return json({ error: error.message }, 402);
      }
      if (error instanceof RateLimitedError) {
        return json({ error: "Rate limit exceeded, please retry shortly." }, 429);
      }
      if (error instanceof GatewayError) {
        console.error(`[${cfg.feature}] Gateway error:`, error.status, error.message);
        return json({ error: "Upstream AI gateway error" }, 502);
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      if (
        message === "Missing Authorization bearer token" ||
        message === "Invalid auth token" ||
        message === "Empty bearer token"
      ) {
        return json({ error: "Unauthorized" }, 401);
      }
      console.error(`[${cfg.feature}] Error:`, message);
      return json({ error: "Failed to generate suggestions" }, 500);
    }
  });
}
