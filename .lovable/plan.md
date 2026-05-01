## Why `# ` doesn't currently turn into a heading

Two things in our current `PromptKitRichEditor`:

1. We render content with `editor.commands.setContent(htmlString)` where `htmlString` mixes raw Markdown text and `<div data-prompt-block>` placeholders. Because `tiptap-markdown` is configured with `html: true`, the raw `#` characters often get parsed as plain text instead of rendered through ProseMirror's heading **input rule**. The input rule (`# ` → H1) only fires while typing — but it works when StarterKit's heading is enabled with all default levels. We currently rely on the default heading config, which is fine; the real bug is that the `Markdown` extension's `transformPastedText: true` and the way we feed mixed HTML+Markdown content through `setContent` interferes with input rules in some sessions, plus the toolbar has no H1 affordance so users can't tell.
2. The toolbar exposes only H2/H3, never H1, and there's no block-type dropdown. So even if `#` worked, the UI wouldn't reflect Menerio's UX.

The fix is to mirror Menerio's setup, which is battle-tested.

## What changes

### 1. New shared editor toolbar (`src/components/editors/PromptKitEditorToolbar.tsx`)

Port `Menerio/src/components/notes/EditorToolbar.tsx` adapted for our needs (no tables/embeds/wiki-links — those are Menerio-specific). Includes:

- **Block-type dropdown**: Normal text, Heading 1, Heading 2, Heading 3 (label reflects current block).
- Inline: bold, italic, underline, strikethrough, inline code, highlight, superscript, subscript.
- Text color dropdown (using our existing palette tokens).
- Lists: bullet, ordered, task list.
- Block: blockquote, horizontal rule, code block.
- Alignment: left / center / right / justify.
- Link popover (URL input + Apply, plus unlink when active).
- "Insert prompt" primary button (keeps our `promptBlock` integration).
- Clear formatting.
- Undo / Redo on the right.

### 2. Updated `PromptKitRichEditor.tsx`

- Add extensions: `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-highlight`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-text-style`, `@tiptap/extension-color`, `@tiptap/extension-superscript`, `@tiptap/extension-subscript`.
- Configure `StarterKit` like Menerio: `heading: { levels: [1, 2, 3] }`, disable built-in `link` and `underline` (use the dedicated extensions).
- Replace inline `Toolbar` with the new `PromptKitEditorToolbar`.
- Keep `PromptBlock` node + `buildKitMarkdown` serializer unchanged.
- Keep `tiptap-markdown` so input rules (`# `, `## `, `### `, `- `, `1. `, `> `, ``` ``` ```) all work as expected.

### 3. Markdown round-trip stays the same

DB still stores the same `## Prompt: <title>` Markdown. The `promptBlock` node still serializes through `buildKitMarkdown`. No DB / parser / GitHub sync / MCP / translate changes.

### 4. Dependencies to add

```
@tiptap/extension-underline
@tiptap/extension-text-align
@tiptap/extension-highlight
@tiptap/extension-task-list
@tiptap/extension-task-item
@tiptap/extension-text-style
@tiptap/extension-color
@tiptap/extension-superscript
@tiptap/extension-subscript
```

(`@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-typography`, `tiptap-markdown` already installed.)

### 5. Files

**New**
- `src/components/editors/PromptKitEditorToolbar.tsx` — the ported toolbar.

**Changed**
- `src/components/editors/PromptKitRichEditor.tsx` — extension list + use new toolbar.

**Untouched**
- `PromptBlockNode.tsx`, `promptKitMarkdown.ts`, `promptKitParser.ts`, `PromptKitArticleView.tsx`, all pages, all backend.

## Why we don't just copy Menerio 1:1

Menerio's editor includes wiki-links, video/audio/PDF embeds, tables, and a Markdown converter (`markdownToHtml` + `tiptapJsonToMarkdown`) tailored to notes. We don't need any of that for prompt kits — and we have our own `promptBlock` node and `## Prompt:` Markdown convention. So we port the **toolbar UX and extension stack** (the part you like), but keep our own serializer.

## Acceptance

- Typing `# ` at the start of a line creates an H1; `## ` → H2; `### ` → H3.
- Block-type dropdown shows the current block name and lets the user switch.
- Underline, strike, highlight, sup/sub, alignment, color, link popover, task list all work.
- "Insert prompt" still inserts a `promptBlock` card; "Copy this prompt" on the detail page still works.
- Existing kits load and save without content loss.
