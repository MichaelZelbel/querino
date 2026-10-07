import { assert, assertEquals } from "@std/assert";
import {
  buildKitMarkdown,
  markdownToEditorContent,
  promptBlockAttributes,
  promptBlockMarkdown,
} from "@/components/editors/promptKitMarkdown.ts";
import {
  parsePromptKitDocument,
  parsePromptKitItems,
  stripPromptEndMarkers,
} from "@/lib/promptKitParser.ts";

// A stand-in for the <div> the browser builds from markdownToEditorContent's
// output: the attributes of each prompt-block div, entity-decoded the way an
// HTML parser decodes them.
function decode(v: string): string {
  return v
    .replace(/&#10;/g, "\n")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function promptDivs(html: string) {
  const divs: { getAttribute(name: string): string | null; raw: string }[] = [];
  for (const m of html.matchAll(/<div data-prompt-block[^\n]*?><\/div>/g)) {
    const attrs = new Map<string, string>();
    for (const a of m[0].matchAll(/([a-z-]+)="([^"]*)"/g)) {
      attrs.set(a[1], decode(a[2]));
    }
    divs.push({ getAttribute: (n) => attrs.get(n) ?? null, raw: m[0] });
  }
  return divs;
}

// What Tiptap does for each declared attribute when it parses an element: its
// own parseHTML if it has one, otherwise the attribute of the same name.
function readAttr(
  spec: {
    parseHTML?: (el: { getAttribute(n: string): string | null }) => unknown;
  },
  name: string,
  el: { getAttribute(n: string): string | null },
) {
  const v = spec.parseHTML ? spec.parseHTML(el) : el.getAttribute(name);
  return v ?? "";
}

const KIT = [
  "An intro with **bold** text.",
  "",
  '## Prompt: Summarise "quotes" & <tags>',
  "",
  "First paragraph of the body.",
  "",
  "Second paragraph -> with an arrow and a > quote.",
  "",
  "## Prompt: Second",
  "",
  "One line.",
].join("\n");

Deno.test(
  "every prompt block of a kit reaches the editor with its title and body",
  () => {
    const divs = promptDivs(markdownToEditorContent(KIT));
    assertEquals(divs.length, 2);
    assertEquals(
      readAttr(promptBlockAttributes.title, "title", divs[0]),
      'Summarise "quotes" & <tags>',
    );
    assertEquals(
      readAttr(promptBlockAttributes.body, "body", divs[0]),
      "First paragraph of the body.\n\nSecond paragraph -> with an arrow and a > quote.",
    );
    assertEquals(
      readAttr(promptBlockAttributes.title, "title", divs[1]),
      "Second",
    );
    assertEquals(
      readAttr(promptBlockAttributes.body, "body", divs[1]),
      "One line.",
    );
  },
);

Deno.test("a body with a blank line stays inside one HTML block", () => {
  // markdown-it ends an HTML block at the first blank line, so the whole div
  // must sit on a single line.
  const html = markdownToEditorContent(KIT);
  for (const line of html.split("\n")) {
    if (line.includes("data-prompt-block")) {
      assert(line.endsWith("></div>"), `div broken across lines: ${line}`);
    }
  }
});

Deno.test(
  "the editor writes a block back as the section it was read from",
  () => {
    const divs = promptDivs(markdownToEditorContent(KIT));
    const title = readAttr(
      promptBlockAttributes.title,
      "title",
      divs[0],
    ) as string;
    const body = readAttr(
      promptBlockAttributes.body,
      "body",
      divs[0],
    ) as string;
    assertEquals(
      promptBlockMarkdown(title, body),
      '## Prompt: Summarise "quotes" & <tags>\n\nFirst paragraph of the body.\n\nSecond paragraph -> with an arrow and a > quote.\n\n<!-- /prompt -->\n',
    );
    assertEquals(
      promptBlockMarkdown("", "  "),
      "## Prompt: Untitled\n\n\n\n<!-- /prompt -->\n",
    );
  },
);

