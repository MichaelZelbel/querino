import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { $t as FileText, B as Search, M as Star, P as Sparkles, at as Package, r as Workflow, vn as Clock } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { l as useSearchParams } from "./router-compat-xSZ_AoUj.mjs";
import { o as useDebounce } from "./useDebounce-CjI32hnI.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-B4ZFfXyf.mjs";
import { t as EmptyState } from "./empty-state-r6QZJNu5.mjs";
import { n as useSkills, r as useWorkflows } from "./useWorkflows-Dv1gQobh.mjs";
import { t as usePromptKits } from "./usePromptKits-wSRxzmnW.mjs";
import { n as categoryOptions } from "./prompt-C3zowaN0.mjs";
import { n as WorkflowCard, t as SkillCard } from "./WorkflowCard-TJ4_k22S.mjs";
import { t as PromptsSection } from "./PromptsSection-p4LD28rZ.mjs";
import { t as PromptKitCard } from "./PromptKitCard-byr1CEPk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/discover-DkCCbV90.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VALID_TABS = [
	"prompts",
	"kits",
	"skills",
	"workflows"
];
var Discover = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const tagFilter = searchParams.get("tag") || "";
	const initialQuery = searchParams.get("q") || "";
	const typeParam = searchParams.get("type") || "prompts";
	const [activeTab, setActiveTab] = (0, import_react.useState)(VALID_TABS.includes(typeParam) ? typeParam : "prompts");
	const [skillSearch, setSkillSearch] = (0, import_react.useState)(initialQuery);
	const [workflowSearch, setWorkflowSearch] = (0, import_react.useState)(initialQuery);
	const [kitSearch, setKitSearch] = (0, import_react.useState)(initialQuery);
	const debouncedSkillSearch = useDebounce(skillSearch, 300);
	const debouncedWorkflowSearch = useDebounce(workflowSearch, 300);
	const debouncedKitSearch = useDebounce(kitSearch, 300);
	const [tabSort, setTabSort] = (0, import_react.useState)("newest");
	const [tabCategory, setTabCategory] = (0, import_react.useState)("all");
	const listOptions = {
		published: true,
		sortBy: tabSort,
		category: tabCategory,
		limit: 60
	};
	const { data: skills, isLoading: skillsLoading } = useSkills({
		...listOptions,
		searchQuery: debouncedSkillSearch
	});
	const { data: workflows, isLoading: workflowsLoading } = useWorkflows({
		...listOptions,
		searchQuery: debouncedWorkflowSearch
	});
	const { data: kits, isLoading: kitsLoading } = usePromptKits({
		...listOptions,
		searchQuery: debouncedKitSearch
	});
	const byTag = (items) => (items || []).filter((item) => !tagFilter || (item.tags || []).includes(tagFilter));
	const visibleSkills = byTag(skills);
	const visibleWorkflows = byTag(workflows);
	const visibleKits = byTag(kits);
	const handleTabChange = (tab) => {
		setActiveTab(tab);
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("type", tab);
			return next;
		}, { replace: true });
	};
	const clearTag = () => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.delete("tag");
			return next;
		}, { replace: true });
	};
	const tabToolbar = (isSearchingTab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: tabSort === "newest" && !isSearchingTab ? "secondary" : "ghost",
				size: "sm",
				onClick: () => setTabSort("newest"),
				disabled: isSearchingTab,
				className: "gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4" }), "Newest"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: tabSort === "rating" && !isSearchingTab ? "secondary" : "ghost",
				size: "sm",
				onClick: () => setTabSort("rating"),
				disabled: isSearchingTab,
				className: "gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4" }), "Top Rated"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: tabCategory,
				onValueChange: setTabCategory,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					className: "h-9 w-[160px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: "all",
					children: "All categories"
				}), categoryOptions.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: cat.id,
					children: cat.label
				}, cat.id))] })]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "container mx-auto max-w-full px-4 py-8 overflow-x-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						value: activeTab,
						onValueChange: handleTabChange,
						className: "w-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sticky top-16 z-30 -mx-4 mb-8 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:flex sm:justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
										className: "inline-flex w-auto sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "prompts",
												className: "gap-2 whitespace-nowrap",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "Prompts"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "kits",
												className: "gap-2 whitespace-nowrap",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4" }), "Prompt Kits"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "skills",
												className: "gap-2 whitespace-nowrap",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), "Skills"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
												value: "workflows",
												className: "gap-2 whitespace-nowrap",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-4 w-4" }), "Workflows"]
											})
										]
									})
								})
							}),
							tagFilter && activeTab !== "prompts" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-6 flex items-center justify-center gap-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Filtered by tag:"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "rounded-full bg-primary/10 px-3 py-1 font-medium text-primary",
										children: ["#", tagFilter]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: clearTag,
										className: "text-muted-foreground underline-offset-2 hover:underline",
										children: "Clear"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "prompts",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptsSection, {
									showHeader: false,
									tagFilter,
									initialSearch: initialQuery,
									onClearTag: clearTag
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "kits",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mx-auto max-w-md",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "text",
												placeholder: "Search prompt kits...",
												value: kitSearch,
												onChange: (e) => setKitSearch(e.target.value),
												className: "pl-10"
											})]
										}),
										tabToolbar(!!debouncedKitSearch.trim()),
										kitsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
											children: [...Array(6)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4 rounded-xl border border-border bg-card p-6",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-3/4" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-full" })
												]
											}, i))
										}) : visibleKits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
											children: visibleKits.map((kit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitCard, {
												kit,
												showAuthorInfo: true
											}, kit.id))
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
											variant: "compact",
											icon: Package,
											title: debouncedKitSearch ? "No prompt kits match your search" : "No prompt kits published yet",
											description: debouncedKitSearch ? "Try a different keyword or clear the search." : "Be the first to publish a Prompt Kit for the community.",
											primaryAction: debouncedKitSearch ? {
												label: "Clear search",
												onClick: () => setKitSearch("")
											} : {
												label: "Create a Prompt Kit",
												to: "/prompt-kits/new",
												icon: Sparkles
											}
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "skills",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mx-auto max-w-md",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "text",
												placeholder: "Search skills...",
												value: skillSearch,
												onChange: (e) => setSkillSearch(e.target.value),
												className: "pl-10"
											})]
										}),
										tabToolbar(!!debouncedSkillSearch.trim()),
										skillsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
											children: [...Array(6)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4 rounded-xl border border-border bg-card p-6",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-3/4" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-full" })
												]
											}, i))
										}) : visibleSkills.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
											children: visibleSkills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillCard, {
												skill,
												showAuthorInfo: true
											}, skill.id))
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
											variant: "compact",
											icon: FileText,
											title: debouncedSkillSearch ? "No skills match your search" : "No skills published yet",
											description: debouncedSkillSearch ? "Try a different keyword or clear the search." : "Be the first to publish a Skill for the community.",
											primaryAction: debouncedSkillSearch ? {
												label: "Clear search",
												onClick: () => setSkillSearch("")
											} : {
												label: "Create a Skill",
												to: "/skills/new",
												icon: Sparkles
											}
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "workflows",
								className: "mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative mx-auto max-w-md",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "text",
												placeholder: "Search workflows...",
												value: workflowSearch,
												onChange: (e) => setWorkflowSearch(e.target.value),
												className: "pl-10"
											})]
										}),
										tabToolbar(!!debouncedWorkflowSearch.trim()),
										workflowsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
											children: [...Array(6)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-4 rounded-xl border border-border bg-card p-6",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-3/4" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-full" })
												]
											}, i))
										}) : visibleWorkflows.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
											children: visibleWorkflows.map((workflow) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowCard, {
												workflow,
												showAuthorInfo: true
											}, workflow.id))
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
											variant: "compact",
											icon: Workflow,
											title: debouncedWorkflowSearch ? "No workflows match your search" : "No workflows published yet",
											description: debouncedWorkflowSearch ? "Try a different keyword or clear the search." : "Be the first to publish a Workflow for the community.",
											primaryAction: debouncedWorkflowSearch ? {
												label: "Clear search",
												onClick: () => setWorkflowSearch("")
											} : {
												label: "Create a Workflow",
												to: "/workflows/new",
												icon: Sparkles
											}
										})
									]
								})
							})
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
};
var SplitComponent = Discover;
//#endregion
export { SplitComponent as component };
