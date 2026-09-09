import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCallerUserId } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Identity comes from the caller's JWT, never from the request body.
    // This function spends the user's Menerio API key and writes to their
    // prompts; a body-supplied user_id let anyone act as any user they could
    // name. `supabase.functions.invoke` attaches the session token for us.
    let user_id: string;
    try {
      user_id = await getCallerUserId(req);
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { menerio_callback, menerio_note_id, prompt_id, prompt_slug } =
      await req.json();

    if (!menerio_callback || !menerio_note_id || !prompt_id) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: menerio_callback, menerio_note_id, prompt_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // prompts.id is a uuid. A non-uuid here would make the update at the end
    // fail with a type error after Menerio has already been told the link
    // exists, so it is refused before anything outward happens.
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof prompt_id !== "string" || !UUID_RE.test(prompt_id)) {
      return new Response(
        JSON.stringify({ error: "prompt_id must be a uuid" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate callback URL: must be https. Host is allowlisted below against
    // the user's stored Menerio base URL so an attacker cannot exfiltrate the
    // API key to an arbitrary domain even if they know the victim's user_id.
    let callbackUrl: URL;
    try {
      callbackUrl = new URL(menerio_callback);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid menerio_callback URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (callbackUrl.protocol !== "https:") {
      return new Response(
        JSON.stringify({ error: "menerio_callback must use https" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the user's Menerio API key + registered base URL
    const { data: integration, error: integrationError } = await supabase
      .from("menerio_integration")
      .select("menerio_api_key, menerio_base_url")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (integrationError || !integration) {
      console.error("Menerio integration lookup failed:", integrationError);
      return new Response(
        JSON.stringify({
          error: "No active Menerio connection found for this user",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Allowlist check: callback host must match the user's registered Menerio base URL
    try {
      const baseUrl = new URL(integration.menerio_base_url);
      if (baseUrl.host !== callbackUrl.host) {
        return new Response(
          JSON.stringify({
            error:
              "menerio_callback host does not match registered Menerio base URL",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Stored Menerio base URL is invalid" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const PUBLIC_SITE_URL =
      Deno.env.get("PUBLIC_SITE_URL") || "https://querino.lovable.app";

    // Call back to Menerio to create the bidirectional link
    const callbackRes = await fetch(menerio_callback, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": integration.menerio_api_key,
      },
      body: JSON.stringify({
        menerio_note_id,
        app_name: "querino",
        external_id: prompt_id,
        external_url: `${PUBLIC_SITE_URL}/prompts/${prompt_slug || prompt_id}`,
        entity_type: "prompt",
      }),
    });

    const callbackBody = await callbackRes.text();
    console.log("Menerio callback response:", callbackRes.status, callbackBody);

    if (!callbackRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Menerio callback failed",
          status: callbackRes.status,
          body: callbackBody,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Record the link on the prompt so later syncs find the note. The error
    // used to be dropped here, so the client saw ok: true while the prompt
    // stayed unlinked; now a failed write is a failed request.
    const { data: linked, error: linkError } = await supabase
      .from("prompts")
      .update({
        menerio_note_id,
        menerio_synced: true,
        menerio_synced_at: new Date().toISOString(),
      })
      .eq("id", prompt_id)
      .eq("author_id", user_id)
      .select("id");

    if (linkError) {
      console.error("menerio-link-callback prompt update failed:", linkError);
      return new Response(
        JSON.stringify({ error: "Could not record the link on the prompt" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!linked || linked.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No prompt with this id belongs to the signed-in user",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("menerio-link-callback error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
