import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { B as Search, Ht as GraduationCap, M as Star, Mn as Briefcase, P as Sparkles, it as Palette, mn as Code, nt as PenTool, vn as Clock, y as TrendingUp } from "../_libs/lucide-react.mjs";
import { t as useInfiniteQuery } from "../_libs/tanstack__react-query.mjs";
import { o as useDebounce } from "./useDebounce-CjI32hnI.mjs";
import { t as EmptyState } from "./empty-state-r6QZJNu5.mjs";
import { t as mergeWithSemantic } from "./useSemanticMerge-Cq21jyT4.mjs";
import { t as categories } from "./prompt-C3zowaN0.mjs";
import { r as PromptCard } from "./PromptCard-CVKouFhA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PromptsSection-p4LD28rZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var iconMap = {
	Sparkles,
	PenTool,
	Code,
	Briefcase,
	Palette,
	Search,
	GraduationCap
};
function CategoryFilter({ selected, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-2",
		children: categories.map((category) => {
			const Icon = iconMap[category.icon];
			const isSelected = selected === category.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: isSelected ? "default" : "outline",
				size: "sm",
				onClick: () => onSelect(category.id),
				className: "gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }), category.label]
			}, category.id);
		})
	});
}
var SEARCH_RESULT_CAP = 50;
async function fetchPromptsByIds(ids) {
	if (ids.length === 0) return [];
	const { data, error } = await supabase.from("prompts").select(`*, profiles:author_id (id, display_name, avatar_url)`).in("id", ids);
	if (error || !data) return [];
	return data.map((item) => ({
		...item,
		author: item.profiles || null,
		profiles: void 0
	}));
}
/**
* Public prompt discovery. Browsing is paginated server-side (the old
* version downloaded every public prompt, full content included, on every
* visit). Searching stays single-shot: FTS capped at SEARCH_RESULT_CAP,
* plus the semantic merge for concept matches.
*/
function useSearchPrompts({ searchQuery, isPublic = true, userId, category = "all", tag, sortBy = "trending", pageSize = 24 }) {
	const trimmed = (searchQuery ?? "").trim();
	const isSearching = trimmed.length > 0;
	const query = useInfiniteQuery({
		queryKey: [
			"prompts",
			"search",
			"hybrid",
			trimmed,
			isPublic,
			userId,
			category,
			tag,
			sortBy,
			pageSize
		],
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			if (isSearching) return void 0;
			return lastPage.length === pageSize ? allPages.length : void 0;
		},
		queryFn: async ({ pageParam }) => {
			let query = supabase.from("prompts").select(`*, profiles:author_id (id, display_name, avatar_url)`);
			if (isPublic) query = query.eq("is_public", true);
			else if (userId) query = query.eq("author_id", userId);
			if (category && category !== "all") query = query.eq("category", category);
			if (tag) query = query.contains("tags", [tag]);
			if (isSearching) query = query.textSearch("title,description,content", trimmed, {
				type: "websearch",
				config: "simple"
			}).limit(SEARCH_RESULT_CAP);
			else {
				switch (sortBy) {
					case "newest":
						query = query.order("created_at", { ascending: false });
						break;
					case "rating":
						query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
						break;
					default: query = query.order("copies_count", {
						ascending: false,
						nullsFirst: false
					}).order("rating_avg", { ascending: false }).order("created_at", { ascending: false });
				}
				const from = pageParam * pageSize;
				query = query.range(from, from + pageSize - 1);
			}
			const { data, error } = await query;
			if (error) throw new Error(error.message);
			const ftsResults = data.map((item) => ({
				...item,
				author: item.profiles || null,
				profiles: void 0
			}));
			if (isSearching && isPublic && trimmed.length >= 3) return await mergeWithSemantic("prompt", trimmed, ftsResults, fetchPromptsByIds);
			return ftsResults;
		},
		staleTime: 6e4
	});
	return {
		data: query.data ? query.data.pages.flat() : void 0,
		isLoading: query.isLoading,
		error: query.error,
		hasNextPage: query.hasNextPage,
		fetchNextPage: query.fetchNextPage,
		isFetchingNextPage: query.isFetchingNextPage
	};
}
function PromptsSection({ showHeader = true, tagFilter = "", initialSearch = "", onClearTag }) {
	const [category, setCategory] = (0, import_react.useState)("all");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)(initialSearch);
	const [sortBy, setSortBy] = (0, import_react.useState)("trending");
	const debouncedSearch = useDebounce(searchQuery, 300);
	const isSearching = debouncedSearch.trim().length > 0;
	const { data: prompts, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useSearchPrompts({
		searchQuery: debouncedSearch,
		isPublic: true,
		category,
		tag: tagFilter || void 0,
		sortBy
	});
	const filteredAndSortedPrompts = prompts ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: `bg-muted/30 ${showHeader ? "py-20 md:py-28" : "py-8 md:py-12"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4",
			children: [
				showHeader && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto mb-12 max-w-2xl text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-4 text-display-md font-bold text-foreground md:text-display-lg",
						children: "Explore Prompts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg text-muted-foreground",
						children: "Browse our curated collection of high-quality prompts. Copy instantly."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative w-full max-w-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "text",
									placeholder: "Search prompts...",
									value: searchQuery,
									onChange: (e) => setSearchQuery(e.target.value),
									className: "pl-10"
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center gap-2",
							children: [
								{
									value: "trending",
									label: "Trending",
									icon: TrendingUp
								},
								{
									value: "newest",
									label: "Newest",
									icon: Clock
								},
								{
									value: "rating",
									label: "Top Rated",
									icon: Star
								}
							].map(({ value, label, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: sortBy === value && !isSearching ? "secondary" : "ghost",
								size: "sm",
								onClick: () => setSortBy(value),
								disabled: isSearching,
								className: cn("gap-1.5", sortBy === value && !isSearching && "font-medium", isSearching && "opacity-50 cursor-not-allowed"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }), label]
							}, value))
						}),
						isSearching && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-muted-foreground",
							children: "Showing results by relevance"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryFilter, {
								selected: category,
								onSelect: setCategory
							})
						}),
						tagFilter && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-center gap-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Filtered by tag:"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-primary/10 px-3 py-1 font-medium text-primary",
									children: ["#", tagFilter]
								}),
								onClearTag && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: onClearTag,
									children: "Clear"
								})
							]
						})
					]
				}),
				isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
					children: [...Array(6)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 rounded-xl border border-border bg-card p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-3/4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-full" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-16" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-16" })]
							})
						]
					}, i))
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-12 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg text-destructive",
						children: "Failed to load prompts. Please try again later."
					})
				}),
				!isLoading && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
					children: filteredAndSortedPrompts.map((prompt, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "animate-fade-in-up",
						style: { animationDelay: `${index * .05}s` },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCard, {
							prompt,
							showAuthorInfo: true
						})
					}, prompt.id))
				}),
				!isLoading && !error && hasNextPage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 flex justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => fetchNextPage(),
						disabled: isFetchingNextPage,
						className: "gap-2",
						children: isFetchingNextPage ? "Loading…" : "Load more prompts"
					})
				}),
				!isLoading && !error && filteredAndSortedPrompts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					variant: "compact",
					icon: Search,
					title: "No prompts match your filters",
					description: "Try a broader search term, or clear the category filter.",
					primaryAction: {
						label: "Clear filters",
						onClick: () => {
							setCategory("all");
							setSearchQuery("");
						}
					}
				})
			]
		})
	});
}
//#endregion
export { PromptsSection as t };
