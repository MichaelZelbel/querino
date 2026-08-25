import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/empty-state-r6QZJNu5.js
var import_jsx_runtime = require_jsx_runtime();
function ActionButton({ action, variant }) {
	const Icon = action.icon;
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }) : null, action.label] });
	if (action.to) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		variant,
		className: "gap-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
			to: action.to,
			children: content
		})
	});
	if (action.href) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		variant,
		className: "gap-2",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: action.href,
			target: "_blank",
			rel: "noreferrer",
			children: content
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant,
		className: "gap-2",
		onClick: action.onClick,
		children: content
	});
}
function EmptyState({ icon: Icon, title, description, primaryAction, secondaryAction, variant = "default", className }) {
	const isCompact = variant === "compact";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center justify-center text-center", isCompact ? "py-8 gap-3" : "py-16 gap-4 rounded-xl border border-dashed border-border bg-muted/20 px-6", className),
		children: [
			Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("flex items-center justify-center rounded-full bg-primary/10 text-primary", isCompact ? "h-10 w-10" : "h-16 w-16 mb-1"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: isCompact ? "h-5 w-5" : "h-8 w-8" })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: cn("font-semibold text-foreground", isCompact ? "text-base" : "text-lg"),
					children: title
				}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto max-w-md text-sm text-muted-foreground",
					children: description
				}) : null]
			}),
			(primaryAction || secondaryAction) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center justify-center gap-2",
				children: [primaryAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
					action: primaryAction,
					variant: "default"
				}) : null, secondaryAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
					action: secondaryAction,
					variant: "outline"
				}) : null]
			})
		]
	});
}
//#endregion
export { EmptyState as t };
