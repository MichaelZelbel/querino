// ONE-TIME bootstrap: stores this project's service-role key (available to
// edge functions via env) into the Vault secret `service_role_key`, which the
// notify_admin_on_signup trigger needs. Safe to expose: it only ever writes
// the CORRECT value (idempotent) and never returns or logs the key itself.
// Delete this function after it has run successfully once.

import { getServiceClient } from "../_shared/llm.ts";

Deno.serve(async () => {
  const headers = { "Content-Type": "application/json" };

  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY not in env" }), {
      status: 500,
      headers,
    });
  }

  const sb = getServiceClient();
  const { data, error } = await sb.rpc("store_service_role_key" as never, {
    p_key: key,
  } as never);

  if (error) {
    console.error("[bootstrap-vault-secret] RPC error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }

  return new Response(JSON.stringify({ result: data }), { headers });
});
