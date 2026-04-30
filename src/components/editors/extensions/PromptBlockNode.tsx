import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Trash2, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    promptBlock: {
      insertPromptBlock: (attrs?: { title?: string; body?: string }) => ReturnType;
    };
  }
}

function PromptBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, editor } = props;
  const editable = editor.isEditable;
  const title = node.attrs.title ?? "";
  const body = node.attrs.body ?? "";

  return (
    <NodeViewWrapper
      data-prompt-block
      className="my-4 rounded-xl border border-border bg-card overflow-hidden not-prose"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Hash className="h-4 w-4 text-primary shrink-0" />
          <Input
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder="Prompt title"
            disabled={!editable}
            className="h-8 border-0 bg-transparent px-1 font-semibold focus-visible:ring-1"
          />
        </div>
        {editable && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => deleteNode()}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            aria-label="Remove prompt"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Textarea
        value={body}
        onChange={(e) => updateAttributes({ body: e.target.value })}
        placeholder="Write the prompt body here. Plain text or Markdown — this is what users will copy."
        disabled={!editable}
        className="min-h-[160px] rounded-none border-0 font-mono text-sm leading-relaxed focus-visible:ring-0 resize-y"
      />
    </NodeViewWrapper>
  );
}

export const PromptBlock = Node.create({
  name: "promptBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      title: { default: "" },
      body: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-prompt-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-prompt-block": "true" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PromptBlockView);
  },

  addCommands() {
    return {
      insertPromptBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { title: attrs?.title ?? "", body: attrs?.body ?? "" },
          }),
    };
  },
});
