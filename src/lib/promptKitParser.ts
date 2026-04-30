// Parser for Prompt Kit Markdown documents.
// Convention: a line matching `^## Prompt:\s*<title>` marks the start of a new
// prompt item. Everything between two such headings (or until end of document)
// is the prompt body. Anything before the first heading or between prompts is
// treated as "prose" and is rendered as Markdown around the prompt cards.

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

const HEADING_RE = /^##\s*Prompt:\s*(.*)$/i;

export function parsePromptKitItems(markdown: string): PromptKitItem[] {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const items: PromptKitItem[] = [];
  let current: { title: string; bodyLines: string[]; headingLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(HEADING_RE);
    if (m) {
      if (current) {
        items.push({
          index: items.length + 1,
          title: current.title || "Untitled",
          body: current.bodyLines.join("\n").trim(),
          headingLine: current.headingLine,
        });
      }
      current = {
        title: (m[1] || "").trim(),
        bodyLines: [],
        headingLine: i,
      };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }

  if (current) {
    items.push({
      index: items.length + 1,
      title: current.title || "Untitled",
      body: current.bodyLines.join("\n").trim(),
      headingLine: current.headingLine,
    });
  }

  return items;
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
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const segments: PromptKitSegment[] = [];

  let proseBuf: string[] = [];
  let current: { title: string; bodyLines: string[] } | null = null;
  let promptCount = 0;

  const flushProse = () => {
    const md = proseBuf.join("\n").trim();
    if (md) segments.push({ type: "prose", markdown: md });
    proseBuf = [];
  };

  const flushPrompt = () => {
    if (!current) return;
    promptCount += 1;
    segments.push({
      type: "prompt",
      index: promptCount,
      title: current.title || "Untitled",
      body: current.bodyLines.join("\n").trim(),
    });
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(HEADING_RE);
    if (m) {
      if (current) flushPrompt();
      else flushProse();
      current = { title: (m[1] || "").trim(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    } else {
      proseBuf.push(line);
    }
  }
  if (current) flushPrompt();
  else flushProse();

  return segments;
}