Deno.test(
  "rendering the node puts the values where parsing looks for them",
  () => {
    assertEquals(promptBlockAttributes.title.renderHTML({ title: "T" }), {
      "data-title": "T",
    });
    assertEquals(promptBlockAttributes.body.renderHTML({ body: "B" }), {
      "data-body": "B",
    });
  },
);

// ---------------------------------------------------------------------------
// The end marker (2026-10-07). A prompt section had no end, so a note written
// below a prompt block in the editor became part of that prompt.

type Block =
  | { kind: "prose"; markdown: string }
  | { kind: "prompt"; title: string; body: string };

// What the kit editor saves for a document of these blocks: tiptap-markdown
// writes each top-level node and closes it with a blank line, and the prompt
// block writes itself through promptBlockMarkdown (PromptBlockNode's
// serializer, which drops the final newline before closeBlock).
function editorSave(blocks: Block[]): string {
  const md = blocks
    .map((b) =>
      b.kind === "prose"
        ? b.markdown
        : promptBlockMarkdown(b.title, b.body).replace(/\n$/, ""),
    )
    .join("\n\n");
  return buildKitMarkdown({
    storage: { markdown: { getMarkdown: () => md } },
    getJSON: () => ({
      type: "doc",
      content: blocks.map((b) =>
        b.kind === "prose"
          ? { type: "paragraph" }
          : { type: "promptBlock", attrs: { title: b.title, body: b.body } },
      ),
    }),
    getHTML: () => "",
  });
}

// What the editor holds after opening saved Markdown: the prose between the
// prompt-block divs and each div's attributes, in order.
function editorOpen(markdown: string): Block[] {
  const html = markdownToEditorContent(markdown);
  const blocks: Block[] = [];
  let last = 0;
  for (const m of html.matchAll(/<div data-prompt-block[^\n]*?><\/div>/g)) {
    const prose = html.slice(last, m.index).trim();
    if (prose) blocks.push({ kind: "prose", markdown: prose });
    const [div] = promptDivs(m[0]);
    blocks.push({
      kind: "prompt",
      title: String(readAttr(promptBlockAttributes.title, "title", div)),
      body: String(readAttr(promptBlockAttributes.body, "body", div)),
    });
    last = (m.index ?? 0) + m[0].length;
  }
  const tail = html.slice(last).trim();
  if (tail) blocks.push({ kind: "prose", markdown: tail });
  return blocks;
}

const WITH_NOTES: Block[] = [
  { kind: "prose", markdown: "An intro." },
  { kind: "prompt", title: "First", body: "Do the first thing.\n\nCarefully." },
  { kind: "prose", markdown: "A note **between** the prompts." },
  { kind: "prompt", title: "Second", body: "Do the second thing." },
  { kind: "prose", markdown: "A closing note.\n\n- with a list" },
];

Deno.test("prose between and after prompts stays prose on the page", () => {
  const saved = editorSave(WITH_NOTES);
  assertEquals(parsePromptKitDocument(saved), [
    { type: "prose", markdown: "An intro." },
    {
      type: "prompt",
      index: 1,
      title: "First",
      body: "Do the first thing.\n\nCarefully.",
    },
    { type: "prose", markdown: "A note **between** the prompts." },
    { type: "prompt", index: 2, title: "Second", body: "Do the second thing." },
    { type: "prose", markdown: "A closing note.\n\n- with a list" },
  ]);
  // "Copy this prompt" and the prompt count read the same parse.
  assertEquals(
    parsePromptKitItems(saved).map((i) => i.body),
    ["Do the first thing.\n\nCarefully.", "Do the second thing."],
  );
});

Deno.test("save, open and save again changes nothing", () => {
  const saved = editorSave(WITH_NOTES);
  const reopened = editorOpen(saved);
  assertEquals(reopened, WITH_NOTES);
  assertEquals(editorSave(reopened), saved);
});

