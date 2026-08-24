import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { $t as FileText } from "../_libs/lucide-react.mjs";
import { l as useSearchParams } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { i as usePublicPosts, t as BlogSidebar } from "./BlogSidebar-xwDpmm_-.mjs";
import { n as BlogPostCard, t as BlogPagination } from "./BlogPagination-CiWpnIWu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blog-BHjr-qib.js
var import_jsx_runtime = require_jsx_runtime();
function BlogList() {
	const [searchParams, setSearchParams] = useSearchParams();
	const page = parseInt(searchParams.get("page") || "1", 10);
	const { data, isLoading } = usePublicPosts({ page });
	const handlePageChange = (newPage) => {
		setSearchParams({ page: newPage.toString() });
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container max-w-6xl mx-auto px-4 py-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "mb-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl font-bold text-foreground mb-2",
							children: "Blog"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "Articles about AI, prompts, and productivity"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-4 gap-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "lg:col-span-3",
							children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-6 md:grid-cols-2",
								children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-[16/9] w-full rounded-lg" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-3/4" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-2/3" })
									]
								}, i))
							}) : data?.posts && data.posts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-6 md:grid-cols-2",
								children: data.posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogPostCard, { post }, post.id))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogPagination, {
									currentPage: data.currentPage,
									totalPages: data.totalPages,
									onPageChange: handlePageChange
								})
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-center py-16",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-xl font-semibold text-foreground mb-2",
										children: "No posts yet"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "Check back soon for new content."
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "lg:col-span-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogSidebar, {})
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	}) });
}
var SplitComponent = BlogList;
//#endregion
export { SplitComponent as component };
