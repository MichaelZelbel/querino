import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { I as ShieldAlert } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ModerationBlockDialog-DCe6GfCj.js
var import_jsx_runtime = require_jsx_runtime();
function LineNumberedEditor({ id, value, onChange, placeholder = "Write your content here...", error = false, minHeight = 300 }) {
	const lines = value.split("\n");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-md border border-input bg-background overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "select-none pr-3 pt-2 pb-2 text-right font-mono text-xs text-muted-foreground/50 leading-[1.7rem] min-w-[2.5rem] border-r border-border mr-0",
					"aria-hidden": "true",
					children: Array.from({ length: lines.length }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: i + 1 }, i + 1))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id,
					value,
					onChange: (e) => onChange(e.target.value),
					placeholder,
					className: `font-mono text-sm border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 leading-[1.7rem] resize-y ${error ? "border-destructive" : ""}`,
					style: {
						paddingTop: "0.5rem",
						minHeight: `${minHeight}px`
					}
				})]
			})
		})
	});
}
function ModerationBlockDialog({ open, onClose, category, supportHint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
		open,
		onOpenChange: (v) => !v && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-5 w-5 text-destructive" }), "Content cannot be published"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Your content appears to violate our",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/community-guidelines",
							className: "text-primary underline hover:text-primary/80",
							onClick: onClose,
							children: "Community Guidelines"
						}),
						"."
					] }),
					category && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm italic text-muted-foreground",
						children: ["Category: ", category]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: "Please review and edit your content. Your artifact has been kept as a private draft — nothing was lost."
					}),
					supportHint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: supportHint
					})
				]
			})
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
			onClick: onClose,
			children: "Understood"
		}) })] })
	});
}
//#endregion
export { ModerationBlockDialog as n, LineNumberedEditor as t };
