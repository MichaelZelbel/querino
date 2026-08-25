import { a as __toESM } from "./_runtime.mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./_ssr/skeleton-cOr9hq3l.mjs";
import { An as Calendar, D as Tag, Et as Languages, Hn as Activity, Kt as GitFork, On as ChevronDown, Pt as History, Q as PinOff, Tn as ChevronUp, Vn as ArrowLeft, Xt as FolderPlus, Z as Pin, a as Users, at as Package, cn as Copy, et as Pencil, kn as Check, lt as MessageSquare, ut as MessageSquarePlus } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { n as format } from "./_libs/date-fns.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./_ssr/tabs-B4ZFfXyf.mjs";
import { t as Markdown } from "./_libs/react-markdown+[...].mjs";
import { t as CommentsSection } from "./_ssr/CommentsSection-BGZ8JMz4.mjs";
import { t as DownloadMarkdownButton } from "./_ssr/DownloadMarkdownButton-DBKsRp2M.mjs";
import { n as parsePromptKitDocument, r as parsePromptKitItems } from "./_ssr/promptKitParser-zZSbXXfv.mjs";
import { t as PromptKitVersionHistoryPanel } from "./_ssr/PromptKitVersionHistoryPanel-opkWA9PL.mjs";
import { t as createCloneHook } from "./_ssr/useCloneArtifact-C6wTjE_T.mjs";
import { t as useMenerioIntegration } from "./_ssr/useMenerioIntegration-s2hbByPY.mjs";
import { a as MenerioSyncButton, c as SuggestionsTab, d as createReviewsHook, f as isUuid, i as CopyArtifactToTeamModal, l as TranslateModal, m as useSuggestions, n as ActivitySidebar, o as ReviewSection, p as resolveSlugFromId, r as AddToCollectionModal, s as SuggestEditModal, t as AIInsightsPanel, u as createCopyToTeamHook } from "./_ssr/MenerioSyncButton-Bizux33R.mjs";
import { t as Route } from "./_slug.index-DLt5UqaZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.index-C1AJ0yRh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var useBase$1 = createCloneHook({
	table: "prompt_kits",
	label: "prompt kit",
	buildInsert: (source) => ({
		description: source.description,
		content: source.content,
		category: source.category,
		tags: source.tags || [],
		published: false
	}),
	editPath: (row) => `/prompt-kits/${row.slug}/edit`
});
function useClonePromptKit() {
	const { clone, cloning } = useBase$1();
	return {
		cloneKit: clone,
		cloning
	};
}
var useBase = createCopyToTeamHook({
	table: "prompt_kits",
	label: "prompt kit",
	buildInsert: (source, includeMetadata) => ({
		title: source.title,
		content: source.content,
		published: false,
		...includeMetadata ? {
			description: source.description,
			category: source.category,
			tags: source.tags || []
		} : {
			description: "",
			tags: []
		}
	})
});
function useCopyPromptKitToTeam() {
	const { copyToTeam, copying } = useBase();
	return {
		copyKitToTeam: copyToTeam,
		copying
	};
}
function CopyPromptKitToTeamModal({ open, onOpenChange, promptKit }) {
	const { copyKitToTeam, copying } = useCopyPromptKitToTeam();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyArtifactToTeamModal, {
		open,
		onOpenChange,
		source: promptKit,
		label: "prompt kit",
		detailPathPrefix: "/prompt-kits",
		copyToTeam: copyKitToTeam,
		copying
	});
}
var usePromptKitReviews = createReviewsHook({
	table: "prompt_kit_reviews",
	idColumn: "prompt_kit_id"
});
function PromptKitReviewSection({ kitId, kitSlug, userId, ratingAvg, ratingCount }) {
	const { reviews, userReview, loading, submitting, submitReview, deleteReview } = usePromptKitReviews(kitId, userId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
		itemId: kitId,
		itemType: "prompt_kit",
		itemSlug: kitSlug,
		userId,
		ratingAvg,
		ratingCount,
		reviews,
		userReview,
		loading,
		submitting,
		onSubmitReview: submitReview,
		onDeleteReview: deleteReview
	});
}
function usePinnedPromptKits() {
	const { user } = useAuthContext();
	const [pinnedIds, setPinnedIds] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const fetchIds = (0, import_react.useCallback)(async () => {
		if (!user) {
			setPinnedIds(/* @__PURE__ */ new Set());
			return;
		}
		const { data, error } = await supabase.from("prompt_kit_pins").select("prompt_kit_id").eq("user_id", user.id);
		if (error) {
			console.error("Error fetching prompt kit pins:", error);
			return;
		}
		setPinnedIds(new Set((data || []).map((row) => row.prompt_kit_id)));
	}, [user]);
	(0, import_react.useEffect)(() => {
		fetchIds();
	}, [fetchIds]);
	const isPinned = (0, import_react.useCallback)((kitId) => pinnedIds.has(kitId), [pinnedIds]);
	const pin = (0, import_react.useCallback)(async (kitId) => {
		if (!user) return { error: /* @__PURE__ */ new Error("Not authenticated") };
		const { error } = await supabase.from("prompt_kit_pins").insert({
			user_id: user.id,
			prompt_kit_id: kitId
		});
		if (error && error.code !== "23505") return { error };
		setPinnedIds((prev) => /* @__PURE__ */ new Set([...prev, kitId]));
		return { error: null };
	}, [user]);
	const unpin = (0, import_react.useCallback)(async (kitId) => {
		if (!user) return { error: /* @__PURE__ */ new Error("Not authenticated") };
		const { error } = await supabase.from("prompt_kit_pins").delete().eq("user_id", user.id).eq("prompt_kit_id", kitId);
		if (error) return { error };
		setPinnedIds((prev) => {
			const next = new Set(prev);
			next.delete(kitId);
			return next;
		});
		return { error: null };
	}, [user]);
	return {
		pinnedIds,
		isPinned,
		pin,
		unpin,
		togglePin: (0, import_react.useCallback)(async (kitId) => isPinned(kitId) ? unpin(kitId) : pin(kitId), [
			isPinned,
			pin,
			unpin
		]),
		refetch: fetchIds
	};
}
var COLLAPSE_THRESHOLD = 700;
function PromptCard({ index, title, body, onCopy, copied }) {
	const [expanded, setExpanded] = (0, import_react.useState)(body.length <= COLLAPSE_THRESHOLD);
	const shown = expanded ? body : body.slice(0, COLLAPSE_THRESHOLD).trimEnd() + "…";
	const canCollapse = body.length > COLLAPSE_THRESHOLD;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card overflow-hidden not-prose",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "secondary",
						className: "shrink-0",
						children: ["#", index]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold text-foreground truncate",
						children: title || "Untitled"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: copied ? "success" : "outline",
					onClick: onCopy,
					className: "gap-1.5 shrink-0",
					children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), "Copied"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), "Copy this prompt"] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed px-4 py-4 m-0 bg-background",
				children: shown
			}),
			canCollapse && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-border bg-muted/20 px-3 py-1.5 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: () => setExpanded((e) => !e),
					className: "h-7 gap-1.5 text-xs text-muted-foreground",
					children: expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-3.5 w-3.5" }), "Collapse"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3.5 w-3.5" }), "Show full prompt"] })
				})
			})
		]
	});
}
function PromptKitArticleView({ content, onCopyItem, copiedIdx }) {
	const segments = parsePromptKitDocument(content || "");
	if (segments.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border bg-muted/30 p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted-foreground",
			children: "This kit is empty."
		})
	});
	if (!segments.some((s) => s.type === "prompt")) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-muted/30 p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-muted-foreground",
			children: [
				"This kit doesn't contain any prompts yet (no",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					className: "font-mono",
					children: "## Prompt:"
				}),
				" headings found)."
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "mt-4 whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed",
			children: content
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-6",
		children: segments.map((seg, i) => seg.type === "prose" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "prose prose-sm md:prose-base dark:prose-invert max-w-none",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { children: seg.markdown })
		}, `prose-${i}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCard, {
			index: seg.index,
			title: seg.title,
			body: seg.body,
			copied: copiedIdx === seg.index,
			onCopy: () => onCopyItem(seg.body, seg.index)
		}, `prompt-${seg.index}`))
	});
}
function PromptKitDetail({ initialKit = null } = {}) {
	const { slug } = useParams$1();
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const { teams } = useWorkspace();
	const { cloneKit, cloning } = useClonePromptKit();
	const [kit, setKit] = (0, import_react.useState)(initialKit);
	const [loading, setLoading] = (0, import_react.useState)(!initialKit);
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [copiedAll, setCopiedAll] = (0, import_react.useState)(false);
	const [copiedIdx, setCopiedIdx] = (0, import_react.useState)(null);
	const [historyOpen, setHistoryOpen] = (0, import_react.useState)(false);
	const [copyTeamOpen, setCopyTeamOpen] = (0, import_react.useState)(false);
	const [suggestOpen, setSuggestOpen] = (0, import_react.useState)(false);
	const [collectionOpen, setCollectionOpen] = (0, import_react.useState)(false);
	const [pinning, setPinning] = (0, import_react.useState)(false);
	const [translateOpen, setTranslateOpen] = (0, import_react.useState)(false);
	const { hasIntegration: hasMenerio } = useMenerioIntegration(user?.id);
	const isAuthor = kit?.author_id && user?.id === kit.author_id;
	const hasTeams = teams && teams.length > 0;
	const { isPinned: isKitPinned, togglePin: toggleKitPin } = usePinnedPromptKits();
	const isPinned = kit?.id ? isKitPinned(kit.id) : false;
	const handleTogglePin = async () => {
		if (!user) {
			toast.error("Sign in to pin prompt kits");
			return;
		}
		if (!kit) return;
		setPinning(true);
		const { error } = await toggleKitPin(kit.id);
		setPinning(false);
		if (error) {
			toast.error("Failed to update pin");
			return;
		}
		toast.success(isPinned ? "Unpinned" : "Pinned!");
	};
	const { suggestions, loading: loadingSuggestions, openCount, createSuggestion, reviewSuggestion, requestChanges, updateSuggestionAfterChanges } = useSuggestions("prompt_kit", kit?.id || "");
	const handleApplySuggestion = async (suggestion) => {
		if (!kit) return;
		const updates = { content: suggestion.content };
		if (suggestion.title) updates.title = suggestion.title;
		if (suggestion.description) updates.description = suggestion.description;
		const { error } = await supabase.from("prompt_kits").update(updates).eq("id", kit.id);
		if (error) throw error;
		const { data } = await supabase.from("prompt_kits").select(`*, profiles:author_id (id, display_name, avatar_url)`).eq("slug", kit.slug).maybeSingle();
		if (data) setKit({
			...data,
			author: data.profiles || null
		});
	};
	(0, import_react.useEffect)(() => {
		async function fetchKit() {
			if (!slug) {
				setNotFound(true);
				setLoading(false);
				return;
			}
			if (isUuid(slug)) {
				const canonical = await resolveSlugFromId("prompt_kits", slug);
				if (canonical) {
					navigate(`/prompt-kits/${canonical}`, { replace: true });
					return;
				}
				setNotFound(true);
				setLoading(false);
				return;
			}
			try {
				const { data, error } = await supabase.from("prompt_kits").select(`*, profiles:author_id (id, display_name, avatar_url)`).eq("slug", slug).maybeSingle();
				if (error || !data) {
					const { data: redirect } = await supabase.from("prompt_kit_slug_redirects").select("prompt_kit_id").eq("old_slug", slug).maybeSingle();
					if (redirect?.prompt_kit_id) {
						const { data: kit2 } = await supabase.from("prompt_kits").select(`*, profiles:author_id (id, display_name, avatar_url), slug`).eq("id", redirect.prompt_kit_id).maybeSingle();
						if (kit2?.slug) {
							navigate(`/prompt-kits/${kit2.slug}`, { replace: true });
							return;
						}
					}
					setNotFound(true);
				} else setKit({
					...data,
					author: data.profiles || null
				});
			} catch {
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		}
		fetchKit();
	}, [slug, navigate]);
	const handleCopyAll = async () => {
		if (!kit) return;
		try {
			await navigator.clipboard.writeText(kit.content);
			setCopiedAll(true);
			toast.success("Entire kit copied!");
			setTimeout(() => setCopiedAll(false), 2e3);
		} catch {
			toast.error("Failed to copy");
		}
	};
	const handleCopyItem = async (body, index) => {
		try {
			await navigator.clipboard.writeText(body);
			setCopiedIdx(index);
			toast.success(`Prompt #${index} copied!`);
			setTimeout(() => setCopiedIdx(null), 2e3);
		} catch {
			toast.error("Failed to copy prompt");
		}
	};
	const getAuthorInitials = () => {
		if (kit?.author?.display_name) return kit.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
		return "U";
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-4 h-8 w-48" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-8 h-12 w-3/4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (notFound || !kit) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-4 text-display-md font-bold text-foreground",
							children: "Prompt Kit Not Found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "The prompt kit you're looking for doesn't exist or is no longer available."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/discover",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Discover"]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	const items = parsePromptKitItems(kit.content || "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => navigate(-1),
							className: "mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-4 flex flex-wrap items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "secondary",
											className: "text-sm gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-3 w-3" }), "Prompt Kit"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "text-sm",
											children: [
												items.length,
												" ",
												items.length === 1 ? "prompt" : "prompts"
											]
										}),
										kit.tags?.slice(0, 5).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "text-sm gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-3 w-3" }), tag]
										}, tag))
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mb-4 text-display-md font-bold text-foreground md:text-display-lg",
									children: kit.title
								}),
								kit.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-lg text-muted-foreground",
									children: kit.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 flex flex-wrap items-center gap-6",
									children: [kit.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
										to: `/u/${encodeURIComponent(kit.author.display_name || "")}`,
										className: "flex items-center gap-3 hover:opacity-80 transition-opacity",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
											className: "h-10 w-10",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: kit.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
												className: "bg-primary/10 text-primary",
												children: getAuthorInitials()
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-foreground hover:text-primary transition-colors",
											children: kit.author.display_name || "Anonymous"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Author"
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-sm text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Created ", format(new Date(kit.created_at), "MMM d, yyyy")] })]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 flex flex-wrap gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "lg",
									variant: copiedAll ? "success" : "default",
									onClick: handleCopyAll,
									className: "gap-2",
									children: copiedAll ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), "Copied!"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), "Copy entire kit"] })
								}),
								isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: `/prompt-kits/${kit.slug}/edit`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" }), "Edit Kit"]
									})
								}),
								isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "lg",
									variant: "outline",
									onClick: () => setHistoryOpen(true),
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4" }), "History"]
								}),
								user && !isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "lg",
									variant: "outline",
									onClick: () => cloneKit({
										id: kit.id,
										title: kit.title,
										description: kit.description,
										content: kit.content,
										category: kit.category,
										tags: kit.tags
									}, user.id),
									disabled: cloning,
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitFork, { className: "h-4 w-4" }), cloning ? "Cloning..." : "Clone to my library"]
								}),
								user && hasTeams && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "lg",
									variant: "outline",
									onClick: () => setCopyTeamOpen(true),
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4" }), "Copy to team"]
								}),
								user && !isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "lg",
									variant: "outline",
									onClick: () => setSuggestOpen(true),
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquarePlus, { className: "h-4 w-4" }), "Suggest edit"]
								}),
								user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "lg",
									variant: isPinned ? "secondary" : "outline",
									onClick: handleTogglePin,
									disabled: pinning,
									className: "gap-2",
									children: isPinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinOff, { className: "h-4 w-4" }), "Unpin"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-4 w-4" }), "Pin"] })
								}),
								user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "lg",
									variant: "outline",
									onClick: () => setCollectionOpen(true),
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "h-4 w-4" }), "Add to collection"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadMarkdownButton, {
									title: kit.title,
									type: "prompt_kit",
									description: kit.description,
									tags: kit.tags,
									content: kit.content,
									size: "lg"
								}),
								user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "lg",
									variant: "outline",
									onClick: () => setTranslateOpen(true),
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, { className: "h-4 w-4" }), "Translate"]
								}),
								isAuthor && hasMenerio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioSyncButton, {
									artifactType: "prompt_kit",
									artifactId: kit.id,
									menerioSynced: !!kit.menerio_synced,
									menerioSyncedAt: kit.menerio_synced_at || null,
									menerioNoteId: kit.menerio_note_id || null
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitArticleView, {
							content: kit.content || "",
							onCopyItem: (body, idx) => handleCopyItem(body, idx),
							copiedIdx
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitReviewSection, {
							kitId: kit.id,
							kitSlug: kit.slug || void 0,
							userId: user?.id,
							ratingAvg: kit.rating_avg || 0,
							ratingCount: kit.rating_count || 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
							defaultValue: "comments",
							className: "mt-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
										value: "comments",
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4" }), "Comments"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
										value: "suggestions",
										className: "gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquarePlus, { className: "h-4 w-4" }),
											"Suggestions",
											openCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "secondary",
												className: "ml-1 h-5 px-1.5 text-xs",
												children: openCount
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
										value: "activity",
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4 w-4" }), "Activity"]
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "comments",
									className: "mt-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSection, {
										itemType: "prompt_kit",
										itemId: kit.id,
										teamId: kit.team_id
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "suggestions",
									className: "mt-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestionsTab, {
										suggestions,
										loading: loadingSuggestions,
										itemType: "prompt_kit",
										itemId: kit.id,
										originalTitle: kit.title,
										originalDescription: kit.description || "",
										originalContent: kit.content,
										isOwner: !!isAuthor,
										onReviewSuggestion: reviewSuggestion,
										onRequestChanges: requestChanges,
										onUpdateSuggestion: updateSuggestionAfterChanges,
										onApplySuggestion: handleApplySuggestion
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "activity",
									className: "mt-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivitySidebar, {
										itemId: kit.id,
										itemType: "prompt_kit"
									})
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIInsightsPanel, {
				itemType: "prompt_kit",
				itemId: kit.id
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TranslateModal, {
				open: translateOpen,
				onOpenChange: setTranslateOpen,
				artifactType: "prompt_kit",
				sourceLanguage: kit.language || "en",
				title: kit.title,
				description: kit.description || "",
				content: kit.content,
				tags: kit.tags || [],
				category: kit.category || void 0
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddToCollectionModal, {
				open: collectionOpen,
				onOpenChange: setCollectionOpen,
				itemType: "prompt_kit",
				itemId: kit.id
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestEditModal, {
				open: suggestOpen,
				onOpenChange: setSuggestOpen,
				itemType: "prompt_kit",
				currentTitle: kit.title,
				currentDescription: kit.description || "",
				currentContent: kit.content,
				onSubmit: createSuggestion
			}),
			isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitVersionHistoryPanel, {
				open: historyOpen,
				onOpenChange: setHistoryOpen,
				promptKitId: kit.id,
				currentKit: {
					id: kit.id,
					title: kit.title,
					description: kit.description,
					content: kit.content,
					tags: kit.tags
				}
			}),
			user && hasTeams && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyPromptKitToTeamModal, {
				open: copyTeamOpen,
				onOpenChange: setCopyTeamOpen,
				promptKit: {
					id: kit.id,
					title: kit.title,
					description: kit.description,
					content: kit.content,
					category: kit.category,
					tags: kit.tags
				}
			})
		]
	});
}
function RouteComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitDetail, { initialKit: Route.useLoaderData() });
}
//#endregion
export { RouteComponent as component };
