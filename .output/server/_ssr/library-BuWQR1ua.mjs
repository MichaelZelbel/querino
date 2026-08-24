import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { $t as FileText, B as Search, Ct as Library, J as Plus, N as SquareCheckBig, P as Sparkles, Sn as CircleCheck, W as RefreshCw, Wt as Github, Xt as FolderPlus, Yt as Folder, Z as Pin, Zt as FolderOpen, at as Package, b as Trash2, gt as LoaderCircle, jn as Building2, n as X, nn as ExternalLink, r as Workflow } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, i as useAuth, l as useSearchParams, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { o as useDebounce } from "./useDebounce-CjI32hnI.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { t as Checkbox } from "./checkbox-B00mezr5.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
import { t as ScrollArea } from "./scroll-area-D0AShDWm.mjs";
import { t as EmptyState } from "./empty-state-r6QZJNu5.mjs";
import { a as useCreateCollection, i as useCollections, t as useAddToCollection } from "./useCollections-BePFdUZR.mjs";
import { n as useSkills, r as useWorkflows } from "./useWorkflows-Dv1gQobh.mjs";
import { t as usePromptKits } from "./usePromptKits-wSRxzmnW.mjs";
import { t as useMenerioIntegration } from "./useMenerioIntegration-s2hbByPY.mjs";
import { t as usePinnedPrompts } from "./usePinnedPrompts-DDaPyuEo.mjs";
import { t as UpsellModal } from "./UpsellModal-CEnDkFkf.mjs";
import { r as PromptCard } from "./PromptCard-CVKouFhA.mjs";
import { n as WorkflowCard, t as SkillCard } from "./WorkflowCard-TJ4_k22S.mjs";
import { t as CollectionCard } from "./CollectionCard-hfM5LfR1.mjs";
import { t as PromptKitCard } from "./PromptKitCard-byr1CEPk.mjs";
import { t as Root } from "../_libs/@radix-ui/react-toggle+[...].mjs";
import { n as ToggleGroupItem$1, t as ToggleGroup$1 } from "../_libs/@radix-ui/react-toggle-group+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/library-BuWQR1ua.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var toggleVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground", {
	variants: {
		variant: {
			default: "bg-transparent",
			outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
		},
		size: {
			default: "h-10 px-3",
			sm: "h-9 px-2.5",
			lg: "h-11 px-5"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Toggle = import_react.forwardRef(({ className, variant, size, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn(toggleVariants({
		variant,
		size,
		className
	})),
	...props
}));
Toggle.displayName = Root.displayName;
var ToggleGroupContext = import_react.createContext({
	size: "default",
	variant: "default"
});
var ToggleGroup = import_react.forwardRef(({ className, variant, size, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroup$1, {
	ref,
	className: cn("flex items-center justify-center gap-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroupContext.Provider, {
		value: {
			variant,
			size
		},
		children
	})
}));
ToggleGroup.displayName = ToggleGroup$1.displayName;
var ToggleGroupItem = import_react.forwardRef(({ className, children, variant, size, ...props }, ref) => {
	const context = import_react.useContext(ToggleGroupContext);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleGroupItem$1, {
		ref,
		className: cn(toggleVariants({
			variant: context.variant || variant,
			size: context.size || size
		}), className),
		...props,
		children
	});
});
ToggleGroupItem.displayName = ToggleGroupItem$1.displayName;
/**
* Unified Library section header.
* - h2 title + muted count chip (no italic, no mixed weight)
* - Single-line layout at ≥640px (sm), wraps cleanly on mobile
* - Action slot is right-aligned and stable
*/
function SectionHeader({ icon: Icon, iconNode, title, count, total, showFraction = false, action, iconClassName = "h-5 w-5 text-primary" }) {
	const countLabel = showFraction && total !== void 0 && total !== count ? `${count} of ${total}` : `${count}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:flex-nowrap",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 items-center gap-2",
			children: [
				iconNode ?? (Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: iconClassName }) : null),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "truncate text-xl font-semibold text-foreground",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground",
					"aria-label": showFraction && total !== void 0 && total !== count ? `${count} of ${total}` : `${count} items`,
					children: countLabel
				})
			]
		}), action && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0",
			children: action
		})]
	});
}
function BulkActionBar({ count, onClear, onAddToCollection, onSyncMenerio, onDelete, deleting, syncing }) {
	if (count === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "region",
		"aria-label": "Bulk actions",
		className: "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "px-2 text-sm font-medium text-foreground",
				children: [count, " selected"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5 w-px bg-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onAddToCollection,
				className: "gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "h-4 w-4" }), "Add to Collection"]
			}),
			onSyncMenerio && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onSyncMenerio,
				disabled: syncing,
				className: "gap-2",
				children: [syncing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4" }), "Sync to Menerio"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "ghost",
					disabled: deleting,
					className: "gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive",
					children: [deleting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), "Delete"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
				"Delete ",
				count,
				" item",
				count === 1 ? "" : "s",
				"?"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This action cannot be undone. The selected artifacts and their versions will be permanently deleted." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
				onClick: onDelete,
				className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				children: "Delete"
			})] })] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5 w-px bg-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onClear,
				className: "gap-1",
				"aria-label": "Clear selection",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), "Clear"]
			})
		]
	});
}
function BulkAddToCollectionModal({ open, onOpenChange, items, onDone }) {
	const { user } = useAuth();
	const { data: collections, isLoading } = useCollections(user?.id);
	const addToCollection = useAddToCollection();
	const createCollection = useCreateCollection();
	const [showNewForm, setShowNewForm] = (0, import_react.useState)(false);
	const [newTitle, setNewTitle] = (0, import_react.useState)("");
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const addAll = async (collectionId) => {
		setBusyId(collectionId);
		let added = 0;
		let skipped = 0;
		let failed = 0;
		for (const item of items) try {
			await addToCollection.mutateAsync({
				collection_id: collectionId,
				item_type: item.type,
				item_id: item.id
			});
			added++;
		} catch (err) {
			if (err?.code === "23505") skipped++;
			else failed++;
		}
		setBusyId(null);
		if (added > 0) toast.success(`Added ${added} item${added === 1 ? "" : "s"} to collection.`);
		if (skipped > 0) toast.info(`${skipped} already in collection.`);
		if (failed > 0) toast.error(`${failed} failed to add.`);
		onOpenChange(false);
		onDone?.();
	};
	const handleCreateAndAdd = async () => {
		if (!newTitle.trim() || !user) return;
		try {
			const collection = await createCollection.mutateAsync({
				title: newTitle.trim(),
				is_public: false,
				owner_id: user.id
			});
			await addAll(collection.id);
			setNewTitle("");
			setShowNewForm(false);
		} catch (err) {
			console.error("Error creating collection:", err);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: [
				"Add ",
				items.length,
				" item",
				items.length === 1 ? "" : "s",
				" to Collection"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Pick an existing collection or create a new one." })] }), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					showNewForm ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Collection name",
							value: newTitle,
							onChange: (e) => setNewTitle(e.target.value),
							autoFocus: true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								className: "flex-1",
								onClick: () => {
									setShowNewForm(false);
									setNewTitle("");
								},
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "flex-1",
								onClick: handleCreateAndAdd,
								disabled: !newTitle.trim() || createCollection.isPending || !!busyId,
								children: createCollection.isPending || busyId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Create & Add"
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "w-full justify-start gap-2",
						onClick: () => setShowNewForm(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "Create new collection"]
					}),
					collections && collections.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
						className: "max-h-[300px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: collections.map((collection) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								className: "w-full justify-start gap-2",
								onClick: () => addAll(collection.id),
								disabled: !!busyId,
								children: [
									busyId === collection.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-4 w-4" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1 text-left truncate",
										children: collection.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [collection.item_count || 0, " items"]
									})
								]
							}, collection.id))
						})
					}),
					collections && collections.length === 0 && !showNewForm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-sm text-muted-foreground py-4",
						children: "No collections yet. Create one above!"
					})
				]
			})]
		})
	});
}
var TABLE_BY_TYPE = {
	prompt: "prompts",
	skill: "skills",
	workflow: "workflows",
	prompt_kit: "prompt_kits"
};
function SelectableCard({ selectMode, selected, onToggle, children, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn(selectMode && "pointer-events-none"),
			children
		}), selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onToggle,
			"aria-pressed": selected,
			"aria-label": `${selected ? "Deselect" : "Select"} ${label}`,
			className: cn("absolute inset-0 rounded-xl border-2 transition-colors", selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-foreground/[0.03]")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-3 top-3 z-10 rounded-md bg-card/90 p-1 shadow-sm backdrop-blur",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
				checked: selected,
				onCheckedChange: onToggle,
				"aria-label": `Select ${label}`
			})
		})] })]
	});
}
function Library$1() {
	const navigate = useNavigate$1();
	const { user, profile, loading: authLoading } = useAuthContext();
	const { currentWorkspace, currentTeam, isTeamWorkspace } = useWorkspace();
	const [savedPrompts, setSavedPrompts] = (0, import_react.useState)([]);
	const [showPlanUpsell, setShowPlanUpsell] = (0, import_react.useState)(false);
	const [myPrompts, setMyPrompts] = (0, import_react.useState)([]);
	const [userRatings, setUserRatings] = (0, import_react.useState)({});
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const debouncedSearch = useDebounce(searchQuery, 300);
	const ALL_TYPES = [
		"prompts",
		"skills",
		"workflows",
		"kits",
		"saved",
		"collections"
	];
	const [searchParams, setSearchParams] = useSearchParams();
	const sort = searchParams.get("sort") || "recent";
	const typesParam = searchParams.get("types");
	const activeTypes = typesParam ? typesParam.split(",").filter((t) => ALL_TYPES.includes(t)) : [...ALL_TYPES];
	const menerioFilter = searchParams.get("menerio") || "all";
	const updateParam = (0, import_react.useCallback)((key, value) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			if (!value) next.delete(key);
			else next.set(key, value);
			return next;
		}, { replace: true });
	}, [setSearchParams]);
	const setSort = (value) => updateParam("sort", value === "recent" ? null : value);
	const setTypes = (values) => {
		if (values.length === 0 || values.length === ALL_TYPES.length) updateParam("types", null);
		else updateParam("types", values.join(","));
	};
	const setMenerioFilter = (value) => updateParam("menerio", value === "all" ? null : value);
	const isTypeVisible = (t) => activeTypes.includes(t);
	function sortItems(items) {
		const copy = [...items];
		switch (sort) {
			case "oldest": return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
			case "az": return copy.sort((a, b) => a.title.localeCompare(b.title));
			case "za": return copy.sort((a, b) => b.title.localeCompare(a.title));
			case "rating": return copy.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
			default: return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
		}
	}
	function applyMenerio(items) {
		if (menerioFilter === "all") return items;
		if (menerioFilter === "synced") return items.filter((i) => i.menerio_synced);
		return items.filter((i) => !i.menerio_synced);
	}
	const [githubSettings, setGithubSettings] = (0, import_react.useState)(null);
	const [syncing, setSyncing] = (0, import_react.useState)(false);
	const [syncSuccessDialogOpen, setSyncSuccessDialogOpen] = (0, import_react.useState)(false);
	const { data: mySkills, isLoading: skillsLoading } = useSkills({
		authorId: isTeamWorkspace ? void 0 : user?.id,
		teamId: isTeamWorkspace ? currentWorkspace : void 0
	});
	const { data: myWorkflows, isLoading: workflowsLoading } = useWorkflows({
		authorId: isTeamWorkspace ? void 0 : user?.id,
		teamId: isTeamWorkspace ? currentWorkspace : void 0
	});
	const { data: myKits, isLoading: kitsLoading } = usePromptKits({
		authorId: isTeamWorkspace ? void 0 : user?.id,
		teamId: isTeamWorkspace ? currentWorkspace : void 0
	});
	const { pinnedPromptIds, pinnedPrompts, loading: pinnedLoading, isPromptPinned, refetch: refetchPinned } = usePinnedPrompts({
		teamId: isTeamWorkspace ? currentWorkspace : void 0,
		personalOnly: !isTeamWorkspace
	});
	const { data: myCollections, isLoading: collectionsLoading } = useCollections(user?.id);
	const { hasIntegration: hasMenerio } = useMenerioIntegration(user?.id);
	const queryClient = useQueryClient();
	const [selectMode, setSelectMode] = (0, import_react.useState)(false);
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [bulkDeleting, setBulkDeleting] = (0, import_react.useState)(false);
	const [bulkSyncing, setBulkSyncing] = (0, import_react.useState)(false);
	const [bulkAddOpen, setBulkAddOpen] = (0, import_react.useState)(false);
	const selKey = (type, id) => `${type}:${id}`;
	const isSelected = (0, import_react.useCallback)((type, id) => selected.has(selKey(type, id)), [selected]);
	const toggleSelect = (0, import_react.useCallback)((type, id) => {
		setSelected((prev) => {
			const next = new Set(prev);
			const key = selKey(type, id);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);
	const clearSelection = (0, import_react.useCallback)(() => setSelected(/* @__PURE__ */ new Set()), []);
	const exitSelectMode = (0, import_react.useCallback)(() => {
		setSelectMode(false);
		setSelected(/* @__PURE__ */ new Set());
	}, []);
	const selectedItems = (0, import_react.useMemo)(() => Array.from(selected).map((key) => {
		const [type, id] = key.split(":");
		return {
			type,
			id
		};
	}), [selected]);
	const groupSelected = (0, import_react.useMemo)(() => {
		const groups = {
			prompt: [],
			skill: [],
			workflow: [],
			prompt_kit: []
		};
		for (const { type, id } of selectedItems) groups[type].push(id);
		return groups;
	}, [selectedItems]);
	const handleBulkDelete = async () => {
		if (!user || selectedItems.length === 0) return;
		setBulkDeleting(true);
		try {
			let totalDeleted = 0;
			for (const t of Object.keys(groupSelected)) {
				const ids = groupSelected[t];
				if (ids.length === 0) continue;
				const table = TABLE_BY_TYPE[t];
				let q = supabase.from(table).delete().in("id", ids);
				if (isTeamWorkspace) q = q.eq("team_id", currentWorkspace);
				else q = q.eq("author_id", user.id).is("team_id", null);
				const { error } = await q;
				if (error) {
					console.error(`Bulk delete ${table} failed:`, error);
					toast.error(`Failed to delete some ${table}`);
				} else totalDeleted += ids.length;
			}
			if (totalDeleted > 0) toast.success(`Deleted ${totalDeleted} item${totalDeleted === 1 ? "" : "s"}.`);
			setMyPrompts((prev) => prev.filter((p) => !groupSelected.prompt.includes(p.id)));
			setSavedPrompts((prev) => prev.filter((p) => !groupSelected.prompt.includes(p.id)));
			queryClient.invalidateQueries({ queryKey: ["skills"] });
			queryClient.invalidateQueries({ queryKey: ["workflows"] });
			queryClient.invalidateQueries({ queryKey: ["prompt_kits"] });
			refetchPinned();
			exitSelectMode();
		} finally {
			setBulkDeleting(false);
		}
	};
	const handleBulkSyncMenerio = async () => {
		if (!user || !hasMenerio) return;
		const syncable = selectedItems.filter((i) => i.type !== "prompt_kit");
		if (syncable.length === 0) {
			toast.info("Selected items can't be synced to Menerio.");
			return;
		}
		setBulkSyncing(true);
		try {
			const rows = syncable.map((i) => ({
				user_id: user.id,
				artifact_type: i.type,
				artifact_id: i.id,
				status: "pending"
			}));
			const { error } = await supabase.from("menerio_sync_queue").insert(rows);
			if (error) {
				console.error("Bulk Menerio sync failed:", error);
				toast.error("Failed to queue Menerio sync");
			} else {
				toast.success(`${rows.length} item${rows.length === 1 ? "" : "s"} queued for Menerio sync.`);
				exitSelectMode();
			}
		} finally {
			setBulkSyncing(false);
		}
	};
	const filteredMyPrompts = (0, import_react.useMemo)(() => {
		if (!debouncedSearch.trim()) return myPrompts;
		const search = debouncedSearch.toLowerCase();
		return myPrompts.filter((prompt) => prompt.title.toLowerCase().includes(search) || prompt.description.toLowerCase().includes(search) || prompt.content.toLowerCase().includes(search) || (prompt.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false));
	}, [myPrompts, debouncedSearch]);
	const filteredPinnedPrompts = (0, import_react.useMemo)(() => {
		if (!debouncedSearch.trim()) return pinnedPrompts;
		const search = debouncedSearch.toLowerCase();
		return pinnedPrompts.filter((prompt) => prompt.title.toLowerCase().includes(search) || prompt.description.toLowerCase().includes(search) || prompt.content.toLowerCase().includes(search) || (prompt.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false));
	}, [pinnedPrompts, debouncedSearch]);
	const filteredSavedPrompts = (0, import_react.useMemo)(() => {
		if (!debouncedSearch.trim()) return savedPrompts;
		const search = debouncedSearch.toLowerCase();
		return savedPrompts.filter((prompt) => prompt.title.toLowerCase().includes(search) || prompt.description.toLowerCase().includes(search) || prompt.content.toLowerCase().includes(search) || (prompt.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false));
	}, [savedPrompts, debouncedSearch]);
	const filteredMySkills = (0, import_react.useMemo)(() => {
		if (!debouncedSearch.trim() || !mySkills) return mySkills || [];
		const search = debouncedSearch.toLowerCase();
		return mySkills.filter((skill) => skill.title.toLowerCase().includes(search) || (skill.description?.toLowerCase().includes(search) ?? false) || skill.content.toLowerCase().includes(search) || (skill.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false));
	}, [mySkills, debouncedSearch]);
	const filteredMyWorkflows = (0, import_react.useMemo)(() => {
		if (!debouncedSearch.trim() || !myWorkflows) return myWorkflows || [];
		const search = debouncedSearch.toLowerCase();
		return myWorkflows.filter((workflow) => workflow.title.toLowerCase().includes(search) || (workflow.description?.toLowerCase().includes(search) ?? false) || (workflow.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false));
	}, [myWorkflows, debouncedSearch]);
	const filteredMyKits = (0, import_react.useMemo)(() => {
		if (!debouncedSearch.trim() || !myKits) return myKits || [];
		const search = debouncedSearch.toLowerCase();
		return myKits.filter((kit) => kit.title.toLowerCase().includes(search) || (kit.description?.toLowerCase().includes(search) ?? false) || (kit.content?.toLowerCase().includes(search) ?? false) || (kit.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false));
	}, [myKits, debouncedSearch]);
	const displayPinnedPrompts = (0, import_react.useMemo)(() => sortItems(applyMenerio(filteredPinnedPrompts)), [
		filteredPinnedPrompts,
		sort,
		menerioFilter
	]);
	const displayMyPrompts = (0, import_react.useMemo)(() => sortItems(applyMenerio(filteredMyPrompts)), [
		filteredMyPrompts,
		sort,
		menerioFilter
	]);
	const displayMySkills = (0, import_react.useMemo)(() => sortItems(applyMenerio(filteredMySkills)), [
		filteredMySkills,
		sort,
		menerioFilter
	]);
	const displayMyWorkflows = (0, import_react.useMemo)(() => sortItems(applyMenerio(filteredMyWorkflows)), [
		filteredMyWorkflows,
		sort,
		menerioFilter
	]);
	const displayMyKits = (0, import_react.useMemo)(() => sortItems(filteredMyKits), [filteredMyKits, sort]);
	const displaySavedPrompts = (0, import_react.useMemo)(() => sortItems(applyMenerio(filteredSavedPrompts)), [
		filteredSavedPrompts,
		sort,
		menerioFilter
	]);
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate("/auth?redirect=/library", { replace: true });
	}, [
		user,
		authLoading,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		async function loadGithubSettings() {
			if (!user) return;
			if (isTeamWorkspace && currentTeam) setGithubSettings({
				github_repo: currentTeam.github_repo,
				github_branch: currentTeam.github_branch,
				github_folder: currentTeam.github_folder,
				github_sync_enabled: !!currentTeam.github_repo
			});
			else {
				const { data, error } = await supabase.from("profiles").select("github_repo, github_branch, github_folder, github_sync_enabled").eq("id", user.id).single();
				if (!error && data) setGithubSettings(data);
			}
		}
		if (user) loadGithubSettings();
	}, [
		user,
		isTeamWorkspace,
		currentTeam
	]);
	const handleSyncToGithub = async () => {
		if (!user || !githubSettings?.github_repo) return;
		setSyncing(true);
		try {
			const { data, error } = await supabase.functions.invoke("github-sync", { body: { teamId: isTeamWorkspace ? currentWorkspace : void 0 } });
			if (error) throw error;
			if (data?.success) setSyncSuccessDialogOpen(true);
			else throw new Error(data?.error || "Sync failed");
		} catch (error) {
			console.error("GitHub sync error:", error);
			toast.error(error instanceof Error ? error.message : "GitHub sync failed. Please check your settings.");
		} finally {
			setSyncing(false);
		}
	};
	const getGithubFolderUrl = () => {
		if (!githubSettings?.github_repo) return "";
		const branch = githubSettings.github_branch || "main";
		const folder = githubSettings.github_folder?.replace(/^\/+|\/+$/g, "") || "";
		const baseUrl = `https://github.com/${githubSettings.github_repo}/tree/${branch}`;
		return folder ? `${baseUrl}/${folder}` : baseUrl;
	};
	const handleOpenGithub = () => {
		const url = getGithubFolderUrl();
		if (url) window.open(url, "_blank", "noopener,noreferrer");
		setSyncSuccessDialogOpen(false);
	};
	const canSyncToGithub = githubSettings?.github_sync_enabled && githubSettings?.github_repo;
	const hasContent = myPrompts.length > 0 || (mySkills?.length || 0) > 0 || (myWorkflows?.length || 0) > 0;
	const libraryIsEmpty = myPrompts.length === 0 && (mySkills?.length || 0) === 0 && (myWorkflows?.length || 0) === 0 && (myKits?.length || 0) === 0 && savedPrompts.length === 0 && (myCollections?.length || 0) === 0;
	(0, import_react.useEffect)(() => {
		async function fetchLibraryData() {
			if (!user) return;
			setLoading(true);
			try {
				let promptsQuery = supabase.from("prompts").select("*");
				if (isTeamWorkspace) promptsQuery = promptsQuery.eq("team_id", currentWorkspace);
				else promptsQuery = promptsQuery.eq("author_id", user.id).is("team_id", null);
				const { data: ownPrompts, error: ownError } = await promptsQuery.order("created_at", { ascending: false });
				if (ownError) console.error("Error fetching prompts:", ownError);
				else setMyPrompts(ownPrompts || []);
				if (!isTeamWorkspace) {
					const { data: savedData, error: savedError } = await supabase.from("user_saved_prompts").select("prompt_id").eq("user_id", user.id);
					if (savedError) console.error("Error fetching saved prompts:", savedError);
					if (savedData && savedData.length > 0) {
						const promptIds = savedData.map((s) => s.prompt_id);
						const { data: promptsData, error: promptsError } = await supabase.from("prompts").select("*").in("id", promptIds);
						if (promptsError) console.error("Error fetching prompts:", promptsError);
						else setSavedPrompts(promptsData || []);
						const { data: ratingsData, error: ratingsError } = await supabase.from("prompt_reviews").select("prompt_id, rating").eq("user_id", user.id).in("prompt_id", promptIds);
						if (ratingsError) console.error("Error fetching ratings:", ratingsError);
						else if (ratingsData) {
							const ratings = {};
							ratingsData.forEach((r) => {
								ratings[r.prompt_id] = r.rating;
							});
							setUserRatings(ratings);
						}
					} else setSavedPrompts([]);
				} else setSavedPrompts([]);
			} catch (err) {
				console.error("Error fetching library data:", err);
			} finally {
				setLoading(false);
			}
		}
		if (user) {
			fetchLibraryData();
			refetchPinned();
		}
	}, [
		user,
		currentWorkspace,
		isTeamWorkspace,
		refetchPinned
	]);
	if (authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user) return null;
	const isLoading = loading || skillsLoading || workflowsLoading || kitsLoading || pinnedLoading || collectionsLoading;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto px-4 py-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-display-md font-bold text-foreground",
									children: isTeamWorkspace ? currentTeam?.name : "My Library"
								}), isTeamWorkspace && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "secondary",
									className: "gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-3 w-3" }), "Team"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-muted-foreground",
								children: isTeamWorkspace ? "Team shared prompts, skills, and workflows" : `Welcome back${profile?.display_name ? `, ${profile.display_name}` : ""}!`
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-3",
								children: [canSyncToGithub && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									className: "gap-2",
									onClick: handleSyncToGithub,
									disabled: syncing || !hasContent,
									children: [syncing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-4 w-4" }), syncing ? "Syncing..." : "Sync to GitHub"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "gap-2",
									onClick: () => navigate("/prompts/new"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "Create"]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative w-full max-w-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "text",
									placeholder: "Search your library...",
									value: searchQuery,
									onChange: (e) => setSearchQuery(e.target.value),
									className: "pl-10"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: sort,
										onValueChange: setSort,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-9 w-[170px]",
											"aria-label": "Sort library",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Sort by" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "recent",
												children: "Most recent"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "oldest",
												children: "Oldest first"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "az",
												children: "Title A–Z"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "za",
												children: "Title Z–A"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "rating",
												children: "Top rated"
											})
										] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToggleGroup, {
										type: "multiple",
										value: activeTypes,
										onValueChange: (v) => setTypes(v),
										variant: "outline",
										size: "sm",
										"aria-label": "Filter by type",
										className: "flex-wrap",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToggleGroupItem, {
												value: "prompts",
												"aria-label": "Show prompts",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-1 h-3.5 w-3.5" }), "Prompts"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToggleGroupItem, {
												value: "skills",
												"aria-label": "Show skills",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-1 h-3.5 w-3.5" }), "Skills"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToggleGroupItem, {
												value: "workflows",
												"aria-label": "Show workflows",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "mr-1 h-3.5 w-3.5" }), "Workflows"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToggleGroupItem, {
												value: "kits",
												"aria-label": "Show prompt kits",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "mr-1 h-3.5 w-3.5" }), "Kits"]
											}),
											!isTeamWorkspace && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToggleGroupItem, {
												value: "saved",
												"aria-label": "Show saved prompts",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, { className: "mr-1 h-3.5 w-3.5" }), "Saved"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToggleGroupItem, {
												value: "collections",
												"aria-label": "Show collections",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "mr-1 h-3.5 w-3.5" }), "Collections"]
											})] })
										]
									}),
									hasMenerio && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: menerioFilter,
										onValueChange: setMenerioFilter,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-9 w-[180px]",
											"aria-label": "Filter by Menerio sync",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Menerio" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "All items"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "synced",
												children: "Synced to Menerio"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "unsynced",
												children: "Not synced"
											})
										] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										variant: selectMode ? "secondary" : "outline",
										size: "sm",
										onClick: () => {
											if (selectMode) exitSelectMode();
											else setSelectMode(true);
										},
										className: "gap-2",
										"aria-pressed": selectMode,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, { className: "h-4 w-4" }), selectMode ? "Done" : "Select"]
									})
								]
							})]
						}),
						isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-center py-20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
						}) : libraryIsEmpty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							icon: Library,
							title: isTeamWorkspace ? "This team's library is empty" : "Your library is empty",
							description: "Create your first prompt, or explore the community to find something worth saving.",
							primaryAction: {
								label: "Create Prompt",
								to: "/prompts/new",
								icon: Plus
							},
							secondaryAction: {
								label: "Explore Discover",
								to: "/discover",
								icon: Sparkles
							}
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-12",
							children: [
								isTypeVisible("prompts") && pinnedPrompts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									iconNode: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-5 w-5 text-warning" }),
									title: "📌 Pinned",
									count: displayPinnedPrompts.length,
									total: pinnedPrompts.length,
									showFraction: !!debouncedSearch
								}), displayPinnedPrompts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "py-8 text-center text-muted-foreground",
									children: "No pinned prompts match your search."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
									children: displayPinnedPrompts.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectableCard, {
										selectMode,
										selected: isSelected("prompt", prompt.id),
										onToggle: () => toggleSelect("prompt", prompt.id),
										label: prompt.title,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCard, {
											prompt,
											showAuthorBadge: true,
											currentUserId: user?.id,
											editPath: "library",
											showSendToLLM: true,
											isPinned: true,
											showMenerioStatus: hasMenerio
										})
									}, prompt.id))
								})] }),
								isTypeVisible("prompts") && myPrompts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Sparkles,
									title: isTeamWorkspace ? "Team Prompts" : "My Prompts",
									count: displayMyPrompts.length,
									total: myPrompts.length,
									showFraction: !!debouncedSearch
								}), displayMyPrompts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
									variant: "compact",
									icon: Search,
									title: debouncedSearch ? "No prompts match your search" : "No prompts yet",
									description: debouncedSearch ? "Try a different keyword or clear your search." : "Create your first prompt to see it here.",
									primaryAction: debouncedSearch ? {
										label: "Clear search",
										onClick: () => setSearchQuery("")
									} : {
										label: "New Prompt",
										to: "/prompts/new",
										icon: Plus
									}
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
									children: displayMyPrompts.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectableCard, {
										selectMode,
										selected: isSelected("prompt", prompt.id),
										onToggle: () => toggleSelect("prompt", prompt.id),
										label: prompt.title,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCard, {
											prompt,
											showAuthorBadge: true,
											currentUserId: user?.id,
											editPath: "library",
											showSendToLLM: true,
											isPinned: isPromptPinned(prompt.id),
											showMenerioStatus: hasMenerio
										})
									}, prompt.id))
								})] }),
								isTypeVisible("skills") && (mySkills?.length || 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: FileText,
									title: isTeamWorkspace ? "Team Skills" : "My Skills",
									count: displayMySkills.length,
									total: mySkills?.length,
									showFraction: !!debouncedSearch
								}), displayMySkills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
									variant: "compact",
									icon: Search,
									title: "No skills match your search",
									description: "Try a different keyword or clear your search.",
									primaryAction: {
										label: "Clear search",
										onClick: () => setSearchQuery("")
									}
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
									children: displayMySkills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectableCard, {
										selectMode,
										selected: isSelected("skill", skill.id),
										onToggle: () => toggleSelect("skill", skill.id),
										label: skill.title,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillCard, {
											skill,
											showEditButton: true,
											currentUserId: user?.id,
											showMenerioStatus: hasMenerio
										})
									}, skill.id))
								})] }),
								isTypeVisible("workflows") && (myWorkflows?.length || 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Workflow,
									title: isTeamWorkspace ? "Team Workflows" : "My Workflows",
									count: displayMyWorkflows.length,
									total: myWorkflows?.length,
									showFraction: !!debouncedSearch
								}), displayMyWorkflows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
									variant: "compact",
									icon: Search,
									title: "No workflows match your search",
									description: "Try a different keyword or clear your search.",
									primaryAction: {
										label: "Clear search",
										onClick: () => setSearchQuery("")
									}
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
									children: displayMyWorkflows.map((workflow) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectableCard, {
										selectMode,
										selected: isSelected("workflow", workflow.id),
										onToggle: () => toggleSelect("workflow", workflow.id),
										label: workflow.title,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowCard, {
											workflow,
											showEditButton: true,
											currentUserId: user?.id,
											showMenerioStatus: hasMenerio
										})
									}, workflow.id))
								})] }),
								isTypeVisible("kits") && (myKits?.length || 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Package,
									title: isTeamWorkspace ? "Team Prompt Kits" : "My Prompt Kits",
									count: displayMyKits.length,
									total: myKits?.length,
									showFraction: !!debouncedSearch
								}), displayMyKits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
									variant: "compact",
									icon: Search,
									title: "No prompt kits match your search",
									description: "Try a different keyword or clear your search.",
									primaryAction: {
										label: "Clear search",
										onClick: () => setSearchQuery("")
									}
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
									children: displayMyKits.map((kit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectableCard, {
										selectMode,
										selected: isSelected("prompt_kit", kit.id),
										onToggle: () => toggleSelect("prompt_kit", kit.id),
										label: kit.title,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitCard, {
											kit,
											showEditButton: true,
											currentUserId: user?.id
										})
									}, kit.id))
								})] }),
								!isTeamWorkspace && isTypeVisible("saved") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Library,
									title: "Saved Prompts",
									count: displaySavedPrompts.length,
									total: savedPrompts.length,
									showFraction: !!debouncedSearch
								}), savedPrompts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, { className: "h-8 w-8 text-primary" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mb-2 text-lg font-semibold text-foreground",
											children: "No saved prompts yet"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mb-6 max-w-md text-muted-foreground",
											children: "Discover and save prompts you love to build your collection."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: "/discover",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "secondary",
												className: "gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "Discover prompts"]
											})
										})
									]
								}) : displaySavedPrompts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "py-8 text-center text-muted-foreground",
									children: "No saved prompts match your search."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
									children: displaySavedPrompts.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCard, {
										prompt,
										currentUserId: user?.id,
										userRating: userRatings[prompt.id],
										showSendToLLM: true
									}, prompt.id))
								})] }),
								!isTeamWorkspace && isTypeVisible("collections") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: FolderOpen,
									title: "My Collections",
									count: myCollections?.length || 0,
									action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
										to: "/collections/new",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "outline",
											className: "gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "New Collection"]
										})
									})
								}), !myCollections || myCollections.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "h-8 w-8 text-primary" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mb-2 text-lg font-semibold text-foreground",
											children: "No collections yet"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mb-6 max-w-md text-muted-foreground",
											children: "Create collections to organize your prompts, skills, and workflows."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: "/collections/new",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "secondary",
												className: "gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "Create Collection"]
											})
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
									children: myCollections.map((collection) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollectionCard, {
										collection,
										showOwner: false
									}, collection.id))
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-12 rounded-lg border border-border bg-muted/30 p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-medium text-foreground",
									children: [
										"Current Plan:",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "capitalize",
											children: profile?.plan_type || "Free"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: profile?.plan_type === "free" ? "Premium adds AI insights, the Kickstart wizard, semantic search, GitHub sync and team workspaces." : "You have access to all premium features"
								})] }), profile?.plan_type === "free" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => setShowPlanUpsell(true),
									children: "See what Premium includes"
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpsellModal, {
							open: showPlanUpsell,
							onOpenChange: setShowPlanUpsell
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BulkActionBar, {
				count: selected.size,
				onClear: clearSelection,
				onAddToCollection: () => setBulkAddOpen(true),
				onSyncMenerio: hasMenerio ? handleBulkSyncMenerio : void 0,
				onDelete: handleBulkDelete,
				deleting: bulkDeleting,
				syncing: bulkSyncing
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BulkAddToCollectionModal, {
				open: bulkAddOpen,
				onOpenChange: setBulkAddOpen,
				items: selectedItems,
				onDone: exitSelectMode
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: syncSuccessDialogOpen,
				onOpenChange: setSyncSuccessDialogOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-success" }), "Sync Successful"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"Your ",
						isTeamWorkspace ? "team" : "library",
						" has been successfully synced to GitHub."
					] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => setSyncSuccessDialogOpen(false),
							children: "Close"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: handleOpenGithub,
							className: "gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-4 w-4" }),
								"Open GitHub",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3 w-3" })
							]
						})]
					})]
				})
			})
		]
	});
}
var SplitComponent = Library$1;
//#endregion
export { SplitComponent as component };
