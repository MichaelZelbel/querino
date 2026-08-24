import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { $t as FileText, E as Tags, J as Plus, Mt as Image, Zt as FolderOpen } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { t as BlogAdminLayout } from "./BlogAdminLayout-CYRbvoqv.mjs";
import { t as useBlogCategories } from "./useBlogCategories-b1x0Bn4Y.mjs";
import { n as useBlogPosts } from "./useBlogPosts-1T2HoEIA.mjs";
import { t as useBlogTags } from "./useBlogTags-Dgvq7xq-.mjs";
import { t as useBlogMedia } from "./useBlogMedia-BH2C2dqg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-C8rzO7ai.js
var import_jsx_runtime = require_jsx_runtime();
function BlogAdminDashboard() {
	const { data: posts } = useBlogPosts({ limit: 5 });
	const { data: categories } = useBlogCategories();
	const { data: tags } = useBlogTags();
	const { data: media } = useBlogMedia();
	const draftCount = posts?.filter((p) => p.status === "draft").length || 0;
	const stats = [
		{
			label: "Published",
			value: posts?.filter((p) => p.status === "published").length || 0,
			icon: FileText,
			color: "text-green-500"
		},
		{
			label: "Drafts",
			value: draftCount,
			icon: FileText,
			color: "text-amber-500"
		},
		{
			label: "Categories",
			value: categories?.length || 0,
			icon: FolderOpen,
			color: "text-blue-500"
		},
		{
			label: "Tags",
			value: tags?.length || 0,
			icon: Tags,
			color: "text-purple-500"
		},
		{
			label: "Media",
			value: media?.length || 0,
			icon: Image,
			color: "text-pink-500"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogAdminLayout, {
		title: "Dashboard",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
				to: "/blog/admin/posts/new",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }), "New Post"]
			})
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 md:grid-cols-5 gap-4",
					children: stats.map((stat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(stat.icon, { className: `h-5 w-5 ${stat.color}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-2xl font-bold",
								children: stat.value
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: stat.label
							})] })]
						})
					}) }, stat.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "flex flex-row items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Recent Posts" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/blog/admin/posts",
							children: "View All"
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: posts && posts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: posts.slice(0, 5).map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between py-2 border-b border-border last:border-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: `/blog/admin/posts/${post.id}/edit`,
								className: "font-medium hover:underline truncate block",
								children: post.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `px-2 py-1 text-xs rounded-full ${post.status === "published" ? "bg-green-500/10 text-green-600" : post.status === "scheduled" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`,
							children: post.status
						})]
					}, post.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted-foreground text-center py-8",
					children: [
						"No posts yet.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/blog/admin/posts/new",
							className: "text-primary hover:underline",
							children: "Create your first post"
						})
					]
				}) })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 md:grid-cols-4 gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "h-auto py-4",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
								to: "/blog/admin/posts/new",
								className: "flex flex-col items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "New Post" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "h-auto py-4",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
								to: "/blog/admin/categories",
								className: "flex flex-col items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Categories" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "h-auto py-4",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
								to: "/blog/admin/tags",
								className: "flex flex-col items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tags, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tags" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "h-auto py-4",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
								to: "/blog/admin/media",
								className: "flex flex-col items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Media" })]
							})
						})
					]
				})
			]
		})
	});
}
var SplitComponent = BlogAdminDashboard;
//#endregion
export { SplitComponent as component };
