import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { u as Upload, v as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { d as parseMarkdownContent, f as readFileAsText } from "./Footer-ClUC5jzd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ImportMarkdownButton-D1LM1233.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ImportMarkdownButton({ type, variant = "outline", size = "default", label, className, onImport, isEditorMode = false }) {
	const navigate = useNavigate$1();
	const fileInputRef = (0, import_react.useRef)(null);
	const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
	const [pendingData, setPendingData] = (0, import_react.useState)(null);
	const handleClick = () => {
		fileInputRef.current?.click();
	};
	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const content = await readFileAsText(file);
			const parsed = parseMarkdownContent(content, file.name);
			parsed.frontmatter.type = type;
			if (isEditorMode && onImport) {
				setPendingData(parsed);
				setShowConfirm(true);
			} else if (onImport) onImport(parsed);
			else navigateToCreate(parsed);
		} catch (err) {
			console.error("Error reading markdown file:", err);
			toast.error("Failed to read markdown file");
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	const navigateToCreate = (parsed) => {
		const params = new URLSearchParams();
		params.set("title", parsed.frontmatter.title);
		if (parsed.frontmatter.description) params.set("description", parsed.frontmatter.description);
		if (parsed.frontmatter.tags && parsed.frontmatter.tags.length > 0) params.set("tags", parsed.frontmatter.tags.join(","));
		if (parsed.frontmatter.framework) params.set("framework", parsed.frontmatter.framework);
		params.set("content", parsed.content);
		navigate(`${{
			prompt: "/prompts/new",
			skill: "/skills/new",
			workflow: "/workflows/new",
			prompt_kit: "/prompt-kits/new"
		}[type]}?${params.toString()}`);
		toast.success("Markdown imported! Review and save your artefact.");
	};
	const handleConfirmImport = () => {
		if (pendingData && onImport) {
			onImport(pendingData);
			toast.success("Content replaced from markdown file");
		}
		setShowConfirm(false);
		setPendingData(null);
	};
	const getLabel = () => {
		if (label) return label;
		if (isEditorMode) return "Import .md";
		return {
			prompt: "New Prompt from .md",
			skill: "New Skill from .md",
			workflow: "New Workflow from .md",
			prompt_kit: "New Prompt Kit from .md"
		}[type];
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant,
			size,
			onClick: handleClick,
			className: `gap-2 ${className || ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }), getLabel()]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: fileInputRef,
			type: "file",
			accept: ".md",
			onChange: handleFileChange,
			className: "hidden"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: showConfirm,
			onOpenChange: setShowConfirm,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-5 w-5 text-amber-500" }), "Replace Current Content?"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Importing will replace the current editor content with the file contents. Any unsaved changes will be lost." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setShowConfirm(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: handleConfirmImport,
				children: "Continue"
			})] })] })
		})
	] });
}
//#endregion
export { ImportMarkdownButton as t };
