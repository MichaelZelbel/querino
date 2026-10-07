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

// ---------------------------------------------------------------------------
// A standard SKILL.md keeps its own frontmatter (2026-10-07). Any leading
// `---` block used to be read as Querino's metadata and cut off, so `name:`
// and `allowed-tools:` vanished and the skill was no longer a valid SKILL.md.

const SKILL_MD = [
  "---",
  "name: pdf-processing",
  "description: Extract text and tables from PDF files. Use when working",
  "  with PDFs or when the user mentions forms.",
  "allowed-tools: Read, Grep, Bash(python:*)",
  "---",
  "",
  "# PDF Processing",
  "",
  "Use pdfplumber.",
].join("\n");

Deno.test("a SKILL.md is imported whole, frontmatter included", () => {
  const parsed = parseMarkdownContent(SKILL_MD, "SKILL.md");
  assertEquals(parsed.content, SKILL_MD);
  assertEquals(parsed.frontmatter.title, "PDF Processing");
  assertEquals(
    parsed.frontmatter.description,
    "Extract text and tables from PDF files. Use when working with PDFs or when the user mentions forms.",
  );
  assertEquals(parsed.frontmatter.tags, undefined);
});

Deno.test("a SKILL.md without a heading takes its title from name", () => {
  const md = [
    "---",
    "name: code-review",
    "description: >",
    "  Reviews a diff for bugs",
    "  and missing tests.",
    "license: MIT",
    "---",
    "Look at the diff.",
  ].join("\n");
  const parsed = parseMarkdownContent(md, "SKILL.md");
  assertEquals(parsed.content, md);
  assertEquals(parsed.frontmatter.title, "Code Review");
  assertEquals(
    parsed.frontmatter.description,
    "Reviews a diff for bugs and missing tests.",
  );
});

Deno.test("Querino's own export is still read as metadata", () => {
  // "Download .md" always writes `type:`.
  const exported = buildMarkdownContent({
    title: "Reviewer",
    type: "skill",
    description: "Reviews things",
    tags: ["review"],
    content: "---\nname: reviewer\n---\n\nBody",
  });
  const parsed = parseMarkdownContent(exported);
  assertEquals(parsed.frontmatter.title, "Reviewer");
  assertEquals(parsed.frontmatter.type, "skill");
  assertEquals(parsed.frontmatter.tags, ["review"]);
  // The skill's own frontmatter inside the content survives the round trip.
  assertEquals(parsed.content, "---\nname: reviewer\n---\n\nBody");
});

Deno.test("a GitHub sync file, which has no type, is metadata too", () => {
  const synced = [
    "---",
    'id: "0b6f"',
    'title: "Synced"',
    'description: "From GitHub"',
    'category: ""',
    'tags: ["a"]',
    'language: "en"',
    'created_at: "2026-10-01"',
    'updated_at: "2026-10-02"',
    "published: true",
    "---",
    "",
    "# Synced",
  ].join("\n");
  const parsed = parseMarkdownContent(synced);
  assertEquals(parsed.frontmatter.title, "Synced");
  assertEquals(parsed.frontmatter.tags, ["a"]);
  assertEquals(parsed.content, "# Synced");
});

Deno.test("a SKILL.md's own type: does not make its block Querino's", () => {
  const md = "---\nname: helper\ntype: agent\n---\nBody";
  assertEquals(parseMarkdownContent(md).content, md);
});

// Only a SKILL.md keeps its block (2026-10-07). The first version kept any
// block with a key Querino does not write, so a note from Obsidian or a
// Jekyll post arrived with its YAML pasted into the prompt and no tags.

Deno.test("an Obsidian note's frontmatter is metadata, not content", () => {
  const md = [
    "---",
    "title: Meeting notes prompt",
    "tags:",
    "  - meetings",
    "  - summary",
    "author: Jane",
    "date: 2026-10-01",
    "---",
    "",
    "Summarise the meeting below.",
  ].join("\n");
  const parsed = parseMarkdownContent(md, "meeting.md");
  assertEquals(parsed.content, "Summarise the meeting below.");
  assertEquals(parsed.frontmatter.title, "Meeting notes prompt");
  assertEquals(parsed.frontmatter.tags, ["meetings", "summary"]);
  assertEquals(parsed.frontmatter.description, undefined);
});

Deno.test("a Jekyll post with inline tags imports cleanly", () => {
  const md = [
    "---",
    "layout: post",
    'title: "Release notes"',
    "description: Turns a changelog into notes",
    "tags: [writing, release]",
    "permalink: /release-notes/",
    "---",
    "Write release notes.",
  ].join("\n");
  const parsed = parseMarkdownContent(md);
  assertEquals(parsed.content, "Write release notes.");
  assertEquals(parsed.frontmatter.title, "Release notes");
  assertEquals(parsed.frontmatter.description, "Turns a changelog into notes");
  assertEquals(parsed.frontmatter.tags, ["writing", "release"]);
});

Deno.test("a SKILL.md with tags keeps its block and lifts the tags", () => {
  const md = [
    "---",
    "name: commit-writer",
    "description: Writes commit messages.",
    "tags: [git, writing]",
    "---",
    "",
    "# Commit Writer",
    "",
    "Read the diff.",
  ].join("\n");
  const parsed = parseMarkdownContent(md, "SKILL.md");
  assertEquals(parsed.content, md);
  assertEquals(parsed.frontmatter.title, "Commit Writer");
  assertEquals(parsed.frontmatter.description, "Writes commit messages.");
  assertEquals(parsed.frontmatter.tags, ["git", "writing"]);
});

Deno.test("only a top-level name: makes a block a SKILL.md's", () => {
  // A `name:` nested under another key is not the skill's name.
  const md = [
    "---",
    "title: Nested",
    "author:",
    "  name: Jane",
    "---",
    "Body",
  ].join("\n");
  const parsed = parseMarkdownContent(md);
  assertEquals(parsed.content, "Body");
  assertEquals(parsed.frontmatter.title, "Nested");
});
