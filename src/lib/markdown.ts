// Markdown import/export utilities for artefacts

export type ArtefactType = "prompt" | "skill" | "workflow" | "prompt_kit";

export interface MarkdownFrontmatter {
  title: string;
  type: ArtefactType;
  description?: string;
  tags?: string[];
  framework?: string;
}

export interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  content: string;
}

/**
 * Slugify a title for use as a filename
 */
export function slugify(title: string): string {
  if (!title || !title.trim()) {
    return "querino-export";
  }
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "querino-export"
  );
}

export function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildMarkdownContent(data: {
  title: string;
  type: ArtefactType;
  description?: string | null;
  tags?: string[] | null;
  framework?: string | null;
  content: string;
}): string {
  const frontmatterLines: string[] = ["---"];
  frontmatterLines.push(`title: ${quoteBareIfNeeded(data.title)}`);
  frontmatterLines.push(`type: ${data.type}`);
  if (data.description) {
    frontmatterLines.push(`description: ${quoteScalar(data.description)}`);
  }
  if (data.tags && data.tags.length > 0) {
    frontmatterLines.push(`tags: [${data.tags.map(quoteTag).join(", ")}]`);
  }
  if (data.framework) {
    frontmatterLines.push(`framework: ${quoteBareIfNeeded(data.framework)}`);
  }
  frontmatterLines.push("---");
  frontmatterLines.push("");
  frontmatterLines.push(data.content);
  return frontmatterLines.join("\n");
}

/**
 * The frontmatter block: a line that is only `---`, the fields, and the next
 * line that is only `---`. The closing fence used to be the first "---"
 * anywhere after the opening one, so a title or description containing
 * "---" cut the block in two and spilled the rest into the body.
 */
const FRONTMATTER_RE =
  /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

/**
 * Whether a leading `---` block belongs to a SKILL.md and so is part of the
 * file itself rather than metadata to lift into the form. A standard SKILL.md
 * opens with `name:`, `description:` and often `allowed-tools:`; stripping
 * that block left a skill that was no longer a valid SKILL.md (7 of 19
 * production skills carry one, 2026-10-07). `name:` is required in a SKILL.md
 * and neither of Querino's exports ("Download .md", the GitHub sync) writes
 * it, so it is the test, and only a top-level key counts.
 *
 * Every other block stays metadata, whatever else it carries. The first
 * version of this check kept any block with a key Querino did not know, so an
 * Obsidian note or a Jekyll post (title, tags, author, date) imported with its
 * YAML pasted into the prompt and no tags, where it used to import cleanly.
 * Unknown keys are simply ignored again.
 */
function isSkillFrontmatter(block: string): boolean {
  return block.split(/\r?\n/).some((line) => /^name\s*:/.test(line));
}

export function parseMarkdownContent(
  markdown: string,
  filename?: string,
): ParsedMarkdown {
  const trimmed = markdown.trim();
  const block = trimmed.match(FRONTMATTER_RE);
  if (block && isSkillFrontmatter(block[1] ?? "")) {
    // A SKILL.md: keep the whole file as the content and only read a title,
    // a description and any tags from it for the form.
    const body = trimmed.slice(block[0].length).trim();
    const own = parseFrontmatter(block[1] ?? "");
    const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const name = own.name?.trim();
    return {
      frontmatter: {
        title:
          heading ||
          own.title ||
          (name && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)
            ? unslugify(name)
            : name) ||
          deriveTitle(body, filename),
        type: "prompt",
        description: own.description || undefined,
        tags: own.tags?.length ? own.tags : undefined,
      },
      content: trimmed,
    };
  }
  if (block) {
    const content = trimmed.slice(block[0].length).trim();
    const frontmatter = parseFrontmatter(block[1] ?? "");
    return {
      frontmatter: {
        title: frontmatter.title || deriveTitle(content, filename),
        type: (frontmatter.type as ArtefactType) || "prompt",
        description: frontmatter.description,
        tags: frontmatter.tags,
        framework: frontmatter.framework,
      },
      content,
    };
  }
  return {
    frontmatter: {
      title: deriveTitle(trimmed, filename),
      type: "prompt",
    },
    content: trimmed,
  };
}

/**
 * Export and import have to agree on quoting, or a round trip changes the
 * data. The rules, kept deliberately small:
 *   - a double-quoted scalar escapes `\` as `\\` and `"` as `\"`
 *   - a double-quoted scalar also escapes a line break as `\n` (and `\r`):
 *     the frontmatter is read one line per field, and a description written
 *     with its line breaks in raw lost everything after the first one
 *   - a tag is written bare unless it contains a comma, a quote, a bracket,
 *     a line break or leading/trailing whitespace, in which case it is
 *     double-quoted the same way
 *   - a title or framework is written bare unless reading it back bare would
 *     change it (a leading quote or bracket, a line break, outer whitespace)
 *   - on import a double-quoted value is unescaped, a single-quoted value is
 *     taken literally, and a bare value is trimmed (unchanged behaviour for
 *     files written before this)
 */
