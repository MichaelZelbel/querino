// What the review window can say about the text a suggestion was written
// against (suggestions.base_content, recorded since 2026-10-07).

export type SuggestionBaseState =
  /** The artifact still reads as it did when the suggestion was written. */
  | "unchanged"
  /** The artifact was edited after the suggestion was written. */
  | "changed"
  /** An older suggestion: nobody recorded what it was based on. */
  | "unknown";

function normalise(text: string): string {
  return text.replace(/\r\n?/g, "\n").trimEnd();
}

export function suggestionBaseState(
  baseContent: string | null | undefined,
  currentContent: string,
): SuggestionBaseState {
  if (baseContent === null || baseContent === undefined) return "unknown";
  return normalise(baseContent) === normalise(currentContent ?? "")
    ? "unchanged"
    : "changed";
}

/** The recorded base text, or null for a suggestion written before 2026-10-07. */
export function baseContentOf(suggestion: object): string | null {
  const value = (suggestion as { base_content?: unknown }).base_content;
  return typeof value === "string" ? value : null;
}
