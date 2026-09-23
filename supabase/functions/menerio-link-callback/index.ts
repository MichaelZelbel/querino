import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCallerUserId } from "../_shared/llm.ts";
import { readMenerioApiKey } from "../_shared/menerioKey.ts";
import { assertMenerioBaseUrl } from "../_shared/menerioUrl.ts";

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

    // Validate callback URL: must be https. Its host is allowlisted below
    // against the one Menerio host, so the API key cannot be sent anywhere
    // else.
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
      .select("menerio_base_url")
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

    let menerioApiKey: string;
    try {
      menerioApiKey = await readMenerioApiKey(supabase, user_id);
    } catch (keyErr) {
      console.error("Menerio key lookup failed:", keyErr);
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

    // Allowlist check. menerio_base_url is user-writable through PostgREST,
    // so matching the callback against it alone let anyone point both at a
    // host of their choosing and receive their own API key there, or make
    // this function POST to any address from inside the Supabase network.
    // The stored address is first checked against the one Menerio host
    // (_shared/menerioUrl.ts), and the callback must be on exactly that
    // host, with no credentials and no port.
    let allowedHost: string;
    try {
      allowedHost = new URL(assertMenerioBaseUrl(integration.menerio_base_url))
        .host;
    } catch (urlErr) {
      console.warn(
        `menerio-link-callback: ${urlErr instanceof Error ? urlErr.message : urlErr}`,
      );
      return new Response(
        JSON.stringify({
          error: "The Menerio address on this account is not allowed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (
      callbackUrl.host !== allowedHost ||
      callbackUrl.username !== "" ||
      callbackUrl.password !== ""
    ) {
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

    // The prompt must be the caller's own before Menerio is told a link
    // exists. The update at the end already checks author_id, but it runs
    // after the outward call, so a foreign or made-up prompt_id still made
    // Menerio record a link to it and only then got a 404.
    const { data: ownedPrompt, error: ownedError } = await supabase
      .from("prompts")
      .select("id")
      .eq("id", prompt_id)
      .eq("author_id", user_id)
      .maybeSingle();

    if (ownedError) {
      console.error("menerio-link-callback prompt lookup failed:", ownedError);
      return new Response(
        JSON.stringify({ error: "Could not look up the prompt" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!ownedPrompt) {
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

    const PUBLIC_SITE_URL =
      Deno.env.get("PUBLIC_SITE_URL") || "https://querino.lovable.app";

    // Call back to Menerio to create the bidirectional link. The checked URL
    // is what is fetched, not the raw string. A redirect is not followed: it
    // would carry the API key to wherever Menerio's answer pointed. A Menerio
    // that does not answer in 15 s fails the request instead of holding it.
    let callbackRes: Response;
    try {
      callbackRes = await fetch(callbackUrl.href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": menerioApiKey,
        },
        body: JSON.stringify({
          menerio_note_id,
          app_name: "querino",
          external_id: prompt_id,
          external_url: `${PUBLIC_SITE_URL}/prompts/${prompt_slug || prompt_id}`,
          entity_type: "prompt",
        }),
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (fetchErr) {
      console.error("Menerio callback request failed:", fetchErr);
      return new Response(
        JSON.stringify({ error: "Menerio callback failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // The body is logged, shortened, and never handed to the client: the
    // response of a remote host is not this function's to relay.
    const callbackBody = await callbackRes.text().catch(() => "");
    console.log(
      "Menerio callback response:",
      callbackRes.status,
      callbackBody.slice(0, 500),
    );

    if (!callbackRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Menerio callback failed",
          status: callbackRes.status,
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
