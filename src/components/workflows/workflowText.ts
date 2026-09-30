// The text a workflow shows and edits: its content, or for a legacy row the
// JSON it was stored as. The json column defaults to {}, which counts as
// "something" in JavaScript, so a workflow with no content opened showing "{}"
// and saving it wrote "{}" into content (one such row in production on
// 2026-09-30). An empty object or array is no content at all.
export function workflowText(
  content: string | null | undefined,
  json: unknown,
): string {
  if (content) return content;
  if (json === null || json === undefined || json === "") return "";
  if (typeof json === "string") return json;
  if (Array.isArray(json))
    return json.length ? JSON.stringify(json, null, 2) : "";
  if (typeof json === "object") {
    return Object.keys(json as object).length
      ? JSON.stringify(json, null, 2)
      : "";
  }
  return String(json);
}
