import { assertEquals } from "@std/assert";
import {
  buildMarkdownContent,
  parseMarkdownContent,
  type ArtefactType,
} from "@/lib/markdown.ts";

// "Download .md" followed by "Import" must hand back what was downloaded.
function roundTrip(data: {
  title: string;
  type?: ArtefactType;
  description?: string | null;
  tags?: string[] | null;
  framework?: string | null;
  content: string;
}) {
  const markdown = buildMarkdownContent({ type: "prompt", ...data });
  return parseMarkdownContent(markdown, "export.md");
}

Deno.test("a description with line breaks survives export and import", () => {
  // 19 production rows (18 prompts, 1 skill) have one. The export wrote the
  // line breaks in raw and the import read one line per field, so the
  // description came back as its first line with a stray quote in front.
  const description = 'First line.\nSecond line with "quotes".\r\nThird.';
  const parsed = roundTrip({ title: "T", description, content: "Body" });
  assertEquals(parsed.frontmatter.description, description);
  assertEquals(parsed.content, "Body");
});

Deno.test(
  "a file from the old export, line breaks in raw, is read whole",
  () => {
    const old = [
      "---",
      "title: Old export",
      "type: prompt",
      // The trailing space is inside the quotes and belongs to the text.
      'description: "Line one ',
      'He said \\"stop\\"',
      "",
      'last line"',
      "tags: [a, b]",
      "---",
      "",
      "Body",
    ].join("\n");
    const parsed = parseMarkdownContent(old);
    assertEquals(
      parsed.frontmatter.description,
      'Line one \nHe said "stop"\n\nlast line',
    );
    assertEquals(parsed.frontmatter.tags, ["a", "b"]);
    assertEquals(parsed.content, "Body");
  },
);

Deno.test(
  '"---" inside a title or description does not end the frontmatter',
  () => {
    const parsed = roundTrip({
      title: "Before---after",
      description: "Plan --- then act",
      tags: ["x"],
      content: "Body",
    });
    assertEquals(parsed.frontmatter.title, "Before---after");
    assertEquals(parsed.frontmatter.description, "Plan --- then act");
    assertEquals(parsed.frontmatter.tags, ["x"]);
    assertEquals(parsed.content, "Body");
  },
);

Deno.test("titles that read differently bare are quoted on export", () => {
  for (const title of ['"Quoted"', "[Draft]", "'Tis the season'", "Plain"]) {
    assertEquals(roundTrip({ title, content: "B" }).frontmatter.title, title);
  }
});

Deno.test("a literal backslash-n in text stays a backslash and an n", () => {
  const description = "Path C:\\new\\thing and a \\n that is text";
  assertEquals(
    roundTrip({ title: "T", description, content: "B" }).frontmatter
      .description,
    description,
  );
});

Deno.test("tags as a YAML block list or a bare list are a list", () => {
  // Kept as a string, `tags` reached `tags.join` on the import path and the
  // whole import failed with "Failed to read markdown file".
  const block = parseMarkdownContent(
    '---\ntitle: T\ntags:\n  - one\n  - "two, three"\n---\nBody',
  );
  assertEquals(block.frontmatter.tags, ["one", "two, three"]);
  assertEquals(block.content, "Body");

  const bare = parseMarkdownContent("---\ntitle: T\ntags: one, two\n---\nB");
  assertEquals(bare.frontmatter.tags, ["one", "two"]);

  const none = parseMarkdownContent("---\ntitle: T\ntags:\n---\nB");
  assertEquals(none.frontmatter.tags, []);
});

Deno.test(
  "files without frontmatter still take their title from a heading",
  () => {
    const parsed = parseMarkdownContent("# Heading\n\nText", "file-name.md");
    assertEquals(parsed.frontmatter.title, "Heading");
    assertEquals(parsed.content, "# Heading\n\nText");
    assertEquals(
      parseMarkdownContent("Just text", "my-note.md").frontmatter.title,
      "My Note",
    );
  },
);

Deno.test("Windows line endings and an empty frontmatter parse", () => {
  const crlf = parseMarkdownContent(
    "---\r\ntitle: T\r\ntags: [a]\r\n---\r\n\r\nBody",
  );
  assertEquals(crlf.frontmatter.title, "T");
  assertEquals(crlf.frontmatter.tags, ["a"]);
  assertEquals(crlf.content, "Body");

  const empty = parseMarkdownContent("---\n---\n# H\nBody");
  assertEquals(empty.frontmatter.title, "H");
  assertEquals(empty.content, "# H\nBody");
});
