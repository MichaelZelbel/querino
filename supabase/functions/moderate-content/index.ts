import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIKE_THRESHOLD = 5;

// The item types this endpoint accepts alongside an item_id. The four artifact
// types have an owner and only that owner may file them for AI review, because
// the review can end in an unpublish. A comment's item_id is the artifact being
// commented on, which the commenter does not own, so it gets no ownership check.
const ARTIFACT_ITEM_TYPES = ["prompt", "skill", "workflow", "prompt_kit"];
const KNOWN_ITEM_TYPES = [...ARTIFACT_ITEM_TYPES, "comment"];

// Leet-speak and unicode normalization map
const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "^": "a",
  "8": "b",
  "(": "c",
  "<": "c",
  "3": "e",
  "6": "g",
  "#": "h",
  "!": "i",
  "1": "i",
  "|": "i",
  "0": "o",
  "5": "s",
  $: "s",
  "7": "t",
  "+": "t",
  "9": "g",
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  // Replace leet-speak characters
  normalized = normalized
    .split("")
    .map((ch) => LEET_MAP[ch] || ch)
    .join("");
  // Remove non-alphanumeric (keep spaces for word boundary detection)
  normalized = normalized.replace(/[^a-z0-9\s]/g, "");
  // Collapse repeated characters (e.g., "seeex" -> "sex")
  normalized = normalized.replace(/(.)\1{2,}/g, "$1$1");
  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
}

// PII detection patterns
const PII_PATTERNS = [
  {
    pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
    category: "pii",
    label: "email address",
  },
  {
    pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
    category: "pii",
    label: "SSN-like number",
  },
  {
    pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    category: "pii",
    label: "phone number",
  },
];

function detectPII(text: string): {
  found: boolean;
  category: string;
  matches: string[];
} {
  const matches: string[] = [];
  for (const { pattern, label } of PII_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches.push(`${label}: ${found[0]}`);
    }
  }
  return { found: matches.length > 0, category: "pii", matches };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      },
    );
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { content_fields, action, item_type, item_id } = body;

    if (!content_fields || !action || !item_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 0. An item_id names something the AI review may end up unpublishing, so
    // it has to be the caller's own. Before this check any signed-in user could
    // file any other user's public artifact and have it taken down.
    if (item_id) {
      if (!KNOWN_ITEM_TYPES.includes(item_type)) {
        return new Response(JSON.stringify({ error: "Unknown item_type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (ARTIFACT_ITEM_TYPES.includes(item_type)) {
        const { data: isOwner, error: ownerErr } = await serviceClient.rpc(
          "is_item_owner",
          { p_item_type: item_type, p_item_id: item_id, p_user_id: user.id },
        );
        if (ownerErr) {
          console.warn("Ownership lookup failed:", ownerErr);
          return new Response(
            JSON.stringify({ error: "Could not verify item ownership" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        if (isOwner !== true) {
          return new Response(
            JSON.stringify({ error: "Not the owner of this item" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }
    }

    // 1. Check if user is suspended
    const { data: suspension } = await serviceClient
      .from("user_suspensions")
      .select("suspended, suspended_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (suspension?.suspended) {
      // Check if suspension has expired
      if (
        suspension.suspended_until &&
        new Date(suspension.suspended_until) < new Date()
      ) {
        await serviceClient
          .from("user_suspensions")
          .update({
            suspended: false,
            suspended_at: null,
            suspended_until: null,
          })
          .eq("user_id", user.id);
      } else {
        return new Response(
          JSON.stringify({
            approved: false,
            reason:
              "Your account has been suspended due to repeated guideline violations.",
            category: "suspended",
            support_hint: "Contact support@querino.ai for assistance.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // 2. Fetch stopwords
    const { data: stopwords } = await serviceClient
      .from("moderation_stopwords")
      .select("word, category, severity");

    const blockWords = (stopwords || []).filter((s) => s.severity === "block");

    // 3. Combine all content fields into one string for checking
    const allText = Object.values(content_fields).filter(Boolean).join(" ");
    const normalizedText = normalizeText(allText);

    // 4. Check against stopwords
    const matchedWords: string[] = [];
    let matchedCategory = "";
    for (const sw of blockWords) {
      if (normalizedText.includes(sw.word.toLowerCase())) {
        matchedWords.push(sw.word);
        if (!matchedCategory) matchedCategory = sw.category || "general";
      }
    }

    // 5. PII detection (on original text, not normalized)
    const piiResult = detectPII(allText);
    if (piiResult.found) {
      matchedWords.push(...piiResult.matches);
      if (!matchedCategory) matchedCategory = "pii";
    }

    const isBlocked = matchedWords.length > 0;

    // 6. Log moderation event
    await serviceClient.from("moderation_events").insert({
      user_id: user.id,
      action,
      item_type,
      item_id: item_id || null,
      flagged_content: isBlocked ? allText.substring(0, 500) : null,
      matched_words: isBlocked ? matchedWords : null,
      category: matchedCategory || null,
      result: isBlocked ? "blocked" : "cleared",
      tier: "stopword",
    });

    // 7. If blocked, increment strike count. One statement in the database,
    // so two blocked submissions landing at once cannot lose a strike.
    if (isBlocked) {
      const { error: strikeErr } = await serviceClient.rpc(
        "increment_user_strike",
        { p_user_id: user.id, p_threshold: STRIKE_THRESHOLD },
      );
      if (strikeErr) {
        console.error("Failed to record strike:", strikeErr);
      }

      const categoryLabels: Record<string, string> = {
        sexual: "Inappropriate content",
        hate: "Hateful or abusive content",
        spam: "Spam or low-quality content",
        pii: "Personal information detected",
        malware: "Potentially malicious content",
        general: "Content policy violation",
      };

      return new Response(
        JSON.stringify({
          approved: false,
          reason: "This content appears to violate our Community Guidelines.",
          category:
            categoryLabels[matchedCategory] || "Content policy violation",
          support_hint:
            "If you believe this is a mistake, please contact support@querino.ai",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 8. Queue for async AI review (Tier 2) if content passed Tier 1
    if (item_id) {
      try {
        await serviceClient.from("moderation_review_queue").insert({
          item_type,
          item_id,
          user_id: user.id,
          content_snapshot: allText.substring(0, 5000),
          status: "pending",
        });
      } catch (queueErr) {
        console.warn("Failed to queue for AI review:", queueErr);
        // Non-blocking: don't fail the publish action
      }
    }

    return new Response(JSON.stringify({ approved: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Moderation error:", err);
    return new Response(
      JSON.stringify({ error: "Internal moderation error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
