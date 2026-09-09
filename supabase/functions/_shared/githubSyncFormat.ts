// One definition of what a synced artifact looks like in GitHub: where the
// file goes and what is in it.
//
// Two functions write to the same repository: github-sync-worker pushes one
// artifact at a time from the queue, and github-sync rewrites every managed
// folder on demand. Until 2026-09-08 each had its own idea of the file name
// (the worker `<slug>-<shortid>.md`, the manual sync `<slugified title>.md`)
// and its own Markdown body. The manual sync therefore deleted every file the
// worker had written, the worker's recorded blob SHAs pointed at nothing, and
// its next upsert failed three times in a row. Both now import from here, so a
// path or a body can only ever change in one place.

export type ArtifactType = "prompt" | "skill" | "workflow" | "prompt_kit";

export const ARTIFACT_TYPES: ArtifactType[] = [
  "prompt",
  "skill",
  "workflow",
  "prompt_kit",
];

export const TABLE_FOR_TYPE: Record<ArtifactType, string> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
};

// ---------------- Markdown generation ----------------

function yamlValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(", ")}]`;
  }
  if (value === null || value === undefined) return '""';
  if (typeof value === "string") {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return String(value);
}

function buildFrontmatter(fields: Record<string, unknown>): string {
  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${yamlValue(v)}`);
  return `---\n${lines.join("\n")}\n---\n`;
}

export function generateMarkdown(
  type: ArtifactType,
  // deno-lint-ignore no-explicit-any
  row: Record<string, any>,
): string {
  const common = {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    tags: row.tags ?? [],
    language: row.language ?? "en",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (type === "prompt") {
    const fm = buildFrontmatter({
      ...common,
      is_public: row.is_public ?? false,
    });
    return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n## Prompt Content\n\n\`\`\`\n${row.content ?? ""}\n\`\`\`\n`;
  }
  if (type === "skill") {
    const fm = buildFrontmatter({
      ...common,
      published: row.published ?? false,
    });
    return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n## Skill Content\n\n${row.content ?? ""}\n`;
  }
  if (type === "workflow") {
    const fm = buildFrontmatter({
      ...common,
      published: row.published ?? false,
    });
    return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n## Workflow\n\n${row.content ?? ""}\n`;
  }
  // prompt_kit
  const fm = buildFrontmatter({
    ...common,
    published: row.published ?? false,
  });
  return `${fm}\n# ${row.title}\n\n${row.description ?? ""}\n\n${row.content ?? ""}\n`;
}

// ---------------- Paths ----------------

export function folderForType(type: ArtifactType): string {
  return {
    prompt: "prompts",
    skill: "skills",
    workflow: "workflows",
    prompt_kit: "prompt-kits",
  }[type];
}

/** The configured base folder with surrounding slashes removed, "" if none. */
export function normalizeBaseFolder(
  baseFolder: string | null | undefined,
): string {
  return (baseFolder || "").replace(/^\/+|\/+$/g, "");
}

/**
 * The four folders a sync owns inside the base folder, each with a trailing
 * slash. Anything under them that neither function wrote is fair game for the
 * manual sync to delete, so the list has to match folderForType exactly.
 */
export function managedFolders(
  baseFolder: string | null | undefined,
): string[] {
  const trimmed = normalizeBaseFolder(baseFolder);
  return ARTIFACT_TYPES.map((t) => {
    const sub = folderForType(t);
    return trimmed ? `${trimmed}/${sub}/` : `${sub}/`;
  });
}

/**
 * `<folder>/<subfolder>/<slug>-<first 8 chars of the id>.md`. The id suffix is
 * what keeps two artifacts with the same slug from overwriting each other, and
 * what lets a file be found again after the title changes.
 */
export function buildPath(
  baseFolder: string | null | undefined,
  type: ArtifactType,
  row: { slug?: string | null; id: string },
): string {
  const slug = row.slug && row.slug.length > 0 ? row.slug : row.id;
  const shortId = row.id.slice(0, 8);
  const file = `${slug}-${shortId}.md`;
  const subFolder = folderForType(type);
  const trimmed = normalizeBaseFolder(baseFolder);
  return trimmed ? `${trimmed}/${subFolder}/${file}` : `${subFolder}/${file}`;
}
