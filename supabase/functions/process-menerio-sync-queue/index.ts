import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 1. Fetch up to 10 pending/delete_pending entries (oldest first)
    const { data: queue, error: fetchErr } = await adminClient
      .from("menerio_sync_queue")
      .select("*")
      .in("status", ["pending", "delete_pending"])
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchErr || !queue || queue.length === 0) {
      return json({ processed: 0 });
    }

    // 2. Mark as processing
    const ids = queue.map((q: any) => q.id);
    await adminClient
      .from("menerio_sync_queue")
      .update({ status: "processing" })
      .in("id", ids);

    let processed = 0;
    let failed = 0;

    // 3. Process each entry
    for (const item of queue) {
      try {
        // Check user has active menerio integration with auto_sync
        const { data: integration } = await adminClient
          .from("menerio_integration")
          .select("*")
          .eq("user_id", item.user_id)
          .eq("is_active", true)
          .eq("auto_sync", true)
          .maybeSingle();

        if (!integration) {
          await markCompleted(adminClient, item.id, "skipped: no active auto-sync integration");
          processed++;
          continue;
        }

        // Check if artifact_type is in sync_artifact_types
        if (!integration.sync_artifact_types?.includes(item.artifact_type)) {
          await markCompleted(adminClient, item.id, "skipped: artifact type not in sync list");
          processed++;
          continue;
        }

        if (item.status === "delete_pending") {
          // Handle delete: send "deleted" update to Menerio
          await handleDelete(adminClient, integration, item);
        } else {
          // Handle sync: render and send to Menerio
          await handleSync(adminClient, integration, item);
        }

        await adminClient
          .from("menerio_sync_queue")
          .update({ status: "completed", processed_at: new Date().toISOString() })
          .eq("id", item.id);

        processed++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        await adminClient
          .from("menerio_sync_queue")
          .update({ status: "failed", error_message: errMsg, processed_at: new Date().toISOString() })
          .eq("id", item.id);
        failed++;
      }
    }

    // 4. Clean up completed entries older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await adminClient
      .from("menerio_sync_queue")
      .delete()
      .eq("status", "completed")
      .lt("processed_at", cutoff);

    return json({ processed, failed, total: queue.length });
  } catch (err) {
    console.error("process-menerio-sync-queue error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

async function handleSync(
  adminClient: ReturnType<typeof createClient>,
  integration: any,
  item: any
) {
  const tableName = item.artifact_type === "prompt" ? "prompts" : `${item.artifact_type}s`;

  const { data: artifact, error } = await adminClient
    .from(tableName)
    .select("*")
    .eq("id", item.artifact_id)
    .maybeSingle();

  if (error || !artifact) {
    throw new Error(`Artifact not found: ${item.artifact_id}`);
  }

  const notePayload = buildNotePayload(item.artifact_type, artifact, tableName);

  const menerioUrl = `${integration.menerio_base_url.replace(/\/$/, "")}/receive-note`;
  const res = await fetch(menerioUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": integration.menerio_api_key,
    },
    body: JSON.stringify(notePayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Menerio returned ${res.status}: ${errText}`);
  }

  const menerioData = await res.json();

  // Update artifact sync fields
  await adminClient
    .from(tableName)
    .update({
      menerio_synced: true,
      menerio_note_id: menerioData.note_id || null,
      menerio_synced_at: new Date().toISOString(),
    })
    .eq("id", item.artifact_id);

  // Update integration last_sync_at
  await adminClient
    .from("menerio_integration")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("id", integration.id);
}

async function handleDelete(
  adminClient: ReturnType<typeof createClient>,
  integration: any,
  item: any
) {
  // Send a "deleted" marker to Menerio
  const notePayload = {
    source_id: item.artifact_id,
    title: `[Gelöscht] ${item.artifact_type}`,
    entity_type: item.artifact_type,
    tags: [item.artifact_type, "gelöscht"],
    related: [],
    structured_fields: {
      artifact_type: item.artifact_type,
      deleted: true,
    },
    source_url: "",
    body: "[Gelöscht] Dieses Artefakt wurde in Querino gelöscht.",
  };

  const menerioUrl = `${integration.menerio_base_url.replace(/\/$/, "")}/receive-note`;
  const res = await fetch(menerioUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": integration.menerio_api_key,
    },
    body: JSON.stringify(notePayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Menerio delete sync returned ${res.status}: ${errText}`);
  }

  await res.json();
}

function buildNotePayload(artifactType: string, artifact: any, tableName: string) {
  const tags = [
    artifactType,
    ...(artifact.tags || []),
    ...(artifact.category ? [artifact.category] : []),
  ].filter(Boolean);

  const isPublic = artifactType === "prompt" ? artifact.is_public : artifact.published;

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

  if (artifactType === "claw") {
    structuredFields.source = artifact.source;
    structuredFields.skill_source_type = artifact.skill_source_type;
    structuredFields.skill_source_ref = artifact.skill_source_ref;
  }
  if (artifactType === "workflow" && artifact.json) {
    structuredFields.has_structured_data = true;
  }

  const body = buildBody(artifactType, artifact);
  const sourceUrl = `https://querino.ai/${tableName}/${artifact.slug || artifact.id}`;

  return {
    source_id: artifact.id,
    title: artifact.title,
    entity_type: artifactType,
    tags,
    related: [],
    structured_fields: structuredFields,
    source_url: sourceUrl,
    body,
  };
}

function buildBody(type: string, a: Record<string, unknown>): string {
  const tagsStr = (a.tags as string[] | null)?.join(", ") || "—";
  const ratingStr = `${a.rating_avg || 0}/5 (${a.rating_count || 0} Bewertungen)`;
  const isPublic = type === "prompt" ? a.is_public : a.published;
  const publicLabel = isPublic ? "Ja" : "Nein";

  const lines: string[] = [`# ${a.title}`];

  switch (type) {
    case "prompt":
      lines.push(
        `\n**Typ:** Prompt`, `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`, `**Öffentlich:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`, `**Kopien:** ${a.copies_count || 0}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Prompt-Text\n\n${a.content || "—"}`
      );
      break;
    case "skill":
      lines.push(
        `\n**Typ:** Skill`, `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`, `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Skill-Inhalt\n\n${a.content || "—"}`
      );
      break;
    case "claw":
      lines.push(
        `\n**Typ:** Claw`, `**Kategorie:** ${a.category || "—"}`,
        `**Quelle:** ${a.source || "—"}`, `**Tags:** ${tagsStr}`,
        `**Skill-Source:** ${a.skill_source_type || "—"} — ${a.skill_source_ref || "—"}`,
        `**Veröffentlicht:** ${publicLabel}`, `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## SKILL.md Inhalt\n\n${(a.skill_md_content as string) || (a.content as string) || "—"}`
      );
      break;
    case "workflow":
      lines.push(
        `\n**Typ:** Workflow`, `**Kategorie:** ${a.category || "—"}`,
        `**Tags:** ${tagsStr}`, `**Veröffentlicht:** ${publicLabel}`,
        `**Bewertung:** ${ratingStr}`,
        `\n## Beschreibung\n\n${a.description || "—"}`,
        `\n## Workflow-Inhalt\n\n${a.content || "—"}`
      );
      break;
  }

  return lines.join("\n");
}

async function markCompleted(client: ReturnType<typeof createClient>, id: string, note: string) {
  await client
    .from("menerio_sync_queue")
    .update({ status: "completed", error_message: note, processed_at: new Date().toISOString() })
    .eq("id", id);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