function quoteScalar(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")}"`;
}

function quoteTag(tag: string): string {
  return /[,"'[\]\\\r\n]/.test(tag) || tag !== tag.trim()
    ? quoteScalar(tag)
    : tag;
}

function quoteBareIfNeeded(value: string): string {
  return /^["'[]/.test(value) || /[\r\n]/.test(value) || value !== value.trim()
    ? quoteScalar(value)
    : value;
}

const UNESCAPE: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  n: "\n",
  r: "\r",
};

function unquoteScalar(raw: string): string {
  const value = raw.trim();
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    // One pass, left to right, so "\\n" (an escaped backslash, then n) stays
    // a backslash and an n, exactly as the export wrote it.
    return value.slice(1, -1).replace(/\\(["\\nr])/g, (_, c) => UNESCAPE[c]);
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

/** Split `a, "b, c", d` on the commas that are outside quotes. */
function splitArrayItems(content: string): string[] {
  const items: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (quote) {
      current += ch;
      if (ch === "\\" && quote === '"' && i + 1 < content.length) {
        current += content[++i];
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if ((ch === '"' || ch === "'") && current.trim() === "") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ",") {
      items.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  items.push(current);
  return items.map(unquoteScalar).filter(Boolean);
}

/** True when `text` ends in a double quote that no backslash escapes. */
function endsWithClosingQuote(text: string): boolean {
  if (!text.endsWith('"')) return false;
  let backslashes = 0;
  for (let i = text.length - 2; i >= 0 && text[i] === "\\"; i--) {
    backslashes++;
  }
  return backslashes % 2 === 0;
}

interface Frontmatter {
  title?: string;
  type?: string;
  description?: string;
  tags?: string[];
  framework?: string;
  /** A SKILL.md's `name:`, used for the title when the body has no heading. */
  name?: string;
}

function parseFrontmatter(str: string): Frontmatter {
  const fields: Record<string, string> = {};
  let tags: string[] | undefined;
  const lines = str.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const rawValue = line.slice(colonIndex + 1);
    let value = rawValue.trim();

    // Exports before 2026-09-30 wrote a description's line breaks in raw, so
    // its quoted value runs over several lines. Read on to the closing quote
    // instead of keeping only the first line (with a stray quote in front).
    // The first line keeps its trailing spaces: they are inside the quotes.
    if (
      value.startsWith('"') &&
      (value.length < 2 || !endsWithClosingQuote(value))
    ) {
      for (let j = i + 1; j < lines.length; j++) {
        if (endsWithClosingQuote(lines[j].trimEnd())) {
          value = [rawValue.trimStart(), ...lines.slice(i + 1, j + 1)]
            .join("\n")
            .trimEnd();
          i = j;
          break;
        }
      }
    }

    if (key === "tags") {
      if (value.startsWith("[") && value.endsWith("]")) {
        tags = splitArrayItems(value.slice(1, -1));
      } else if (value) {
        // `tags: a, b` in a hand-written file. Kept as a string, it reached
        // `tags.join` on the import path and failed the whole import.
        tags = splitArrayItems(value);
      } else {
        // A YAML block list, the usual form elsewhere:
        //   tags:
        //     - a
        const items: string[] = [];
        while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
          items.push(unquoteScalar(lines[++i].replace(/^\s*-\s+/, "")));
        }
        tags = items.filter(Boolean);
      }
      continue;
    }

    // A SKILL.md often writes a long description as a YAML block scalar
    // (`description: >` or `|`) or as a bare value wrapped onto indented
    // lines. Read the indented lines that follow instead of keeping ">" or
    // the first line only.
    const isBlockScalar = /^[>|][+-]?$/.test(value);
    if (isBlockScalar || (value && !/^["'[]/.test(value))) {
      const more: string[] = [];
      while (
        i + 1 < lines.length &&
        (/^\s+\S/.test(lines[i + 1]) ||
          (isBlockScalar && lines[i + 1].trim() === ""))
      ) {
        more.push(lines[++i].trim());
      }
      if (isBlockScalar) {
        fields[key] = more
          .join(value.startsWith("|") ? "\n" : " ")
          .replace(/ {2,}/g, " ")
          .trim();
        continue;
      }
      if (more.length) value = [value, ...more].join(" ");
    }

    // Only tags is a list. A title such as "[Draft] Notes" is text, and read
    // as a list it became an array where the pages expect a string.
    fields[key] = unquoteScalar(value);
  }

  return {
    title: fields.title,
    type: fields.type,
    description: fields.description,
    tags,
    framework: fields.framework,
    name: fields.name,
  };
}

function deriveTitle(content: string, filename?: string): string {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  if (filename) {
    const nameWithoutExt = filename.replace(/\.md$/i, "");
    return unslugify(nameWithoutExt);
  }
  return "Untitled";
}

export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
