## Goal

Make Prompt Kits feel like a real "kit document" (à la promptkit.natebjones.com). Authors can write **intro text, section dividers, and explanatory paragraphs between prompts** using a rich Tiptap editor, while each `## Prompt: …` block stays a structured, individually copyable unit. Readers see a polished article-style layout with a "Copy this prompt" button on every prompt.

## What changes for the user

**Editor (PromptKitNew / PromptKitEdit):**
- Replace the line-numbered Markdown textarea with a **Tiptap rich-text editor** (bold, italic, headings H2/H3, lists, links, blockquote, code, code block, hr).
- Special block: **"Prompt block"** — a custom Tiptap node rendered as a card with a title field on top and a code-style body below. Inserted via toolbar button "Insert prompt" or slash command `/prompt`.
- Anything outside prompt blocks = free intro / between-prompt commentary.
- Outline panel keeps showing detected prompts (now from prompt-block nodes instead of regex).
- Editor serializes to Markdown on save — preserving the existing `## Prompt: <title>` convention so all downstream features (parser, GitHub sync, MCP, translate, search) keep working unchanged.

**Detail view (PromptKitDetail):**
- Render the kit as an article: intro prose, then for each prompt a **card** with `#N`, title, "Copy this prompt" button, and the prompt body in a monospace, expand/collapse block (long prompts collapsed by default with "Show full prompt").
- "Copy entire kit" stays at top.
- Between-prompt prose is rendered as styled markdown between the cards.

## Technical design

### 1. Markdown ↔ Tiptap conversion

Single source of truth in the DB stays **Markdown** (column `prompt_kits.content`), so:
- existing `parsePromptKitItems`
- GitHub sync (`generatePromptKitMarkdown`)
- MCP tools, translate, AI coach, metadata suggestion, embeddings, semantic search

all keep working with zero migration.

Conversion rules:
- `## Prompt: <title>\n\n<body>` ⇄ custom Tiptap node `promptBlock { title, body }` (body kept as plain text / fenced as needed).
- All other Markdown ⇄ standard Tiptap nodes via `tiptap-markdown` extension.

### 2. Dependencies to add

- `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`
- `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-typography`
- `tiptap-markdown` (Markdown serializer/parser)

No backend changes required.

### 3. New / changed files

**New**
- `src/components/editors/PromptKitRichEditor.tsx` — Tiptap wrapper. Props: `value: string` (markdown), `onChange(markdown)`, `onOutlineChange(items)`. Exposes toolbar with "Insert prompt" button.
- `src/components/editors/extensions/PromptBlockNode.tsx` — custom Tiptap Node (`name: 'promptBlock'`, `group: 'block'`, atom-ish with two editable fields: title input + body textarea). Includes a NodeView component rendering the prompt-card UI and a "remove" button.
- `src/components/editors/promptKitMarkdown.ts` — helpers `markdownToTiptap(md)` and `tiptapToMarkdown(doc)` that handle the `## Prompt:` convention by serializing/deserializing `promptBlock` nodes.
- `src/components/promptKits/PromptKitArticleView.tsx` — renderer for the detail page. Splits `parsePromptKitItems` output + the **pre-first-heading intro** + **between-headings prose** (extend parser to also emit "prose" segments) and renders a clean article with per-prompt copy cards.

**Changed**
- `src/lib/promptKitParser.ts` — add `parsePromptKitDocument(md)` returning an ordered array of `{type:'prose', markdown}` and `{type:'prompt', index, title, body}` segments. Keep existing `parsePromptKitItems` for backward compatibility.
- `src/pages/PromptKitNew.tsx` — swap `LineNumberedEditor` for `PromptKitRichEditor`. Drop "Add Prompt" plain-text button (replaced by toolbar). Outline derives from editor outline events. Default template seeds an intro paragraph + one empty prompt block.
- `src/pages/PromptKitEdit.tsx` — same swap.
- `src/pages/PromptKitDetail.tsx` — replace the current "items.map → card" block with `<PromptKitArticleView content={kit.content} onCopyItem={...} copiedIdx={...} />`. Keep all existing action buttons (copy all, edit, history, clone, copy to team, suggest, pin, collection, download, translate, menerio).

**Untouched (intentionally)**
- DB schema, RLS, edge functions, GitHub sync format, MCP tools, AI coach, translate, embeddings, suggestions, reviews, version history. Markdown round-trips so they all still work.

### 4. Tiptap "Prompt block" node — sketch

```text
promptBlock
├─ attrs: { title: string }
└─ content: text*        # body kept as plain text inside a code-mark span
```

Serialized to Markdown as:
```
## Prompt: {title}

{body}
```

Parsed back by scanning `## Prompt:` headings (reuse parser).

### 5. Detail view layout

```text
[ Intro prose, rendered as markdown article ]
[ Prose between prompts ... ]
┌──────────────────────────────────────────┐
│ #1  Knowledge Architecture Advisor [Copy]│
│ ─────────────────────────────────────── │
│ <prompt body, mono, collapsed > 600 chars│
│ [ Show full prompt ]                     │
└──────────────────────────────────────────┘
[ More prose ... ]
┌──────────────────────────────────────────┐
│ #2  …                              [Copy]│
└──────────────────────────────────────────┘
```

Uses `react-markdown` (already installed) + `@tailwindcss/typography` for the prose, matching the legal/docs styling memory.

### 6. Backwards compatibility

Existing kits load fine: their content is parsed, `## Prompt:` headings become prompt blocks in the editor, all surrounding text becomes regular prose. No migration script needed.

## Out of scope

- Drag-to-reorder prompt blocks (can follow up; Tiptap supports it but adds complexity).
- Image upload inside kits.
- Per-prompt metadata (tags / model). Single-prompt artifacts already cover that case.

## Acceptance

- Create a kit, write an intro paragraph, insert two prompt blocks separated by a paragraph, save → DB stores valid Markdown with `## Prompt: …` headings.
- Reopen in editor → identical structure restored.
- Detail page shows intro, between-prompt text, and a copy button per prompt that copies only that prompt's body.
- "Copy entire kit", GitHub sync, translate, AI coach, version history, suggestions all keep working.
