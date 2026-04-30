import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Determine if service-role or user token
    const isServiceRole = token === serviceKey;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let userId: string;
    if (isServiceRole) {
      // For service-role calls, user_id must be in the body
      const body = await req.json();
      if (!body.user_id) {
        return json({ error: "user_id required for service-role calls" }, 400);
      }
      userId = body.user_id;
      return await handleSync(
        createClient(supabaseUrl, serviceKey),
        userId,
        body.artifact_type,
        body.artifact_id
      );
    } else {
      const { data: claimsData, error: claimsErr } =
        await userClient.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims) {
        return json({ error: "Unauthorized" }, 401);
      }
      userId = claimsData.claims.sub as string;
      const body = await req.json();
      return await handleSync(
        createClient(supabaseUrl, serviceKey),
        userId,
        body.artifact_type,
        body.artifact_id,
        true
      );
    }
  } catch (err) {
    console.error("render-for-menerio error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

async function handleSync(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  artifactType: string,
  artifactId: string,
  checkOwnership = false
) {
  // Validate input
  if (!artifactType || !VALID_TYPES.includes(artifactType as ArtifactType)) {
    return json(
      { error: `Invalid artifact_type. Must be one of: ${VALID_TYPES.join(", ")}` },
      400
    );
  }
  if (!artifactId) {
    return json({ error: "artifact_id is required" }, 400);
  }

  // 1. Load Menerio integration settings
  const { data: integration, error: intErr } = await adminClient
    .from("menerio_integration")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (intErr || !integration) {
    return json({ error: "Keine aktive Menerio-Integration" }, 400);
  }

  // 2. Load artifact
  const tableName =
    artifactType === "prompt" ? "prompts" :
    artifactType === "prompt_kit" ? "prompt_kits" :
    `${artifactType}s`;
  const { data: artifact, error: artErr } = await adminClient
    .from(tableName)
    .select("*")
    .eq("id", artifactId)
    .maybeSingle();

  if (artErr || !artifact) {
    return json({ error: `Artefakt nicht gefunden` }, 404);
  }

  // Check ownership
  if (checkOwnership && artifact.author_id !== userId) {
    return json({ error: "Du kannst nur eigene Artefakte synchronisieren" }, 403);
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

  const sourceUrl = `https://querino.ai/${tableName}/${artifact.slug || artifact.id}`;

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
  const menerioUrl = `${integration.menerio_base_url.replace(/\/$/, "")}/receive-note`;

  let menerioRes: Response;
  try {
    menerioRes = await fetch(menerioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": integration.menerio_api_key,
      },
      body: JSON.stringify(notePayload),
    });
  } catch (_netErr) {
    return json(
      { error: "Menerio ist nicht erreichbar. Bitte versuche es später." },
      502
    );
  }

  if (menerioRes.status === 401) {
    await menerioRes.text();
    return json(
      {
        error:
          "Menerio API-Key ungültig. Bitte prüfe deine Einstellungen unter /settings/menerio.",
      },
      401
    );
  }

  if (!menerioRes.ok) {
    const errText = await menerioRes.text();
    return json({ error: `Sync fehlgeschlagen: ${errText}` }, 502);
  }

  const menerioData = await menerioRes.json();

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
  const isPublic =
    type === "prompt" ? a.is_public : a.published;
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
        `\n## Prompt-Text\n\n${a.content || "—"}`
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
        `\n## Skill-Inhalt\n\n${a.content || "—"}`
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
        `\n## Prompt-Kit-Inhalt\n\n${a.content || "—"}`
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
        `\n## Workflow-Inhalt\n\n${a.content || "—"}`
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
