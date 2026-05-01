import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
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
  placeholder = "Write an intro for your kit, then click \"Insert prompt\" to add a prompt block…",
  error = false,
  minHeight = 360,
}: PromptKitRichEditorProps) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "rounded-md" } },
        link: false,
        // StarterKit may bundle Underline in newer versions — disable to avoid duplicate.
        underline: false,
      } as any),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Typography,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Superscript,
      Subscript,
      Markdown.configure({ html: true, transformPastedText: true, breaks: false }),
      PromptBlock,
    ],
    content: markdownToEditorContent(value || ""),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm md:prose-base dark:prose-invert max-w-none focus:outline-none px-4 py-4",
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
    editor.commands.setContent(markdownToEditorContent(value || ""), { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
