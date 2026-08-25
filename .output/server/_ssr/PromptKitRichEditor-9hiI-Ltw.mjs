import { a as __toESM } from "../_runtime.mjs";
import { t as index_default } from "../_libs/@tiptap/extension-placeholder+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { $ as Pilcrow, A as Subscript, C as TextAlignEnd, Ft as Highlighter, G as Redo, It as Heading3, J as Plus, K as Quote, Ln as Bold, Lt as Heading2, O as Superscript, On as ChevronDown, Rt as Heading1, S as TextAlignJustify, U as RemoveFormatting, _t as List, b as Trash2, bt as ListChecks, ct as Minus, f as Unlink, g as Type, h as Underline, hn as CodeXml, j as Strikethrough, kt as Italic, mn as Code, p as Undo, w as TextAlignCenter, x as TextAlignStart, xt as Link, yt as ListOrdered, zt as Hash } from "../_libs/lucide-react.mjs";
import { a as DropdownMenuTrigger, n as DropdownMenuContent, r as DropdownMenuItem, t as DropdownMenu } from "./useDebounce-CjI32hnI.mjs";
import { t as Separator } from "./separator-B3hsz7IR.mjs";
import { A as mergeAttributes, a as Node3 } from "../_libs/@tiptap/core+[...].mjs";
import { i as useEditor, n as NodeViewWrapper, r as ReactNodeViewRenderer, t as EditorContent } from "../_libs/fast-equals+tiptap__react.mjs";
import { n as index_default$1 } from "../_libs/@tiptap/extension-link+[...].mjs";
import { n as index_default$2 } from "../_libs/tiptap__extension-underline.mjs";
import { t as index_default$3 } from "../_libs/tiptap__starter-kit.mjs";
import { t as index_default$4 } from "../_libs/tiptap__extension-typography.mjs";
import { t as index_default$5 } from "../_libs/tiptap__extension-text-align.mjs";
import { t as index_default$6 } from "../_libs/tiptap__extension-highlight.mjs";
import { t as index_default$7 } from "../_libs/tiptap__extension-task-list.mjs";
import { t as index_default$8 } from "../_libs/tiptap__extension-task-item.mjs";
import { n as TextStyle, t as index_default$9 } from "../_libs/@tiptap/extension-color+[...].mjs";
import { t as index_default$10 } from "../_libs/tiptap__extension-superscript.mjs";
import { t as index_default$11 } from "../_libs/tiptap__extension-subscript.mjs";
import { t as Markdown } from "../_libs/tiptap-markdown.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PromptKitRichEditor-9hiI-Ltw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PromptBlockView(props) {
	const { node, updateAttributes, deleteNode, editor } = props;
	const editable = editor.isEditable;
	const title = node.attrs.title ?? "";
	const body = node.attrs.body ?? "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NodeViewWrapper, {
		"data-prompt-block": true,
		className: "my-4 rounded-xl border border-border bg-card overflow-hidden not-prose",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 flex-1 min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { className: "h-4 w-4 text-primary shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: title,
					onChange: (e) => updateAttributes({ title: e.target.value }),
					placeholder: "Prompt title",
					disabled: !editable,
					className: "h-8 border-0 bg-transparent px-1 font-semibold focus-visible:ring-1"
				})]
			}), editable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				size: "sm",
				variant: "ghost",
				onClick: () => deleteNode(),
				className: "h-8 w-8 p-0 text-muted-foreground hover:text-destructive",
				"aria-label": "Remove prompt",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
			value: body,
			onChange: (e) => updateAttributes({ body: e.target.value }),
			placeholder: "Write the prompt body here. Plain text or Markdown — this is what users will copy.",
			disabled: !editable,
			className: "min-h-[160px] rounded-none border-0 font-mono text-sm leading-relaxed focus-visible:ring-0 resize-y"
		})]
	});
}
var PromptBlock = Node3.create({
	name: "promptBlock",
	group: "block",
	atom: true,
	selectable: true,
	draggable: false,
	addAttributes() {
		return {
			title: { default: "" },
			body: { default: "" }
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
		return { insertPromptBlock: (attrs) => ({ commands }) => commands.insertContent({
			type: this.name,
			attrs: {
				title: attrs?.title ?? "",
				body: attrs?.body ?? ""
			}
		}) };
	}
});
var HEADING_RE = /^##\s*Prompt:\s*(.*)$/i;
function splitMarkdown(markdown) {
	const lines = (markdown ?? "").split("\n");
	const out = [];
	let mode = "prose";
	let buf = [];
	let title = "";
	const flush = () => {
		const text = buf.join("\n");
		if (mode === "prose") {
			if (text.trim()) out.push({
				type: "prose",
				text
			});
		} else out.push({
			type: "prompt",
			text: text.replace(/^\n+|\n+$/g, ""),
			title
		});
		buf = [];
	};
	for (const line of lines) {
		const m = line.match(HEADING_RE);
		if (m) {
			flush();
			mode = "prompt";
			title = (m[1] || "").trim();
		} else buf.push(line);
	}
	flush();
	return out;
}
/**
* Build a Tiptap JSON document from kit markdown. We keep prose as raw
* markdown stuffed into a single paragraph per segment — tiptap-markdown
* will parse it on `editor.commands.setContent`. To keep things simple
* and avoid double-parsing, we instead generate a markdown string with
* placeholder fences for prompt blocks and let the consumer call
* `editor.commands.setContent(markdownString)` followed by a pass that
* replaces the placeholders. The simpler path used here is: return
* markdown with HTML divs for prompt blocks that Tiptap's parseHTML
* picks up as promptBlock nodes.
*/
function markdownToEditorContent(markdown) {
	const segments = splitMarkdown(markdown);
	const parts = [];
	for (const seg of segments) if (seg.type === "prose") parts.push(seg.text);
	else {
		const titleAttr = escapeHtmlAttr(seg.title || "");
		const bodyAttr = escapeHtmlAttr(seg.text);
		parts.push(`\n\n<div data-prompt-block="true" data-title="${titleAttr}" data-body="${bodyAttr}"></div>\n\n`);
	}
	return parts.join("\n").trim();
}
function escapeHtmlAttr(s) {
	return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/**
* Preferred serializer: builds final markdown using ONLY the editor JSON
* (so we get deterministic ordering) plus tiptap-markdown's HTML→MD for
* each non-prompt segment. We achieve this without spinning a second
* editor by exporting prose as HTML and converting via a small helper.
*/
function buildKitMarkdown(editor) {
	const md = editor.storage.markdown?.getMarkdown?.() ?? "";
	const json = editor.getJSON();
	const promptNodes = [];
	for (const n of json.content ?? []) if (n.type === "promptBlock") promptNodes.push({
		title: (n.attrs?.title ?? "").toString().trim() || "Untitled",
		body: (n.attrs?.body ?? "").toString().replace(/\s+$/, "")
	});
	let i = 0;
	return md.replace(/<div[^>]*data-prompt-block[^>]*>\s*<\/div>/gi, () => {
		const p = promptNodes[i++];
		if (!p) return "";
		return `## Prompt: ${p.title}\n\n${p.body}\n`;
	}).replace(/\n{3,}/g, "\n\n").trim();
}
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
var TEXT_COLORS = [
	{
		label: "Default",
		value: "inherit"
	},
	{
		label: "Red",
		value: "hsl(0, 72%, 51%)"
	},
	{
		label: "Orange",
		value: "hsl(25, 95%, 53%)"
	},
	{
		label: "Yellow",
		value: "hsl(45, 93%, 47%)"
	},
	{
		label: "Green",
		value: "hsl(142, 71%, 45%)"
	},
	{
		label: "Blue",
		value: "hsl(217, 91%, 60%)"
	},
	{
		label: "Purple",
		value: "hsl(263, 70%, 50%)"
	},
	{
		label: "Pink",
		value: "hsl(330, 81%, 60%)"
	},
	{
		label: "Gray",
		value: "hsl(220, 9%, 46%)"
	}
];
function ToolbarButton({ onClick, active, disabled, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		variant: "ghost",
		size: "icon",
		className: `h-10 w-10 sm:h-7 sm:w-7 ${active ? "bg-accent text-accent-foreground" : ""}`,
		onClick,
		disabled,
		title,
		"aria-label": title,
		"aria-pressed": active,
		children
	});
}
function PromptKitEditorToolbar({ editor }) {
	const [linkUrl, setLinkUrl] = (0, import_react.useState)("");
	const [linkOpen, setLinkOpen] = (0, import_react.useState)(false);
	if (!editor) return null;
	const currentBlock = editor.isActive("heading", { level: 1 }) ? "Heading 1" : editor.isActive("heading", { level: 2 }) ? "Heading 2" : editor.isActive("heading", { level: 3 }) ? "Heading 3" : "Normal text";
	const setLink = () => {
		if (!linkUrl.trim()) editor.chain().focus().unsetLink().run();
		else {
			const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
			editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
		}
		setLinkUrl("");
		setLinkOpen(false);
	};
	const insertPrompt = () => {
		editor.chain().focus().insertPromptBlock({
			title: "Untitled",
			body: ""
		}).run();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "shrink-0 sticky top-0 z-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-0.5 px-2 py-1 border-b border-border bg-background flex-wrap",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						className: "h-7 gap-1 text-xs font-normal px-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pilcrow, { className: "h-3.5 w-3.5" }),
							currentBlock,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3 w-3" })
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
					align: "start",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
							onClick: () => editor.chain().focus().setParagraph().run(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: "mr-2 h-4 w-4" }), " Normal text"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
							onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading1, { className: "mr-2 h-4 w-4" }), " Heading 1"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
							onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading2, { className: "mr-2 h-4 w-4" }), " Heading 2"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
							onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading3, { className: "mr-2 h-4 w-4" }), " Heading 3"]
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleBold().run(),
					active: editor.isActive("bold"),
					title: "Bold (Ctrl+B)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bold, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleItalic().run(),
					active: editor.isActive("italic"),
					title: "Italic (Ctrl+I)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Italic, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleUnderline().run(),
					active: editor.isActive("underline"),
					title: "Underline (Ctrl+U)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Underline, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleStrike().run(),
					active: editor.isActive("strike"),
					title: "Strikethrough",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strikethrough, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleCode().run(),
					active: editor.isActive("code"),
					title: "Inline code",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Code, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleHighlight().run(),
					active: editor.isActive("highlight"),
					title: "Highlight",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Highlighter, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleSuperscript().run(),
					active: editor.isActive("superscript"),
					title: "Superscript",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Superscript, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleSubscript().run(),
					active: editor.isActive("subscript"),
					title: "Subscript",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Subscript, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "h-10 w-10 sm:h-7 sm:w-7",
						title: "Text color",
						"aria-label": "Text color",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-bold",
							style: { color: editor.getAttributes("textStyle").color || "inherit" },
							children: "A"
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent, {
					align: "start",
					children: TEXT_COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
						onClick: () => c.value === "inherit" ? editor.chain().focus().unsetColor().run() : editor.chain().focus().setColor(c.value).run(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mr-2 h-3 w-3 rounded-full inline-block border border-border",
							style: { backgroundColor: c.value === "inherit" ? "currentColor" : c.value }
						}), c.label]
					}, c.value))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleBulletList().run(),
					active: editor.isActive("bulletList"),
					title: "Bullet list",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleOrderedList().run(),
					active: editor.isActive("orderedList"),
					title: "Numbered list",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleTaskList().run(),
					active: editor.isActive("taskList"),
					title: "Checklist",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleBlockquote().run(),
					active: editor.isActive("blockquote"),
					title: "Quote",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quote, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().setHorizontalRule().run(),
					title: "Horizontal rule",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().toggleCodeBlock().run(),
					active: editor.isActive("codeBlock"),
					title: "Code block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeXml, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().setTextAlign("left").run(),
					active: editor.isActive({ textAlign: "left" }),
					title: "Align left",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAlignStart, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().setTextAlign("center").run(),
					active: editor.isActive({ textAlign: "center" }),
					title: "Align center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAlignCenter, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().setTextAlign("right").run(),
					active: editor.isActive({ textAlign: "right" }),
					title: "Align right",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAlignEnd, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().setTextAlign("justify").run(),
					active: editor.isActive({ textAlign: "justify" }),
					title: "Justify",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAlignJustify, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
					open: linkOpen,
					onOpenChange: setLinkOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: `h-10 w-10 sm:h-7 sm:w-7 ${editor.isActive("link") ? "bg-accent text-accent-foreground" : ""}`,
							title: "Insert link",
							"aria-label": "Insert link",
							onClick: () => {
								const existing = editor.getAttributes("link").href || "";
								setLinkUrl(existing);
								setLinkOpen(true);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { className: "h-3.5 w-3.5" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
						className: "w-72 p-3",
						align: "start",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: linkUrl,
								onChange: (e) => setLinkUrl(e.target.value),
								placeholder: "https://...",
								className: "h-8 text-sm",
								onKeyDown: (e) => e.key === "Enter" && setLink(),
								autoFocus: true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								className: "h-8",
								onClick: setLink,
								children: "Apply"
							})]
						})
					})]
				}),
				editor.isActive("link") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().unsetLink().run(),
					title: "Remove link",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unlink, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					size: "sm",
					variant: "default",
					onClick: insertPrompt,
					className: "gap-1.5 h-7",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5" }), "Insert prompt"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {
					orientation: "vertical",
					className: "h-5 mx-1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
					title: "Clear formatting",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RemoveFormatting, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().undo().run(),
					disabled: !editor.can().undo(),
					title: "Undo (Ctrl+Z)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo, { className: "h-3.5 w-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolbarButton, {
					onClick: () => editor.chain().focus().redo().run(),
					disabled: !editor.can().redo(),
					title: "Redo (Ctrl+Shift+Z)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo, { className: "h-3.5 w-3.5" })
				})
			]
		})
	});
}
function PromptKitRichEditor({ value, onChange, placeholder = "Write an intro for your kit, then click \"Insert prompt\" to add a prompt block…", error = false, minHeight = 360 }) {
	const isInternalUpdate = (0, import_react.useRef)(false);
	const editor = useEditor({
		extensions: [
			index_default$3.configure({
				heading: { levels: [
					1,
					2,
					3
				] },
				codeBlock: { HTMLAttributes: { class: "rounded-md" } },
				link: false,
				underline: false
			}),
			index_default$2,
			index_default.configure({ placeholder }),
			index_default$1.configure({
				openOnClick: false,
				autolink: true,
				HTMLAttributes: { rel: "noopener noreferrer" }
			}),
			index_default$4,
			index_default$5.configure({ types: ["heading", "paragraph"] }),
			index_default$6.configure({ multicolor: true }),
			index_default$7,
			index_default$8.configure({ nested: true }),
			TextStyle,
			index_default$9,
			index_default$10,
			index_default$11,
			Markdown.configure({
				html: true,
				transformPastedText: true,
				breaks: false
			}),
			PromptBlock
		],
		content: markdownToEditorContent(value || ""),
		editorProps: { attributes: { class: "prose prose-sm md:prose-base dark:prose-invert max-w-none focus:outline-hidden px-4 py-4" } },
		onUpdate: ({ editor }) => {
			isInternalUpdate.current = true;
			onChange(buildKitMarkdown(editor));
			setTimeout(() => {
				isInternalUpdate.current = false;
			}, 0);
		}
	});
	(0, import_react.useEffect)(() => {
		if (!editor) return;
		if (isInternalUpdate.current) return;
		const current = buildKitMarkdown(editor);
		if ((value || "").trim() === (current || "").trim()) return;
		editor.commands.setContent(markdownToEditorContent(value || ""), { emitUpdate: false });
	}, [value, editor]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-md border bg-background overflow-hidden ${error ? "border-destructive" : "border-input"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitEditorToolbar, { editor }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: { minHeight },
			className: "overflow-y-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorContent, { editor })
		})]
	});
}
//#endregion
export { PromptKitRichEditor as t };
