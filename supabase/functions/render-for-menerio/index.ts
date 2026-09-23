import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { publicUrlFor, tableFor } from "../_shared/artifactRoutes.ts";
import { assertMenerioBaseUrl } from "../_shared/menerioUrl.ts";
import {
  MissingMenerioKeyError,
  readMenerioApiKey,
} from "../_shared/menerioKey.ts";

// The sync button waits on this call; a Menerio that never answers used to
// hold the browser until the platform killed the function.
const MENERIO_TIMEOUT_MS = 15_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TYPES = ["prompt", "skill", "workflow", "prompt_kit"] as const;
type ArtifactType = (typeof VALID_TYPES)[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    // The identity comes from the JWT and from nowhere else. An earlier
    // version compared the bearer token to the service-role key and then read
    // user_id from the body, which is the one thing CLAUDE.md forbids. The only
    // caller is the sync button in the browser, and it always sends a user
    // session, so there is no machine path to keep.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    return await handleSync(
      createClient(supabaseUrl, serviceKey),
      userId,
      body.artifact_type,
      body.artifact_id,
    );
  } catch (err) {
    console.error("render-for-menerio error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});

async function handleSync(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  artifactType: string,
  artifactId: string,
) {
  // Validate input
  if (!artifactType || !VALID_TYPES.includes(artifactType as ArtifactType)) {
    return json(
      {
        error: `Invalid artifact_type. Must be one of: ${VALID_TYPES.join(", ")}`,
      },
      400,
    );
  }
  if (!artifactId) {
    return json({ error: "artifact_id is required" }, 400);
  }

  // 1. Load Menerio integration settings. The service client has no
  // Database type, so supabase-js resolves the row to `never`; naming the
  // columns this function reads is what makes them readable. The key is not
  // one of them: it lives in Vault and is read below.
  const { data: integrationRow, error: intErr } = await adminClient
    .from("menerio_integration")
    .select("id, menerio_base_url")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  const integration = integrationRow as {
    id: string;
    menerio_base_url: string;
  } | null;

  // A failed read is not a missing integration. Until 2026-09-23 both answered
  // "Keine aktive Menerio-Integration" with a 400, so a database or Vault
  // outage told the user to reconnect Menerio and left no trace in the logs.
  if (intErr) {
    console.error(
      "[render-for-menerio] reading menerio_integration failed:",
      intErr.message,
    );
    return json({ error: "Reading the Menerio integration failed" }, 500);
  }
  if (!integration) {
    return json({ error: "Keine aktive Menerio-Integration" }, 400);
  }

  let menerioApiKey: string;
  try {
    menerioApiKey = await readMenerioApiKey(adminClient, userId);
  } catch (keyErr) {
    if (keyErr instanceof MissingMenerioKeyError) {
      return json({ error: "Keine aktive Menerio-Integration" }, 400);
    }
    console.error(
      "[render-for-menerio] key lookup failed:",
      keyErr instanceof Error ? keyErr.message : keyErr,
    );
    return json({ error: "Reading the Menerio key failed" }, 500);
  }

  // The base URL column is user-writable through PostgREST, so it is checked
  // against the one Menerio host before this user's API key is sent anywhere
  // (see _shared/menerioUrl.ts).
  let menerioBase: string;
  try {
    menerioBase = assertMenerioBaseUrl(integration.menerio_base_url);
  } catch (urlErr) {
    console.warn(
      `menerio_integration ${integration.id}: ${urlErr instanceof Error ? urlErr.message : urlErr}`,
    );
    return json(
      { error: "The Menerio address on this account is not allowed" },
      400,
    );
  }

  // 2. Load artifact
  const tableName = tableFor(artifactType);
  const { data: artifact, error: artErr } = await adminClient
    .from(tableName)
    .select("*")
    .eq("id", artifactId)
    .maybeSingle();

  if (artErr) {
    console.error(
      `[render-for-menerio] reading ${tableName} ${artifactId} failed:`,
      artErr.message,
    );
    return json({ error: "Reading the artifact failed" }, 500);
  }
  if (!artifact) {
    return json({ error: `Artefakt nicht gefunden` }, 404);
  }

  // Only the author may push their own artifact into their own Menerio.
  if (artifact.author_id !== userId) {
    return json(
      { error: "Du kannst nur eigene Artefakte synchronisieren" },
      403,
    );
  }

  // 3. Build Menerio note object
  const tags = [
    artifactType,
    ...(artifact.tags || []),
    ...(artifact.category ? [artifact.category] : []),
  ].filter(Boolean);

  const isPublic =
    artifactType === "prompt" ? artifact.is_public : artifact.published;

  const structuredFields: Record<string, unknown> = {
    artifact_type: artifactType,
    title: artifact.title,
    category: artifact.category || null,
    slug: artifact.slug || null,
    is_public: !!isPublic,
    rating_avg: artifact.rating_avg || 0,
    rating_count: artifact.rating_count || 0,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
  };

  // Type-specific structured fields
  if (artifactType === "workflow" && artifact.json) {
    structuredFields.has_structured_data = true;
  }

  const body = buildBody(artifactType as ArtifactType, artifact);

  // The public route, not the table name: prompt kits live under
  // /prompt-kits/, and the table-derived /prompt_kits/ link was a 404.
  const sourceUrl = publicUrlFor(artifactType, artifact.slug || artifact.id);

  const notePayload = {
    source_id: artifact.id,
    title: artifact.title,
    entity_type: artifactType,
    tags,
    related: [],
    structured_fields: structuredFields,
    source_url: sourceUrl,
    body,
  };

  // 5. Send to Menerio
  const menerioUrl = `${menerioBase}/receive-note`;

  let menerioRes: Response;
  try {
    menerioRes = await fetch(menerioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": menerioApiKey,
      },
      body: JSON.stringify(notePayload),
      signal: AbortSignal.timeout(MENERIO_TIMEOUT_MS),
    });
  } catch (_netErr) {
    return json(
      { error: "Menerio ist nicht erreichbar. Bitte versuche es später." },
      502,
    );
  }

  // Menerio's answer is logged and never echoed: what it says is about its
  // own request, not ours, and an upstream body handed to the browser is a
  // way for one service's error page to become another's. And a 401 stays
  // upstream too: the browser client treats a 401 from functions.invoke as
  // an expired Querino session and logs the user out, when the only thing
  // wrong is the Menerio key they stored.
  if (!menerioRes.ok) {
    const errText = await menerioRes.text().catch(() => "");
    console.error(
      `Menerio answered ${menerioRes.status} for artifact ${artifactId}:`,
      errText.slice(0, 500),
    );
    if (menerioRes.status === 401) {
      return json(
        {
          error:
            "Menerio hat den API-Key abgelehnt. Bitte prüfe deine Einstellungen unter /settings/menerio.",
        },
        502,
      );
    }
    return json(
      {
        error: "Sync fehlgeschlagen: Menerio hat mit einem Fehler geantwortet.",
      },
      502,
    );
  }

  let menerioData: { note_id?: string; action?: string };
  try {
    menerioData = await menerioRes.json();
  } catch (parseErr) {
    console.error(
      `Menerio answered 2xx without JSON for artifact ${artifactId}:`,
      parseErr instanceof Error ? parseErr.message : parseErr,
    );
    return json(
      { error: "Sync fehlgeschlagen: Menerio hat unerwartet geantwortet." },
      502,
    );
  }

  // 6. Update artifact sync fields
  await adminClient
    .from(tableName)
    .update({
      menerio_synced: true,
      menerio_note_id: menerioData.note_id || null,
      menerio_synced_at: new Date().toISOString(),
    })
    .eq("id", artifactId);

  // Update integration last_sync_at
  await adminClient
    .from("menerio_integration")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", integration.id);

  return json({
    status: "success",
    action: menerioData.action || "synced",
    note_id: menerioData.note_id || null,
  });
}

function buildBody(type: ArtifactType, a: Record<string, unknown>): string {
  const tagsStr = (a.tags as string[] | null)?.join(", ") || "—";
  const ratingStr = `${a.rating_avg || 0}/5 (${a.rating_count || 0} Bewertungen)`;
  const isPublic = type === "prompt" ? a.is_public : a.published;
  const publicLabel = isPublic ? "Ja" : "Nein";

  const lines: string[] = [`# ${a.title}`];

  switch (type) {
    case "prompt":
      lines.push(
        `\n**Typ:** Prompt`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Öffentlich:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `**Kopien:** ${a.copies_count || 0}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Prompt-Text\n\n${a.content || "—"}`,
      );
      break;

    case "skill":
      lines.push(
        `\n**Typ:** Skill`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Skill-Inhalt\n\n${a.content || "—"}`,
      );
      break;

    case "prompt_kit":
      lines.push(
        `\n**Typ:** Prompt Kit`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Prompt-Kit-Inhalt\n\n${a.content || "—"}`,
      );
      break;

    case "workflow":
      lines.push(
        `\n**Typ:** Workflow`,
        `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`,
        `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Workflow-Inhalt\n\n${a.content || "—"}`,
      );
      break;
  }

  return lines.join("\n");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
