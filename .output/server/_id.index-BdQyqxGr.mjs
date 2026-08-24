import { o as __toESM } from "./_runtime.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as CardContent, t as Card } from "./_ssr/card-4AsKRAzx.mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { $t as FileText, In as BookOpen, Ut as Globe, Vn as ArrowLeft, at as Package, b as Trash2, cn as Copy, et as Pencil, gt as LoaderCircle, ht as Lock, r as Workflow } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { c as useParams$1, i as useAuth, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./_ssr/tabs-B4ZFfXyf.mjs";
import { a as useCreateCollection, n as useCollection, r as useCollectionItems, s as useRemoveFromCollection, t as useAddToCollection } from "./_ssr/useCollections-BePFdUZR.mjs";
import { t as usePrompts } from "./_ssr/usePrompts-2WpWnSVp.mjs";
import { n as useSkills, r as useWorkflows } from "./_ssr/useWorkflows-Dv1gQobh.mjs";
import { t as usePromptKits } from "./_ssr/usePromptKits-wSRxzmnW.mjs";
import { t as CommentsSection } from "./_ssr/CommentsSection-BGZ8JMz4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id.index-BdQyqxGr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CollectionDetail() {
	const { id } = useParams$1();
	const navigate = useNavigate$1();
	const { user } = useAuth();
	const [activeFilter, setActiveFilter] = (0, import_react.useState)("all");
	const { data: collection, isLoading: loadingCollection } = useCollection(id || "");
	const { data: items, isLoading: loadingItems } = useCollectionItems(id || "");
	const { data: prompts } = usePrompts();
	const { data: skills } = useSkills();
	const { data: workflows } = useWorkflows();
	const { data: promptKits } = usePromptKits({});
	const createCollection = useCreateCollection();
	const addToCollection = useAddToCollection();
	const removeFromCollection = useRemoveFromCollection();
	const isOwner = user?.id === collection?.owner_id;
	const itemsWithData = (0, import_react.useMemo)(() => {
		return items?.map((item) => {
			let data = null;
			if (item.item_type === "prompt") data = prompts?.find((p) => p.id === item.item_id);
			else if (item.item_type === "skill") data = skills?.find((s) => s.id === item.item_id);
			else if (item.item_type === "workflow") data = workflows?.find((w) => w.id === item.item_id);
			else if (item.item_type === "prompt_kit") data = promptKits?.find((k) => k.id === item.item_id);
			return {
				...item,
				data
			};
		}) || [];
	}, [
		items,
		prompts,
		skills,
		workflows,
		promptKits
	]);
	const filteredItems = (0, import_react.useMemo)(() => {
		if (activeFilter === "all") return itemsWithData;
		return itemsWithData.filter((item) => item.item_type === activeFilter);
	}, [itemsWithData, activeFilter]);
	const itemCounts = (0, import_react.useMemo)(() => {
		const counts = {
			prompt: 0,
			skill: 0,
			workflow: 0,
			prompt_kit: 0
		};
		itemsWithData.forEach((item) => {
			if (item.item_type in counts) counts[item.item_type]++;
		});
		return counts;
	}, [itemsWithData]);
	const handleCloneCollection = async () => {
		if (!user || !collection || !items) {
			toast.error("Please sign in to clone this collection");
			return;
		}
		try {
			const newCollection = await createCollection.mutateAsync({
				title: `Copy of ${collection.title}`,
				description: collection.description || void 0,
				is_public: false,
				owner_id: user.id
			});
			for (const item of items) await addToCollection.mutateAsync({
				collection_id: newCollection.id,
				item_type: item.item_type,
				item_id: item.item_id
			});
			toast.success("Collection cloned to your library!");
			navigate(`/collections/${newCollection.id}/edit`);
		} catch (error) {
			console.error("Error cloning collection:", error);
			toast.error("Failed to clone collection");
		}
	};
	const handleRemoveItem = async (itemId) => {
		if (!id) return;
		try {
			await removeFromCollection.mutateAsync({
				collectionId: id,
				itemId
			});
		} catch (error) {
			console.error("Error removing item:", error);
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
					onClick: () => navigate("/library"),
					children: "Back to Library"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	const ownerName = collection.owner?.display_name || "Anonymous";
	const ownerInitial = ownerName.charAt(0).toUpperCase();
	const getItemIcon = (type) => {
		switch (type) {
			case "prompt": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" });
			case "skill": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-4 w-4" });
			case "workflow": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-4 w-4" });
			case "prompt_kit": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4" });
			default: return null;
		}
	};
	const getItemLink = (item) => {
		switch (item.item_type) {
			case "prompt": return `/prompts/${item.data?.slug || item.item_id}`;
			case "skill": return `/skills/${item.data?.slug || item.item_id}`;
			case "workflow": return `/workflows/${item.data?.slug || item.item_id}`;
			case "prompt_kit": return `/prompt-kits/${item.data?.slug || item.item_id}`;
			default: return "#";
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 container mx-auto px-4 py-8 max-w-4xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						className: "mb-6",
						onClick: () => navigate("/library"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Library"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-4 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "text-3xl font-bold",
										children: collection.title
									}), collection.is_public ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-5 w-5 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-5 w-5 text-muted-foreground" })]
								}), collection.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground",
									children: collection.description
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2",
								children: isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
										to: `/collections/${collection.id}/edit`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4 mr-2" }), "Edit"]
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: handleCloneCollection,
									disabled: createCollection.isPending,
									children: [createCollection.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4 mr-2" }), "Clone Collection"]
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: `/u/${ownerName}`,
							className: "inline-flex items-center gap-2 hover:opacity-80",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "h-8 w-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: collection.owner?.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, { children: ownerInitial })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm text-muted-foreground",
								children: ["by ", ownerName]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
						value: activeFilter,
						onValueChange: setActiveFilter,
						className: "mb-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "all",
								className: "gap-2",
								children: ["All", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "h-5 px-1.5",
									children: itemsWithData.length
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "prompt",
								className: "gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-3.5 w-3.5" }),
									"Prompts",
									itemCounts.prompt > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "h-5 px-1.5",
										children: itemCounts.prompt
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "skill",
								className: "gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-3.5 w-3.5" }),
									"Skills",
									itemCounts.skill > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "h-5 px-1.5",
										children: itemCounts.skill
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "workflow",
								className: "gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-3.5 w-3.5" }),
									"Workflows",
									itemCounts.workflow > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "h-5 px-1.5",
										children: itemCounts.workflow
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
								value: "prompt_kit",
								className: "gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-3.5 w-3.5" }),
									"Prompt Kits",
									itemCounts.prompt_kit > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "h-5 px-1.5",
										children: itemCounts.prompt_kit
									})
								]
							})
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-lg font-semibold",
							children: [
								activeFilter === "all" ? "All Items" : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}s`,
								" ",
								"(",
								filteredItems.length,
								")"
							]
						}), filteredItems.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: filteredItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "hover:shadow-md transition-shadow",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
									className: "p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
											to: getItemLink(item),
											className: "flex items-center gap-3 flex-1 min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "p-2 bg-muted rounded",
												children: getItemIcon(item.item_type)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-medium truncate",
														children: item.data?.title || "Unknown item"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: "outline",
														className: "text-xs capitalize",
														children: item.item_type
													})]
												}), item.data?.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground truncate",
													children: item.data.description
												})]
											})]
										}), isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => handleRemoveItem(item.id),
											disabled: removeFromCollection.isPending,
											className: "text-muted-foreground hover:text-destructive",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
										})]
									})
								})
							}, item.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "py-12 text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: activeFilter === "all" ? "This collection is empty" : `No ${activeFilter}s in this collection`
							})
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSection, {
							itemType: "collection",
							itemId: collection.id,
							teamId: collection.team_id
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = CollectionDetail;
//#endregion
export { SplitComponent as component };
