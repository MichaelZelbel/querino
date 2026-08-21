// An artifact type has a table and it has a public route, and they are not the
// same word.
//
// Finding M7: process-menerio-sync-queue derived the link it sent to Menerio
// from the table name, so every prompt kit was announced as
// https://querino.ai/prompt_kits/<slug> with an underscore while the route is
// /prompt-kits/:slug with a hyphen. Every prompt kit ever synced linked to a
// 404. Prompts, skills and workflows were right by accident, which is why it
// survived.
//
// Both maps are explicit and exhaustive on purpose: a fifth artifact type
// should fail loudly here rather than be guessed at.

export const ARTIFACT_TYPES = ["prompt", "skill", "workflow", "prompt_kit"] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

const TABLE_BY_TYPE: Record<ArtifactType, string> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
};

const ROUTE_BY_TYPE: Record<ArtifactType, string> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt-kits",
};

export const SITE_ORIGIN = "https://querino.ai";

/** The database table an artifact type lives in. */
export function tableFor(artifactType: string): string {
  const table = TABLE_BY_TYPE[artifactType as ArtifactType];
  if (!table) throw new Error(`Unknown artifact type: ${artifactType}`);
  return table;
}

/** The public route segment an artifact type is served under. */
export function routeFor(artifactType: string): string {
  const route = ROUTE_BY_TYPE[artifactType as ArtifactType];
  if (!route) throw new Error(`Unknown artifact type: ${artifactType}`);
  return route;
}

/** The canonical public URL of one artifact. */
export function publicUrlFor(artifactType: string, slugOrId: string): string {
  return `${SITE_ORIGIN}/${routeFor(artifactType)}/${slugOrId}`;
}