Deno.test("a kit saved before the marker parses exactly as before", () => {
  const old = [
    "Intro.",
    "",
    "## Prompt: One",
    "",
    "Body one.",
    "",
    "A note that was always part of prompt one.",
    "",
    "## Prompt: Two",
    "",
    "Body two.",
  ].join("\n");
  assertEquals(parsePromptKitDocument(old), [
    { type: "prose", markdown: "Intro." },
    {
      type: "prompt",
      index: 1,
      title: "One",
      body: "Body one.\n\nA note that was always part of prompt one.",
    },
    { type: "prompt", index: 2, title: "Two", body: "Body two." },
  ]);
  // Opened in the editor, the note stays where the old parse put it, and the
  // next save closes each prompt with the marker without changing the page.
  const opened = editorOpen(old);
  assertEquals(opened, [
    { kind: "prose", markdown: "Intro." },
    {
      kind: "prompt",
      title: "One",
      body: "Body one.\n\nA note that was always part of prompt one.",
    },
    { kind: "prompt", title: "Two", body: "Body two." },
  ]);
  assertEquals(
    parsePromptKitDocument(editorSave(opened)),
    parsePromptKitDocument(old),
  );
});

Deno.test("a stray marker is never shown as text", () => {
  // The page renders raw HTML in prose as literal text.
  const md = "Intro.\n\n<!-- /prompt -->\n\nMore.";
  assertEquals(parsePromptKitDocument(md), [
    { type: "prose", markdown: "Intro.\n\n\nMore." },
  ]);
  for (const block of editorOpen(md)) {
    assert(block.kind === "prose" && !block.markdown.includes("<!--"));
  }
});

Deno.test("copying a whole kit leaves the markers out", () => {
  assertEquals(
    stripPromptEndMarkers(editorSave(WITH_NOTES)),
    [
      "An intro.",
      "",
      "## Prompt: First",
      "",
      "Do the first thing.",
      "",
      "Carefully.",
      "",
      "A note **between** the prompts.",
      "",
      "## Prompt: Second",
      "",
      "Do the second thing.",
      "",
      "A closing note.",
      "",
      "- with a list",
    ].join("\n"),
  );
});

// The first version collapsed every run of three or more line breaks in the
// whole kit, so blank lines a prompt body kept on purpose were lost on copy
// (2026-10-07). Only the marker and the blank line it leaves behind go.
Deno.test("copying a kit keeps the blank lines inside a prompt", () => {
  // A kit as stored (written by hand, through the MCP server or a GitHub
  // sync) whose prompt keeps a three-line gap on purpose.
  const stored = [
    "## Prompt: Gap",
    "",
    "Answer in German.",
    "",
    "",
    "",
    "Paste the text here:",
    "",
    "<!-- /prompt -->",
    "",
    "After.",
  ].join("\n");
  assertEquals(
    stripPromptEndMarkers(stored),
    [
      "## Prompt: Gap",
      "",
      "Answer in German.",
      "",
      "",
      "",
      "Paste the text here:",
      "",
      "After.",
    ].join("\n"),
  );
});

Deno.test("a marker at either end of the kit leaves no blank line", () => {
  assertEquals(
    stripPromptEndMarkers("## Prompt: A\n\nBody.\n\n<!-- /prompt -->"),
    "## Prompt: A\n\nBody.",
  );
  assertEquals(
    stripPromptEndMarkers("<!-- /prompt -->\n\nIntro.\n\n\n\nMore."),
    "Intro.\n\n\n\nMore.",
  );
  // A marker hard against its neighbours takes no line but its own.
  assertEquals(
    stripPromptEndMarkers("Body.\n<!-- /prompt -->\nNext."),
    "Body.\nNext.",
  );
  // Windows line endings: the marker line still matches.
  assertEquals(
    stripPromptEndMarkers("Body.\r\n\r\n<!-- /prompt -->\r\n\r\nNext."),
    "Body.\r\n\r\nNext.",
  );
  assertEquals(
    stripPromptEndMarkers("No markers.\n\n\n\nAt all."),
    "No markers.\n\n\n\nAt all.",
  );
});
