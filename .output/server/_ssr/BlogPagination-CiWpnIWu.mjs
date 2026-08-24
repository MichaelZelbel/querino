import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as CardContent, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { Dn as ChevronLeft, En as ChevronRight } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BlogPagination-CiWpnIWu.js
var import_jsx_runtime = require_jsx_runtime();
function BlogPostCard({ post }) {
	const authorName = post.author?.display_name || "Anonymous";
	const authorInitial = authorName.charAt(0).toUpperCase();
	const publishedDate = post.published_at ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true }) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		variant: "interactive",
		className: "overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
			to: `/blog/${post.slug}`,
			className: "block",
			children: [post.featured_image?.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "aspect-[16/9] overflow-hidden bg-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: post.featured_image.url,
					alt: post.featured_image.alt_text || post.title,
					className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
					loading: "lazy"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors",
						children: post.title
					}),
					post.excerpt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground text-sm line-clamp-3 mb-4",
						children: post.excerpt
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
							className: "h-8 w-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
								src: post.author?.avatar_url || void 0,
								alt: authorName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
								className: "text-xs",
								children: authorInitial
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-foreground",
								children: authorName
							}), publishedDate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: publishedDate
							})]
						})]
					})
				]
			})]
		})
	});
}
function BlogPagination({ currentPage, totalPages, onPageChange }) {
	if (totalPages <= 1) return null;
	const pages = [];
	const showEllipsisStart = currentPage > 3;
	const showEllipsisEnd = currentPage < totalPages - 2;
	if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
	else {
		pages.push(1);
		if (showEllipsisStart) pages.push(-1);
		for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) if (!pages.includes(i)) pages.push(i);
		if (showEllipsisEnd) pages.push(-2);
		if (!pages.includes(totalPages)) pages.push(totalPages);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		className: "flex items-center justify-center gap-1",
		"aria-label": "Blog pagination",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: () => onPageChange(currentPage - 1),
				disabled: currentPage === 1,
				"aria-label": "Previous page",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
			}),
			pages.map((page, idx) => {
				if (page < 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "px-2 text-muted-foreground",
					children: "…"
				}, `ellipsis-${idx}`);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: page === currentPage ? "default" : "ghost",
					size: "sm",
					onClick: () => onPageChange(page),
					"aria-current": page === currentPage ? "page" : void 0,
					children: page
				}, page);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				onClick: () => onPageChange(currentPage + 1),
				disabled: currentPage === totalPages,
				"aria-label": "Next page",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
			})
		]
	});
}
//#endregion
export { BlogPostCard as n, BlogPagination as t };
