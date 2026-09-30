// Convert between Markdown (DB source of truth) and Tiptap JSON for the
// Prompt Kit editor. The `## Prompt: <title>` convention is preserved on
// the markdown side; in Tiptap it becomes a `promptBlock` node with
// `title` and `body` attributes.

// The shape of Tiptap's JSONContent this file reads, written out here so the
// file has no package import and its unit tests (tests/web) run without one.
interface JSONContent {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
}

const HEADING_RE = /^##\s*Prompt:\s*(.*)$/i;

interface ProseOrPrompt {
  type: "prose" | "prompt";
  text: string;
  title?: string;
}

function splitMarkdown(markdown: string): ProseOrPrompt[] {
  const lines = (markdown ?? "").split("\n");
  const out: ProseOrPrompt[] = [];
  let mode: "prose" | "prompt" = "prose";
  let buf: string[] = [];
  let title = "";

  const flush = () => {
    const text = buf.join("\n");
    if (mode === "prose") {
      if (text.trim()) out.push({ type: "prose", text });
    } else {
      out.push({ type: "prompt", text: text.replace(/^\n+|\n+$/g, ""), title });
    }
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(HEADING_RE);
    if (m) {
      flush();
      mode = "prompt";
      title = (m[1] || "").trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

/**
 * Build a Tiptap JSON document from kit markdown. We keep prose as raw
 * markdown stuffed into a single paragraph per segment — tiptap-markdown
 * will parse it on `editor.commands.setContent`. To keep things simple
 * and avoid double-parsing, we instead generate a markdown string with
 * placeholder fences for prompt blocks and let the consumer call
 * `editor.commands.setContent(markdownString)` followed by a pass that
 * replaces the placeholders. The simpler path used here is: return
 * markdown with HTML divs for prompt blocks that Tiptap's parseHTML
 * picks up as promptBlock nodes.
 */
export function markdownToEditorContent(markdown: string): string {
  const segments = splitMarkdown(markdown);
  const parts: string[] = [];
  for (const seg of segments) {
    if (seg.type === "prose") {
      parts.push(seg.text);
    } else {
      const titleAttr = escapeHtmlAttr(seg.title || "");
      const bodyAttr = escapeHtmlAttr(seg.text);
      parts.push(
        `\n\n<div data-prompt-block="true" data-title="${titleAttr}" data-body="${bodyAttr}"></div>\n\n`,
      );
    }
  }
  return parts.join("\n").trim();
}

// Newlines are escaped too. markdown-it ends an HTML block at the first blank
// line, so a prompt body with a paragraph break used to cut the <div> off in
// the middle of its data-body attribute and leak the rest into the editor as
// stray text. As &#10; the whole block stays on one line and the browser
// decodes it back to a newline when it reads the attribute.
function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, "&#10;");
}

/** The part of a DOM element the attribute parsers below read. */
interface AttributeSource {
  getAttribute(name: string): string | null;
}

/**
 * The promptBlock node's title and body, as Tiptap attribute specs.
 *
 * markdownToEditorContent writes them as data-title and data-body. Without
 * its own parseHTML an attribute is read from the attribute of the same name
 * ("title", "body"), which the div does not have, so every prompt of a kit
 * opened empty in the editor and the first keystroke saved them all as
 * "## Prompt: Untitled" with no body (2026-09-30 review).
 */
export const promptBlockAttributes = {
  title: {
    default: "",
    parseHTML: (el: AttributeSource) => el.getAttribute("data-title") ?? "",
    renderHTML: (attrs: { title?: string | null }) => ({
      "data-title": attrs.title ?? "",
    }),
  },
  body: {
    default: "",
    parseHTML: (el: AttributeSource) => el.getAttribute("data-body") ?? "",
    renderHTML: (attrs: { body?: string | null }) => ({
      "data-body": attrs.body ?? "",
    }),
  },
};

/**
 * The Markdown a prompt block stands for. The node serialises itself through
 * this (see PromptBlockNode's markdown storage) instead of going out as an
 * HTML <div> that a regular expression then had to find again: a ">" inside
 * the body, left unescaped in attributes by some browsers, ended that match
 * early and left raw HTML in the saved kit.
 */
export function promptBlockMarkdown(title: unknown, body: unknown): string {
  const t = String(title ?? "").trim() || "Untitled";
  const b = String(body ?? "").replace(/\s+$/, "");
  return `## Prompt: ${t}\n\n${b}\n`;
}

/**
 * Walk the Tiptap JSON doc and produce markdown. For non-promptBlock
 * nodes we delegate to the editor's markdown serializer (`editor.storage.markdown.getMarkdown()`),
 * but here we receive only the JSON, so callers should prefer using
 * `serializeEditorToMarkdown(editor)` below.
 */
export function serializeEditorToMarkdown(editor: {
  storage: { markdown?: { getMarkdown: () => string } };
  getJSON: () => JSONContent;
}): string {
  const json = editor.getJSON();
  const content = json.content ?? [];
  const parts: string[] = [];

  // Process top-level nodes one by one. Prompt blocks emit as headings;
  // everything else gets fed through tiptap-markdown for that subtree.
  for (const node of content) {
    if (node.type === "promptBlock") {
      parts.push(promptBlockMarkdown(node.attrs?.title, node.attrs?.body));
    } else {
      // Render this single node through the markdown storage by
      // temporarily wrapping it in a doc.
      const md = renderSingleNodeMarkdown(editor, node);
      if (md.trim()) parts.push(md);
    }
  }

  return parts
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderSingleNodeMarkdown(
  editor: {
    storage: { markdown?: { getMarkdown: () => string } };
    getJSON: () => JSONContent;
  },
  _node: JSONContent,
): string {
  // tiptap-markdown serializes the whole doc; for a single node we'd need
  // to rebuild a temp editor. Since prompt blocks are atomic and other
  // content tends to be simple Markdown, we use a fallback: rerun
  // serializer over the whole doc and split at the prompt blocks.
  const full = editor.storage.markdown?.getMarkdown?.() ?? "";
  return full;
}

/**
 * Preferred serializer: builds final markdown using ONLY the editor JSON
 * (so we get deterministic ordering) plus tiptap-markdown's HTML→MD for
 * each non-prompt segment. We achieve this without spinning a second
 * editor by exporting prose as HTML and converting via a small helper.
 */
export function buildKitMarkdown(editor: {
  storage: { markdown?: { getMarkdown: () => string } };
  getJSON: () => JSONContent;
  getHTML: () => string;
}): string {
  // tiptap-markdown's getMarkdown() handles ALL nodes including unknowns
  // by emitting them as HTML. Our promptBlock renders as
  // `<div data-prompt-block ...></div>` (empty atom). We replace those
  // div placeholders with the canonical `## Prompt:` heading + body.
  const md = editor.storage.markdown?.getMarkdown?.() ?? "";
  const json = editor.getJSON();
  const promptNodes: { title: string; body: string }[] = [];
  for (const n of json.content ?? []) {
    if (n.type === "promptBlock") {
      promptNodes.push({
        title: (n.attrs?.title ?? "").toString().trim() || "Untitled",
        body: (n.attrs?.body ?? "").toString().replace(/\s+$/, ""),
      });
    }
  }

  let i = 0;
  // Replace each occurrence of an empty prompt-block div (in any
  // attribute order, possibly self-closing) with the markdown heading.
  const replaced = md.replace(
    /<div[^>]*data-prompt-block[^>]*>\s*<\/div>/gi,
    () => {
      const p = promptNodes[i++];
      if (!p) return "";
      return promptBlockMarkdown(p.title, p.body);
    },
  );

  return replaced.replace(/\n{3,}/g, "\n\n").trim();
}
