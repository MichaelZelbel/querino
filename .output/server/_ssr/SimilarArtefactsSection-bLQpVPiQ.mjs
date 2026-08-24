import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as CardContent, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { In as BookOpen, ht as Lock, on as Crown, r as Workflow } from "../_libs/lucide-react.mjs";
import { a as useAuthContext, n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SimilarArtefactsSection-bLQpVPiQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useSimilarSkills(skillId, limit = 6) {
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		if (!skillId) {
			setLoading(false);
			return;
		}
		const targetId = skillId;
		async function fetchSimilar() {
			setLoading(true);
			try {
				const { data, error } = await supabase.rpc("get_similar_skills", {
					target_id: targetId,
					match_limit: limit
				});
				if (error) {
					console.error("Error fetching similar skills:", error);
					setItems([]);
				} else setItems(data || []);
			} catch (err) {
				console.error("Failed to fetch similar skills:", err);
				setItems([]);
			} finally {
				setLoading(false);
			}
		}
		fetchSimilar();
	}, [skillId, limit]);
	return {
		items,
		loading
	};
}
function useSimilarWorkflows(workflowId, limit = 6) {
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		if (!workflowId) {
			setLoading(false);
			return;
		}
		const targetId = workflowId;
		async function fetchSimilar() {
			setLoading(true);
			try {
				const { data, error } = await supabase.rpc("get_similar_workflows", {
					target_id: targetId,
					match_limit: limit
				});
				if (error) {
					console.error("Error fetching similar workflows:", error);
					setItems([]);
				} else setItems(data || []);
			} catch (err) {
				console.error("Failed to fetch similar workflows:", err);
				setItems([]);
			} finally {
				setLoading(false);
			}
		}
		fetchSimilar();
	}, [workflowId, limit]);
	return {
		items,
		loading
	};
}
function SkeletonCard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-2 h-4 w-16" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-2 h-5 w-3/4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" })
			]
		})
	});
}
function LoadingSkeletons() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
		children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonCard, {}, i))
	});
}
function PremiumLockedSection({ title, icon: Icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-4 text-lg font-semibold text-foreground flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5 text-primary" }),
				title,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "secondary",
					className: "h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary border-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-2.5 w-2.5" }), "Premium"]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-8 flex flex-col items-center justify-center text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-6 w-6 text-primary" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mb-4 max-w-sm",
						children: "Similar artefact recommendations are a Premium feature. Contact support to learn more."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "mailto:support@querino.ai",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							className: "gap-2",
							children: "Contact Support"
						})
					})
				]
			})
		})]
	});
}
function SimilarSkillsSection({ items, loading }) {
	const { user, profile } = useAuthContext();
	const isPremium = profile?.plan_type === "premium";
	if (user && !isPremium) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PremiumLockedSection, {
		title: "Similar Skills",
		icon: BookOpen
	});
	if (!user) return null;
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-4 text-lg font-semibold text-foreground flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-5 w-5 text-primary" }), "Similar Skills"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSkeletons, {})]
	});
	if (items.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-4 text-lg font-semibold text-foreground flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-5 w-5 text-primary" }), "Similar Skills"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
			children: items.slice(0, 6).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
				to: `/skills/${item.id}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "secondary",
									className: "text-xs gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-3 w-3" }), "Skill"]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mb-1 line-clamp-1 font-medium text-foreground",
								children: item.title
							}),
							item.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "line-clamp-2 text-sm text-muted-foreground",
								children: item.description
							})
						]
					})
				})
			}, item.id))
		})]
	});
}
function SimilarWorkflowsSection({ items, loading }) {
	const { user, profile } = useAuthContext();
	const isPremium = profile?.plan_type === "premium";
	if (user && !isPremium) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PremiumLockedSection, {
		title: "Similar Workflows",
		icon: Workflow
	});
	if (!user) return null;
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-4 text-lg font-semibold text-foreground flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-5 w-5 text-primary" }), "Similar Workflows"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSkeletons, {})]
	});
	if (items.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "mb-4 text-lg font-semibold text-foreground flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-5 w-5 text-primary" }), "Similar Workflows"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
			children: items.slice(0, 6).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
				to: `/workflows/${item.id}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "secondary",
									className: "text-xs gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-3 w-3" }), "Workflow"]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mb-1 line-clamp-1 font-medium text-foreground",
								children: item.title
							}),
							item.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "line-clamp-2 text-sm text-muted-foreground",
								children: item.description
							})
						]
					})
				})
			}, item.id))
		})]
	});
}
//#endregion
export { useSimilarWorkflows as i, SimilarWorkflowsSection as n, useSimilarSkills as r, SimilarSkillsSection as t };
