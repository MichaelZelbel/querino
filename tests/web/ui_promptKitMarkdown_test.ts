import { assert, assertEquals } from "@std/assert";
import {
  markdownToEditorContent,
  promptBlockAttributes,
  promptBlockMarkdown,
} from "@/components/editors/promptKitMarkdown.ts";

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
      '## Prompt: Summarise "quotes" & <tags>\n\nFirst paragraph of the body.\n\nSecond paragraph -> with an arrow and a > quote.\n',
    );
    assertEquals(promptBlockMarkdown("", "  "), "## Prompt: Untitled\n\n\n");
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
