import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, i as CardFooter, n as CardContent, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { M as Star, at as Package, cn as Copy, et as Pencil, kn as Check } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { t as countPromptItems } from "./promptKitParser-zZSbXXfv.mjs";
import { t as LanguageBadge } from "./PromptCard-CVKouFhA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PromptKitCard-byr1CEPk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PromptKitCard({ kit, showAuthorBadge, showAuthorInfo = false, currentUserId, showEditButton = false }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const isAuthor = currentUserId && kit.author_id === currentUserId;
	const detailUrl = `/prompt-kits/${kit.slug}`;
	const promptCount = countPromptItems(kit.content || "");
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(kit.content);
			setCopied(true);
			toast.success("Prompt kit copied!");
			setTimeout(() => setCopied(false), 2e3);
		} catch {
			toast.error("Failed to copy kit");
		}
	};
	const getAuthorInitials = () => {
		if (kit.author?.display_name) return kit.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold leading-tight text-foreground hover:text-primary transition-colors",
										children: kit.title
									}),
									showAuthorBadge && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-xs",
										children: "Your kit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										variant: "outline",
										className: "text-xs",
										children: [
											promptCount,
											" ",
											promptCount === 1 ? "prompt" : "prompts"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageBadge, { language: kit.language })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground line-clamp-2",
								children: kit.description || "No description"
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
						children: kit.content
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted/50 to-transparent rounded-b-lg" })]
				}), kit.tags && kit.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-1.5",
					children: kit.tags.slice(0, 3).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
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
						children: [showAuthorInfo && kit.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: `/u/${encodeURIComponent(kit.author.display_name || "")}`,
							className: "flex items-center gap-2 hover:opacity-80 transition-opacity",
							onClick: (e) => e.stopPropagation(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "h-5 w-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: kit.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "text-[10px] bg-muted",
									children: getAuthorInitials()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs truncate max-w-[80px] hover:text-primary transition-colors",
								children: kit.author.display_name || "Anonymous"
							})]
						}), kit.rating_count && kit.rating_count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-warning text-warning" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: Number(kit.rating_avg || 0).toFixed(1)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										"(",
										kit.rating_count,
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
						children: [(isAuthor || showEditButton) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: `/prompt-kits/${kit.slug}/edit`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								className: "gap-1.5 h-8 px-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: copied ? "success" : "default",
							onClick: handleCopy,
							className: "gap-1.5",
							children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), "Copied"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), "Copy"] })
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { PromptKitCard as t };
