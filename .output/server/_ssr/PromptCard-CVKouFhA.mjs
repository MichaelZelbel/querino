import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, i as CardFooter, n as CardContent, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { M as Star, Qt as Files, Z as Pin, _n as CloudUpload, cn as Copy, et as Pencil, kn as Check } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { a as TooltipProvider, i as TooltipContent, o as TooltipTrigger, r as Tooltip } from "./Footer-ClUC5jzd.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { t as SendToLLMButtons } from "./SendToLLMButtons-dPxB-1LC.mjs";
import { t as useClonePrompt } from "./useClonePrompt-DyUgLCDb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PromptCard-CVKouFhA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MenerioSyncBadge({ menerioSynced, menerioSyncedAt }) {
	if (!menerioSynced) return null;
	const timeAgo = menerioSyncedAt ? formatDistanceToNow(new Date(menerioSyncedAt), { addSuffix: true }) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-flex",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "h-3.5 w-3.5 text-success" })
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipContent, {
		side: "top",
		className: "text-xs",
		children: ["Synced to Menerio", timeAgo ? ` (last: ${timeAgo})` : ""]
	})] }) });
}
function LanguageBadge({ language, className }) {
	if (!language || language === "en") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "outline",
		className: `text-[10px] px-1.5 py-0 font-medium uppercase ${className || ""}`,
		children: language
	});
}
function PromptCard({ prompt, showAuthorBadge, showAuthorInfo = false, currentUserId, editPath = "prompts", userRating, showSendToLLM = false, isPinned = false, showMenerioStatus = false }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const { clonePrompt, cloning } = useClonePrompt();
	const isAuthor = currentUserId && prompt.author_id === currentUserId;
	const editUrl = `/library/${prompt.slug}/edit`;
	const detailUrl = `/prompts/${prompt.slug}`;
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(prompt.content);
			setCopied(true);
			toast.success("Prompt copied to clipboard!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy prompt");
		}
	};
	const getAuthorInitials = () => {
		if (prompt.author?.display_name) return prompt.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold leading-tight text-foreground hover:text-primary transition-colors",
										children: prompt.title
									}),
									showAuthorBadge && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-xs",
										children: "Your prompt"
									}),
									!prompt.is_public && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-xs",
										children: "Private"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageBadge, { language: prompt.language }),
									showMenerioStatus && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioSyncBadge, {
										menerioSynced: prompt.menerio_synced,
										menerioSyncedAt: prompt.menerio_synced_at
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground line-clamp-2",
								children: prompt.summary || prompt.description
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
						children: prompt.content
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" })]
				}), prompt.tags && prompt.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-1.5",
					children: prompt.tags.slice(0, 3).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "text-xs font-normal",
						children: tag
					}, tag))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardFooter, {
				className: "flex flex-col gap-2 border-t border-border/50 pt-4",
				children: [userRating && !isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
					to: detailUrl,
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Your rating:" }), [
							1,
							2,
							3,
							4,
							5
						].map((star) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-3 w-3 ${star <= userRating ? "fill-warning text-warning" : "text-muted-foreground/30"}` }, star))]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 text-sm text-muted-foreground",
						children: [
							showAuthorInfo && prompt.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
								to: `/u/${encodeURIComponent(prompt.author.display_name || "")}`,
								className: "flex items-center gap-2 hover:opacity-80 transition-opacity",
								onClick: (e) => e.stopPropagation(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
									className: "h-5 w-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: prompt.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
										className: "text-[10px] bg-muted",
										children: getAuthorInitials()
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs truncate max-w-[80px] hover:text-primary transition-colors",
									children: prompt.author.display_name || "Anonymous"
								})]
							}),
							prompt.rating_count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-warning text-warning" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: Number(prompt.rating_avg).toFixed(1)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground",
										children: [
											"(",
											prompt.rating_count,
											")"
										]
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "No ratings yet"
							}),
							!showAuthorInfo && prompt.rating_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-border",
								children: "•"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [prompt.copies_count.toLocaleString(), " copies"] })] })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: editUrl,
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
								onClick: () => clonePrompt(prompt, currentUserId),
								disabled: cloning,
								className: "gap-1.5 h-8 px-2",
								title: "Clone to my library",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, { className: "h-3.5 w-3.5" })
							}),
							showSendToLLM && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendToLLMButtons, {
								title: prompt.title,
								content: prompt.content,
								variant: "compact"
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
				})]
			})
		]
	});
}
//#endregion
export { MenerioSyncBadge as n, PromptCard as r, LanguageBadge as t };
