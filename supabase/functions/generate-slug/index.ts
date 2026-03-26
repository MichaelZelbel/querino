import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { transliterate } from "transliteration";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateSlug(title: string): string {
  if (!title || !title.trim()) {
    return `untitled-${crypto.randomUUID().substring(0, 8)}`;
  }

  // Transliterate any script to Latin
  let result = transliterate(title.trim());

  // Lowercase
  result = result.toLowerCase();

  // Replace whitespace with hyphens
  result = result.replace(/\s+/g, "-");

  // Remove ASCII punctuation/symbols unsafe in URLs
  result = result.replace(/[!@#$%^&*()+=\[\]{};:'",.<>?/\\|`~]/g, "");

  // Replace underscores with hyphens
  result = result.replace(/_/g, "-");

  // Collapse multiple hyphens
  result = result.replace(/-+/g, "-");

  // Trim leading/trailing hyphens
  result = result.replace(/^-+|-+$/g, "");

  // Fallback if empty
  if (!result) {
    return `untitled-${crypto.randomUUID().substring(0, 8)}`;
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    const slug = generateSlug(title);

    return new Response(JSON.stringify({ slug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
