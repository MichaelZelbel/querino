// Tier 1 stopword matching for moderate-content, pulled out of the function on
// 2026-09-16 so it can be tested without a database.
//
// The text and every stopword go through the same normalisation, and a hit is
// a whole-word match on the normalised text. Before this the stopword was
// matched raw with String.includes, so "spic" fired on "conspicuous", "nude"
// on "denude", and a multi-word entry such as "rm -rf" could never fire at all,
// because the text had its "-" stripped and the stopword had not.

// Leet-speak and unicode normalization map
const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "^": "a",
  "8": "b",
  "(": "c",
  "<": "c",
  "3": "e",
  "6": "g",
  "#": "h",
  "!": "i",
  "1": "i",
  "|": "i",
  "0": "o",
  "5": "s",
  $: "s",
  "7": "t",
  "+": "t",
  "9": "g",
};

export function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  // Replace leet-speak characters
  normalized = normalized
    .split("")
    .map((ch) => LEET_MAP[ch] || ch)
    .join("");
  // Remove non-alphanumeric (keep spaces for word boundary detection)
  normalized = normalized.replace(/[^a-z0-9\s]/g, "");
  // Collapse repeated characters (e.g., "seeex" -> "sex")
  normalized = normalized.replace(/(.)\1{2,}/g, "$1$1");
  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
}

export interface Stopword {
  word: string;
  category?: string | null;
}

export interface StopwordHit {
  /** The stopword as stored, not its normalised form. */
  word: string;
  category: string | null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Every stopword that occurs in `text` as a whole word (or whole phrase, for
 * multi-word entries), in the order the list gives them. A stopword that
 * normalises to nothing, such as one made only of punctuation, is ignored
 * rather than matched against everything.
 */
export function findStopwordHits(
  text: string,
  stopwords: Stopword[],
): StopwordHit[] {
  const normalizedText = normalizeText(text);
  const hits: StopwordHit[] = [];
  if (!normalizedText) return hits;

  for (const sw of stopwords) {
    if (typeof sw.word !== "string") continue;
    const needle = normalizeText(sw.word);
    if (!needle) continue;
    const pattern = new RegExp(`\\b${escapeRegex(needle)}\\b`);
    if (pattern.test(normalizedText)) {
      hits.push({ word: sw.word, category: sw.category ?? null });
    }
  }
  return hits;
}
