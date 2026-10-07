// Parser for Prompt Kit Markdown documents.
// Convention: a line matching `^## Prompt:\s*<title>` marks the start of a new
// prompt item. The prompt body runs until a `<!-- /prompt -->` line, the next
// such heading, or the end of the document, whichever comes first. Anything
// before the first heading, or after an end marker, is "prose" and is
// rendered as Markdown around the prompt cards.
//
// The end marker exists since 2026-10-07. Before it a prompt section had no
// end, so a note written after prompt 1 in the editor became part of prompt 1:
// on the public card, in "Copy this prompt", and in the saved kit on the next
// save. The editor now writes the marker after every prompt block. Kits saved
// without it parse exactly as before: the prompt runs to the next heading.

export interface PromptKitItem {
  /** 1-based index of the item in the document */
  index: number;
  /** Title parsed from `## Prompt: <title>` */
  title: string;
  /** Body content (without the heading line, trimmed) */
  body: string;
  /** 0-based line of the heading in the source markdown */
  headingLine: number;
}

export type PromptKitSegment =
  | { type: "prose"; markdown: string }
  | { type: "prompt"; index: number; title: string; body: string };

export const PROMPT_HEADING_RE = /^##\s*Prompt:\s*(.*)$/i;

/** The line the editor writes after each prompt body. */
export const PROMPT_END_MARKER = "<!-- /prompt -->";

const PROMPT_END_RE = /^\s*<!--\s*\/prompt\s*-->\s*$/i;

export function isPromptEndLine(line: string): boolean {
  return PROMPT_END_RE.test(line);
}

/**
 * The kit with its end markers taken out, for places that hand the whole
 * document to a person (copy the kit, the card's preview). A marker is an
 * HTML comment, invisible in most Markdown viewers but not in a plain text box.
 *
 * Only the marker lines go, each with the one blank line its removal leaves
 * behind: the editor writes the marker between two blank lines, and without
 * it they would be two in a row. The first version collapsed every run of
 * blank lines in the whole kit, so a prompt body that keeps two blank lines on
 * purpose (a gap before pasted input, say) was copied without them.
 */
export function stripPromptEndMarkers(markdown: string): string {
  if (!markdown) return "";
  const lines = markdown.split("\n");
  const kept: string[] = [];
  const isBlank = (line: string | undefined) =>
    line !== undefined && line.trim() === "";
  for (let i = 0; i < lines.length; i++) {
    if (!isPromptEndLine(lines[i])) {
      kept.push(lines[i]);
      continue;
    }
    const atStart = kept.length === 0;
    const before = kept[kept.length - 1];
    const after = lines[i + 1];
    if (isBlank(after) && (atStart || isBlank(before))) {
      // Blank on both sides, or a marker opening the document: drop the
      // blank line that follows it.
      i++;
    } else if (after === undefined && isBlank(before)) {
      // A marker closing the document: drop the blank line before it.
      kept.pop();
    }
  }
  return kept.join("\n");
}

export function parsePromptKitItems(markdown: string): PromptKitItem[] {
  return parseKit(markdown).items;
}

export function countPromptItems(markdown: string): number {
  return parsePromptKitItems(markdown).length;
}

/**
 * Parse the full kit document into an ordered list of prose and prompt
 * segments. Used to render an article-style detail view where free
 * commentary appears between prompt cards.
 */
export function parsePromptKitDocument(markdown: string): PromptKitSegment[] {
  return parseKit(markdown).segments;
}

function parseKit(markdown: string): {
  items: PromptKitItem[];
  segments: PromptKitSegment[];
} {
  const items: PromptKitItem[] = [];
  const segments: PromptKitSegment[] = [];
  if (!markdown) return { items, segments };

  const lines = markdown.split("\n");
  let proseBuf: string[] = [];
  let current: {
    title: string;
    bodyLines: string[];
    headingLine: number;
  } | null = null;

  const flushProse = () => {
    const md = proseBuf.join("\n").trim();
    if (md) segments.push({ type: "prose", markdown: md });
    proseBuf = [];
  };

  const flushPrompt = () => {
    if (!current) return;
    const index = items.length + 1;
    const title = current.title || "Untitled";
    const body = current.bodyLines.join("\n").trim();
    items.push({ index, title, body, headingLine: current.headingLine });
    segments.push({ type: "prompt", index, title, body });
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(PROMPT_HEADING_RE);
    if (m) {
      if (current) flushPrompt();
      else flushProse();
      current = { title: (m[1] || "").trim(), bodyLines: [], headingLine: i };
    } else if (isPromptEndLine(line)) {
      // A marker outside a prompt (a hand edit, a deleted block) is dropped
      // rather than shown: the page renders raw HTML in prose as text.
      flushPrompt();
    } else if (current) {
      current.bodyLines.push(line);
    } else {
      proseBuf.push(line);
    }
  }
  if (current) flushPrompt();
  else flushProse();

  return { items, segments };
}
