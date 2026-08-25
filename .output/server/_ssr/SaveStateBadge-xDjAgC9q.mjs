import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { bn as Circle, gt as LoaderCircle, kn as Check } from "../_libs/lucide-react.mjs";
import { u as useBlocker } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SaveStateBadge-xDjAgC9q.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function snapshot(value) {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}
function useUnsavedChanges({ data, isSaving, onSave, enableShortcut = true, enableBeforeUnload = true, enableNavigationGuard = true }) {
	const baselineRef = (0, import_react.useRef)(null);
	const [, force] = (0, import_react.useState)(0);
	const [savedAt, setSavedAt] = (0, import_react.useState)(null);
	const current = snapshot(data);
	const isDirty = baselineRef.current !== null && baselineRef.current !== current;
	const markSaved = (0, import_react.useCallback)(() => {
		baselineRef.current = snapshot(data);
		setSavedAt(/* @__PURE__ */ new Date());
		force((n) => n + 1);
	}, [data]);
	const onSaveRef = (0, import_react.useRef)(onSave);
	(0, import_react.useEffect)(() => {
		onSaveRef.current = onSave;
	}, [onSave]);
	const savingRef = (0, import_react.useRef)(isSaving);
	(0, import_react.useEffect)(() => {
		savingRef.current = isSaving;
	}, [isSaving]);
	const dirtyRef = (0, import_react.useRef)(isDirty);
	(0, import_react.useEffect)(() => {
		dirtyRef.current = isDirty;
	}, [isDirty]);
	(0, import_react.useEffect)(() => {
		if (!enableShortcut) return;
		const handler = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (savingRef.current || !dirtyRef.current) return;
				onSaveRef.current();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [enableShortcut]);
	(0, import_react.useEffect)(() => {
		if (!enableBeforeUnload || !isDirty) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [enableBeforeUnload, isDirty]);
	const blocker = useBlocker({
		shouldBlockFn: ({ current, next }) => enableNavigationGuard && dirtyRef.current && current.pathname !== next.pathname,
		enableBeforeUnload: false,
		withResolver: true
	});
	(0, import_react.useEffect)(() => {
		if (blocker.status !== "blocked") return;
		if (window.confirm("You have unsaved changes. Leave without saving?")) blocker.proceed?.();
		else blocker.reset?.();
	}, [blocker]);
	return {
		isDirty,
		savedAt,
		markSaved
	};
}
function formatRelative(date) {
	const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1e3));
	if (diff < 5) return "just now";
	if (diff < 60) return `${diff}s ago`;
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return date.toLocaleDateString();
}
function SaveStateBadge({ isDirty, isSaving, savedAt, className }) {
	const [, tick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!savedAt) return;
		const id = setInterval(() => tick((n) => n + 1), 3e4);
		return () => clearInterval(id);
	}, [savedAt]);
	if (isSaving) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-1.5 text-xs text-muted-foreground", className),
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saving…" })]
	});
	if (isDirty) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400", className),
		"aria-live": "polite",
		title: "Press ⌘S / Ctrl+S to save",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Unsaved changes" })]
	});
	if (savedAt) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400", className),
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Saved · ", formatRelative(savedAt)] })]
	});
	return null;
}
//#endregion
export { useUnsavedChanges as n, SaveStateBadge as t };
