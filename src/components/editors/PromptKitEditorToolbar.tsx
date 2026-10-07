// The toolbar offers only what the public kit page renders (plain Markdown, no
// GFM, no raw HTML). Underline, highlight, colour, sub/superscript went out as
// HTML tags shown literally on the page; strikethrough and checklists need GFM;
// alignment was dropped on save. All removed on 2026-10-07.
import { Editor } from "@tiptap/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  ChevronDown,
  Type,
  Pilcrow,
  RemoveFormatting,
  Code2,
  Plus,
} from "lucide-react";

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-10 w-10 sm:h-7 sm:w-7 ${active ? "bg-accent text-accent-foreground" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

export function PromptKitEditorToolbar({ editor }: { editor: Editor | null }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  if (!editor) return null;

  const currentBlock = editor.isActive("heading", { level: 1 })
    ? "Heading 1"
    : editor.isActive("heading", { level: 2 })
      ? "Heading 2"
      : editor.isActive("heading", { level: 3 })
        ? "Heading 3"
        : "Normal text";

  const setLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setLinkUrl("");
    setLinkOpen(false);
  };

  const insertPrompt = () => {
    editor
      .chain()
      .focus()
      .insertPromptBlock({ title: "Untitled", body: "" })
      .run();
  };

  return (
    <div className="shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-background flex-wrap">
        {/* Block type dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs font-normal px-2"
            >
              <Pilcrow className="h-3.5 w-3.5" />
              {currentBlock}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              <Type className="mr-2 h-4 w-4" /> Normal text
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="mr-2 h-4 w-4" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="mr-2 h-4 w-4" /> Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="mr-2 h-4 w-4" /> Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Inline formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline code"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Block formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code block"
        >
          <Code2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Link */}
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 sm:h-7 sm:w-7 ${editor.isActive("link") ? "bg-accent text-accent-foreground" : ""}`}
              title="Insert link"
              aria-label="Insert link"
              onClick={() => {
                const existing = editor.getAttributes("link").href || "";
                setLinkUrl(existing);
                setLinkOpen(true);
              }}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && setLink()}
                autoFocus
              />
              <Button size="sm" className="h-8" onClick={setLink}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {editor.isActive("link") && (
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link"
          >
            <Unlink className="h-3.5 w-3.5" />
          </ToolbarButton>
        )}

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Insert prompt block */}
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={insertPrompt}
          className="gap-1.5 h-7"
        >
          <Plus className="h-3.5 w-3.5" />
          Insert prompt
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          title="Clear formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </div>
  );
}
