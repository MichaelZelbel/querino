import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { $t as FileText, H as RotateCcw, Jt as GitBranch, gt as LoaderCircle, vn as Clock } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as format } from "../_libs/date-fns.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
import { t as ScrollArea } from "./scroll-area-D0AShDWm.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-CmQHWRHQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PromptKitVersionHistoryPanel-opkWA9PL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PromptKitVersionHistoryPanel({ open, onOpenChange, promptKitId, currentKit, onRestoreComplete }) {
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const [versions, setVersions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [restoring, setRestoring] = (0, import_react.useState)(null);
	const [isRestoring, setIsRestoring] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		async function fetchVersions() {
			if (!open || !promptKitId) return;
			setLoading(true);
			try {
				const { data, error } = await supabase.from("prompt_kit_versions").select("*").eq("prompt_kit_id", promptKitId).order("version_number", { ascending: false });
				if (error) {
					console.error(error);
					toast.error("Failed to load version history");
				} else setVersions(data || []);
			} finally {
				setLoading(false);
			}
		}
		fetchVersions();
	}, [open, promptKitId]);
	const handleRestore = async () => {
		if (!restoring || !user) return;
		setIsRestoring(true);
		try {
			const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;
			const { error: vErr } = await supabase.from("prompt_kit_versions").insert({
				prompt_kit_id: promptKitId,
				version_number: nextVersion,
				title: restoring.title,
				description: restoring.description,
				content: restoring.content,
				tags: restoring.tags,
				change_notes: `Restored from version v${restoring.version_number}`
			});
			if (vErr) {
				toast.error("Failed to restore version");
				return;
			}
			const { error: uErr } = await supabase.from("prompt_kits").update({
				title: restoring.title,
				description: restoring.description,
				content: restoring.content,
				tags: restoring.tags
			}).eq("id", promptKitId).eq("author_id", user.id);
			if (uErr) {
				toast.error("Version saved but failed to update kit");
				return;
			}
			toast.success(`Restored to version v${restoring.version_number}`);
			onOpenChange(false);
			if (onRestoreComplete) onRestoreComplete();
			else navigate(0);
		} finally {
			setIsRestoring(false);
			setRestoring(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			className: "w-full sm:max-w-md p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
				className: "px-4 py-4 border-b border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, { className: "h-5 w-5 text-primary" }), "Version History"]
				})
			}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4 p-4",
				children: [
					1,
					2,
					3
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-16 mb-2" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-3/4 mb-2" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-3 w-1/2" })
					]
				}, i))
			}) : versions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center py-12 px-4 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-8 w-8 text-muted-foreground" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mb-2 text-lg font-semibold text-foreground",
						children: "No versions yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground max-w-[280px]",
						children: "Create versions when editing to track changes and safely roll back if needed."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "h-[calc(100vh-120px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3 p-4",
					children: versions.map((version, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: index === 0 ? "default" : "secondary",
									className: "text-xs",
									children: ["v", version.version_number]
								}), index === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "text-xs",
									children: "Latest"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-sm font-medium text-foreground truncate",
								children: version.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 text-xs text-muted-foreground mt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a") })]
							}),
							version.change_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground mt-1.5 italic line-clamp-1",
								children: [
									"\"",
									version.change_notes,
									"\""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 pt-3 border-t border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									size: "sm",
									onClick: () => setRestoring(version),
									className: "gap-1.5 text-xs w-full",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3 w-3" }), "Restore this version"]
								})
							})
						]
					}, version.id))
				})
			})]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
		open: !!restoring,
		onOpenChange: () => setRestoring(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
			"Restore version v",
			restoring?.version_number,
			"?"
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
			"This will update your prompt kit with the content from version v",
			restoring?.version_number,
			" and create a new version entry."
		] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
			disabled: isRestoring,
			children: "Cancel"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogAction, {
			onClick: handleRestore,
			disabled: isRestoring,
			className: "gap-2",
			children: [isRestoring && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Restore"]
		})] })] })
	})] });
}
//#endregion
export { PromptKitVersionHistoryPanel as t };
