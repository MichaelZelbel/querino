import { a as __toESM } from "./_runtime.mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, t as Card } from "./_ssr/card-4AsKRAzx.mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Input } from "./_ssr/input-DZABqqwC.mjs";
import { t as Label } from "./_ssr/label-DBD1bRRP.mjs";
import { t as Textarea } from "./_ssr/textarea-C03-A3RU.mjs";
import { t as Switch } from "./_ssr/switch-BXNTxolN.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { $t as FileText, J as Plus, V as Save, Vn as ArrowLeft, Vt as GripVertical, b as Trash2, gt as LoaderCircle, mn as Code, r as Workflow } from "./_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./_ssr/select-Byrv14ho.mjs";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, t as Dialog } from "./_ssr/dialog-s-1huv4W.mjs";
import { c as useParams$1, i as useAuth, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./_ssr/alert-dialog-Dt930TVg.mjs";
import { t as ScrollArea } from "./_ssr/scroll-area-D0AShDWm.mjs";
import { t as EmptyState } from "./_ssr/empty-state-r6QZJNu5.mjs";
import { c as useUpdateCollection, l as useUpdateItemOrder, n as useCollection, o as useDeleteCollection, r as useCollectionItems, s as useRemoveFromCollection, t as useAddToCollection } from "./_ssr/useCollections-BePFdUZR.mjs";
import { t as usePrompts } from "./_ssr/usePrompts-2WpWnSVp.mjs";
import { n as useSkills, r as useWorkflows } from "./_ssr/useWorkflows-Dv1gQobh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id.edit-TDje-vqU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CollectionEdit() {
	const { id } = useParams$1();
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuth();
	const { data: collection, isLoading: loadingCollection } = useCollection(id || "");
	const { data: items, isLoading: loadingItems } = useCollectionItems(id || "");
	const { data: prompts } = usePrompts();
	const { data: skills } = useSkills();
	const { data: workflows } = useWorkflows();
	const updateCollection = useUpdateCollection();
	const deleteCollection = useDeleteCollection();
	const addToCollection = useAddToCollection();
	const removeFromCollection = useRemoveFromCollection();
	useUpdateItemOrder();
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [isPublic, setIsPublic] = (0, import_react.useState)(false);
	const [initialized, setInitialized] = (0, import_react.useState)(false);
	const [showAddModal, setShowAddModal] = (0, import_react.useState)(false);
	const [addItemType, setAddItemType] = (0, import_react.useState)("prompt");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	if (collection && !initialized) {
		setTitle(collection.title);
		setDescription(collection.description || "");
		setIsPublic(collection.is_public);
		setInitialized(true);
	}
	if (!authLoading && (!user || collection && user.id !== collection.owner_id)) {
		navigate("/collections");
		return null;
	}
	const handleSave = async () => {
		if (!id || !title.trim()) return;
		await updateCollection.mutateAsync({
			id,
			title: title.trim(),
			description: description.trim() || void 0,
			is_public: isPublic
		});
	};
	const handleDelete = async () => {
		if (!id) return;
		await deleteCollection.mutateAsync(id);
		navigate("/collections");
	};
	const handleRemoveItem = async (itemId) => {
		if (!id) return;
		await removeFromCollection.mutateAsync({
			collectionId: id,
			itemId
		});
	};
	const userPrompts = prompts?.filter((p) => p.author_id === user?.id) || [];
	const userSkills = skills?.filter((s) => s.author_id === user?.id) || [];
	const userWorkflows = workflows?.filter((w) => w.author_id === user?.id) || [];
	const getAvailableItems = () => {
		const existingIds = new Set(items?.map((i) => i.item_id) || []);
		let available = [];
		if (addItemType === "prompt") available = userPrompts.filter((p) => !existingIds.has(p.id));
		else if (addItemType === "skill") available = userSkills.filter((s) => !existingIds.has(s.id));
		else available = userWorkflows.filter((w) => !existingIds.has(w.id));
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			available = available.filter((item) => item.title.toLowerCase().includes(query));
		}
		return available;
	};
	const handleAddItem = async (itemId) => {
		if (!id) return;
		await addToCollection.mutateAsync({
			collection_id: id,
			item_type: addItemType,
			item_id: itemId
		});
	};
	const itemsWithData = items?.map((item) => {
		let data = null;
		if (item.item_type === "prompt") data = prompts?.find((p) => p.id === item.item_id);
		else if (item.item_type === "skill") data = skills?.find((s) => s.id === item.item_id);
		else if (item.item_type === "workflow") data = workflows?.find((w) => w.id === item.item_id);
		return {
			...item,
			data
		};
	});
	const getItemIcon = (type) => {
		switch (type) {
			case "prompt": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" });
			case "skill": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Code, { className: "h-4 w-4" });
			case "workflow": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-4 w-4" });
			default: return null;
		}
	};
	if (loadingCollection || loadingItems) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (!collection) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 flex flex-col items-center justify-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold",
					children: "Collection not found"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => navigate("/collections"),
					children: "Back to Collections"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 container mx-auto px-4 py-8 max-w-4xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					className: "mb-6",
					onClick: () => navigate(`/collections/${id}`),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Collection"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Collection Settings" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "title",
									children: "Title *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "title",
									value: title,
									onChange: (e) => setTitle(e.target.value),
									placeholder: "Collection title"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "description",
									children: "Description"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "description",
									value: description,
									onChange: (e) => setDescription(e.target.value),
									placeholder: "What's this collection about?",
									rows: 3
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "public",
										children: "Make Public"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Public collections can be viewed by anyone"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									id: "public",
									checked: isPublic,
									onCheckedChange: setIsPublic
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleSave,
									disabled: !title.trim() || updateCollection.isPending,
									className: "flex-1",
									children: [updateCollection.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4 mr-2" }), "Save Changes"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "destructive",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete Collection?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This action cannot be undone. This will permanently delete the collection and remove all items from it." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
									onClick: handleDelete,
									className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
									children: "Delete"
								})] })] })] })]
							})
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
							"Items (",
							itemsWithData?.length || 0,
							")"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: () => setShowAddModal(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }), "Add Item"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: itemsWithData && itemsWithData.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: itemsWithData.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 p-3 border rounded-lg",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { className: "h-4 w-4 text-muted-foreground cursor-grab" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-2 bg-muted rounded",
									children: getItemIcon(item.item_type)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1 min-w-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium truncate",
											children: item.data?.title || "Unknown"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-xs",
											children: item.item_type
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleRemoveItem(item.id),
									"aria-label": "Remove item from collection",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
								})
							]
						}, item.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						variant: "compact",
						icon: FileText,
						title: "No items in this collection yet",
						description: "Add prompts, skills, or workflows from your library to organise them here.",
						primaryAction: {
							label: "Add item",
							icon: Plus,
							onClick: () => setShowAddModal(true)
						},
						secondaryAction: {
							label: "Open my library",
							to: "/library"
						}
					}) })] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showAddModal,
				onOpenChange: setShowAddModal,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add Item to Collection" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: addItemType,
									onValueChange: (v) => setAddItemType(v),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "prompt",
											children: "Prompt"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "skill",
											children: "Skill"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "workflow",
											children: "Workflow"
										})
									] })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Search" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Search your items...",
									value: searchQuery,
									onChange: (e) => setSearchQuery(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
								className: "max-h-[300px]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [getAvailableItems().map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										onClick: () => {
											handleAddItem(item.id);
											setShowAddModal(false);
											setSearchQuery("");
										},
										children: [getItemIcon(addItemType), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: item.title
										})]
									}, item.id)), getAvailableItems().length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-center text-sm text-muted-foreground py-4",
										children: "No items available to add"
									})]
								})
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = CollectionEdit;
//#endregion
export { SplitComponent as component };
