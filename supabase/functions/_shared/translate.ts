// How much translate-artifact will take in one call.
//
// The content is capped to bound the cost of one call. Until 2026-09-30 the
// cap was a silent cut: the first 16,000 characters were translated and came
// back as the whole artifact, which the Translate dialog then prefilled into a
// new one. Nothing said the rest was missing, and eight artifacts in
// production (the longest a 69,984-character skill) were past the cut. A
// translation that loses its end is worse than none, so longer content is now
// refused before anything is charged, with a message that says why.

export const MAX_TRANSLATE_CHARS = 16_000;

/**
 * Null when `content` can be translated whole, otherwise the message to show.
 * Anything that is not a string counts as empty, as it always did.
 */
export function tooLongToTranslate(
  content: unknown,
  artifactType: string,
  max: number = MAX_TRANSLATE_CHARS,
): string | null {
  if (typeof content !== "string" || content.length <= max) return null;
  const what = (artifactType || "artifact").replace(/_/g, " ");
  return (
    `This ${what} is ${content.length.toLocaleString("en-US")} characters long, ` +
    `and translation handles up to ${max.toLocaleString("en-US")}. ` +
    "Nothing was translated and no credits were used."
  );
}
