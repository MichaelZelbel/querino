import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";
import { PromptBlock } from "./extensions/PromptBlockNode";
import { markdownToEditorContent, buildKitMarkdown } from "./promptKitMarkdown";
import { PromptKitEditorToolbar } from "./PromptKitEditorToolbar";

interface PromptKitRichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  error?: boolean;
  minHeight?: number;
}

export function PromptKitRichEditor({
  value,
  onChange,
  placeholder = 'Write an intro for your kit, then click "Insert prompt" to add a prompt block…',
  error = false,
  minHeight = 360,
}: PromptKitRichEditorProps) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    // Only what the public kit page renders: it reads plain Markdown without
    // GFM and shows raw HTML as text, so underline, strikethrough, highlight,
    // colour, sub/superscript, checklists and alignment are not offered
    // (2026-10-07). Without the extension a pasted mark is dropped instead of
    // being saved as a tag.
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "rounded-md" } },
        link: false,
        underline: false,
        strike: false,
      } as any),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Typography,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        breaks: false,
      }),
      PromptBlock,
    ],
    content: markdownToEditorContent(value || ""),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm md:prose-base dark:prose-invert max-w-none focus:outline-hidden px-4 py-4",
      },
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const md = buildKitMarkdown(editor as any);
      onChange(md);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    },
  });

  // Sync external value changes (e.g. AI assistant overwrites) into editor
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) return;
    const current = buildKitMarkdown(editor as any);
    if ((value || "").trim() === (current || "").trim()) return;
    editor.commands.setContent(markdownToEditorContent(value || ""), {
      emitUpdate: false,
    });
  }, [value, editor]);

  return (
    <div
      className={`rounded-md border bg-background overflow-hidden ${
        error ? "border-destructive" : "border-input"
      }`}
    >
      <PromptKitEditorToolbar editor={editor} />
      <div style={{ minHeight }} className="overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
