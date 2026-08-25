import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { nn as ExternalLink, yn as ClipboardCheck } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DropdownMenuTrigger, n as DropdownMenuContent, r as DropdownMenuItem, t as DropdownMenu } from "./useDebounce-CjI32hnI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SendToLLMButtons-dPxB-1LC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LLM_OPTIONS = [
	{
		id: "chatgpt",
		name: "ChatGPT",
		icon: "💬"
	},
	{
		id: "claude",
		name: "Claude",
		icon: "🤖"
	},
	{
		id: "gemini",
		name: "Gemini",
		icon: "✨"
	},
	{
		id: "perplexity",
		name: "Perplexity",
		icon: "🔍"
	}
];
var LLM_URLS = {
	chatgpt: (encoded) => `https://chat.openai.com/?prompt=${encoded}`,
	claude: (encoded) => `https://claude.ai/new?q=${encoded}`,
	gemini: (encoded) => `https://gemini.google.com/app?query=${encoded}`,
	perplexity: (encoded) => `https://www.perplexity.ai/?q=${encoded}`
};
var LLM_BASE_URLS = {
	chatgpt: "https://chat.openai.com/",
	claude: "https://claude.ai/new",
	gemini: "https://gemini.google.com/app",
	perplexity: "https://www.perplexity.ai/"
};
var MAX_URL_LENGTH = 6e3;
function needsClipboardFallback(model, prompt) {
	const encoded = encodeURIComponent(prompt);
	return LLM_URLS[model](encoded).length > MAX_URL_LENGTH;
}
async function openLLM(model, prompt, forceBase = false) {
	if (forceBase || !prompt) {
		window.open(LLM_BASE_URLS[model], "_blank");
		return "clipboard";
	}
	const encoded = encodeURIComponent(prompt);
	const url = LLM_URLS[model](encoded);
	if (url.length <= MAX_URL_LENGTH) {
		window.open(url, "_blank");
		return "url";
	}
	await navigator.clipboard.writeText(prompt);
	window.open(LLM_BASE_URLS[model], "_blank");
	return "clipboard";
}
function buildPromptForLLM(title, content) {
	return `# ${title}\n\n${content}`;
}
var PREFERENCE_KEY = "querino_preferred_llm";
function getPreferredLLM() {
	const stored = localStorage.getItem(PREFERENCE_KEY);
	if (stored && LLM_OPTIONS.some((opt) => opt.id === stored)) return stored;
	return null;
}
function setPreferredLLM(llm) {
	localStorage.setItem(PREFERENCE_KEY, llm);
}
function SendToLLMButtons({ title, content, variant = "full" }) {
	const [preferredLLM, setPreferred] = (0, import_react.useState)(getPreferredLLM);
	const [clipboardDialog, setClipboardDialog] = (0, import_react.useState)({
		open: false,
		llm: null
	});
	const handleSendToLLM = async (llm) => {
		const fullPrompt = buildPromptForLLM(title, content);
		if (needsClipboardFallback(llm, fullPrompt)) {
			await navigator.clipboard.writeText(fullPrompt);
			setPreferredLLM(llm);
			setPreferred(llm);
			setClipboardDialog({
				open: true,
				llm
			});
			return;
		}
		await openLLM(llm, fullPrompt);
		setPreferredLLM(llm);
		setPreferred(llm);
		const llmName = LLM_OPTIONS.find((o) => o.id === llm)?.name;
		toast.success(`Opening in ${llmName}...`);
	};
	const handleOpenLLM = () => {
		if (clipboardDialog.llm) openLLM(clipboardDialog.llm, "", true);
		setClipboardDialog({
			open: false,
			llm: null
		});
	};
	const llmName = clipboardDialog.llm ? LLM_OPTIONS.find((o) => o.id === clipboardDialog.llm)?.name : "";
	const clipboardDialogEl = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: clipboardDialog.open,
		onOpenChange: (open) => {
			if (!open) setClipboardDialog({
				open: false,
				llm: null
			});
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, { className: "h-5 w-5 text-primary" }), "Prompt copied to clipboard"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
				"This prompt is too long for a direct URL transfer. It has been copied to your clipboard. Click the button below to open ",
				llmName,
				", then paste it into the prompt box."
			] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setClipboardDialog({
					open: false,
					llm: null
				}),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: handleOpenLLM,
				className: "gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" }),
					"Open ",
					llmName
				]
			})] })]
		})
	});
	if (variant === "compact") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "ghost",
			size: "sm",
			className: "gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden sm:inline",
				children: "Send to LLM"
			})]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent, {
		align: "end",
		className: "bg-popover",
		children: LLM_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
			onClick: () => handleSendToLLM(option.id),
			className: "gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: option.icon }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: option.name }),
				preferredLLM === option.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto text-xs text-muted-foreground",
					children: "(preferred)"
				})
			]
		}, option.id))
	})] }), clipboardDialogEl] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-sm font-medium text-foreground",
			children: "Send to LLM"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-2",
			children: LLM_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: preferredLLM === option.id ? "secondary" : "outline",
				size: "sm",
				onClick: () => handleSendToLLM(option.id),
				className: "gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: option.icon }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: option.name }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3 w-3" })
				]
			}, option.id))
		})]
	}), clipboardDialogEl] });
}
//#endregion
export { SendToLLMButtons as t };
