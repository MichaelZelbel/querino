import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, i as CardFooter, n as CardContent, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { In as BookOpen, M as Star, Qt as Files, Z as Pin, cn as Copy, et as Pencil, kn as Check, r as Workflow } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { t as useCloneSkill } from "./useCloneSkill-DFMxocr8.mjs";
import { t as useCloneWorkflow } from "./useCloneWorkflow-B88fLWz6.mjs";
import { n as MenerioSyncBadge, t as LanguageBadge } from "./PromptCard-CVKouFhA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/WorkflowCard-TJ4_k22S.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SkillCard({ skill, showAuthorBadge, showAuthorInfo = false, currentUserId, showEditButton = false, isPinned = false, showMenerioStatus = false }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const { cloneSkill, cloning } = useCloneSkill();
	const isAuthor = currentUserId && skill.author_id === currentUserId;
	const detailUrl = `/skills/${skill.slug}`;
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(skill.content);
			setCopied(true);
			toast.success("Skill content copied!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy skill");
		}
	};
	const getAuthorInitials = () => {
		if (skill.author?.display_name) return skill.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
		return "U";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		variant: "prompt",
		className: "flex h-full flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
				to: detailUrl,
				className: "block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "pb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-start justify-between gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 flex-wrap",
								children: [
									isPinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-3.5 w-3.5 text-warning fill-warning" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-4 w-4 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold leading-tight text-foreground hover:text-primary transition-colors",
										children: skill.title
									}),
									showAuthorBadge && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-xs",
										children: "Your skill"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageBadge, { language: skill.language }),
									showMenerioStatus && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioSyncBadge, {
										menerioSynced: skill.menerio_synced,
										menerioSyncedAt: skill.menerio_synced_at
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground line-clamp-2",
								children: skill.description || "No description"
							})]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex-1 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "line-clamp-3 whitespace-pre-wrap",
						children: skill.content
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" })]
				}), skill.tags && skill.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-1.5",
					children: skill.tags.slice(0, 3).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "text-xs font-normal",
						children: tag
					}, tag))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFooter, {
				className: "flex flex-col gap-2 border-t border-border/50 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 text-sm text-muted-foreground",
						children: [showAuthorInfo && skill.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: `/u/${encodeURIComponent(skill.author.display_name || "")}`,
							className: "flex items-center gap-2 hover:opacity-80 transition-opacity",
							onClick: (e) => e.stopPropagation(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "h-5 w-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: skill.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "text-[10px] bg-muted",
									children: getAuthorInitials()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs truncate max-w-[80px] hover:text-primary transition-colors",
								children: skill.author.display_name || "Anonymous"
							})]
						}), skill.rating_count && skill.rating_count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-warning text-warning" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: Number(skill.rating_avg || 0).toFixed(1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										"(",
										skill.rating_count,
										")"
									]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "No ratings yet"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							(isAuthor || showEditButton) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: `/skills/${skill.slug}/edit`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									className: "gap-1.5 h-8 px-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
								})
							}),
							currentUserId && !isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => cloneSkill(skill, currentUserId),
								disabled: cloning,
								className: "gap-1.5 h-8 px-2",
								title: "Clone to my library",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, { className: "h-3.5 w-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: copied ? "success" : "default",
								onClick: handleCopy,
								className: "gap-1.5",
								children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), "Copied"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), "Copy"] })
							})
						]
					})]
				})
			})
		]
	});
}
function WorkflowCard({ workflow, showAuthorBadge, showAuthorInfo = false, currentUserId, showEditButton = false, isPinned = false, showMenerioStatus = false }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const { cloneWorkflow, cloning } = useCloneWorkflow();
	const isAuthor = currentUserId && workflow.author_id === currentUserId;
	const detailUrl = `/workflows/${workflow.slug}`;
	const getWorkflowContent = () => {
		if (workflow.content) return workflow.content;
		if (workflow.json) return typeof workflow.json === "string" ? workflow.json : JSON.stringify(workflow.json, null, 2);
		return "";
	};
	const workflowContent = getWorkflowContent();
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(workflowContent);
			setCopied(true);
			toast.success("Workflow content copied!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy workflow");
		}
	};
	const getAuthorInitials = () => {
		if (workflow.author?.display_name) return workflow.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
		return "U";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		variant: "prompt",
		className: "flex h-full flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
				to: detailUrl,
				className: "block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "pb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-start justify-between gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 flex-wrap",
								children: [
									isPinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-3.5 w-3.5 text-warning fill-warning" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-4 w-4 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold leading-tight text-foreground hover:text-primary transition-colors",
										children: workflow.title
									}),
									showAuthorBadge && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-xs",
										children: "Your workflow"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageBadge, { language: workflow.language }),
									showMenerioStatus && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioSyncBadge, {
										menerioSynced: workflow.menerio_synced,
										menerioSyncedAt: workflow.menerio_synced_at
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground line-clamp-2",
								children: workflow.description || "No description"
							})]
						})
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex-1 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "line-clamp-3 whitespace-pre-wrap",
						children: [workflowContent.slice(0, 200), "..."]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" })]
				}), workflow.tags && workflow.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-1.5",
					children: workflow.tags.slice(0, 3).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "text-xs font-normal",
						children: tag
					}, tag))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFooter, {
				className: "flex flex-col gap-2 border-t border-border/50 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 text-sm text-muted-foreground",
						children: [showAuthorInfo && workflow.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: `/u/${encodeURIComponent(workflow.author.display_name || "")}`,
							className: "flex items-center gap-2 hover:opacity-80 transition-opacity",
							onClick: (e) => e.stopPropagation(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "h-5 w-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: workflow.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "text-[10px] bg-muted",
									children: getAuthorInitials()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs truncate max-w-[80px] hover:text-primary transition-colors",
								children: workflow.author.display_name || "Anonymous"
							})]
						}), workflow.rating_count && workflow.rating_count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-warning text-warning" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: Number(workflow.rating_avg || 0).toFixed(1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										"(",
										workflow.rating_count,
										")"
									]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "No ratings yet"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							(isAuthor || showEditButton) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: `/workflows/${workflow.slug}/edit`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									className: "gap-1.5 h-8 px-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
								})
							}) }),
							currentUserId && !isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => cloneWorkflow(workflow, currentUserId),
								disabled: cloning,
								className: "gap-1.5 h-8 px-2",
								title: "Clone to my library",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, { className: "h-3.5 w-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: copied ? "success" : "default",
								onClick: handleCopy,
								className: "gap-1.5",
								children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), "Copied"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), "Copy"] })
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { WorkflowCard as n, SkillCard as t };
