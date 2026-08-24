import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Skeleton } from "./_ssr/skeleton-cOr9hq3l.mjs";
import { $t as FileText, Vn as ArrowLeft } from "./_libs/lucide-react.mjs";
import { c as useParams$1, l as useSearchParams, n as Link$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { a as usePublicTag, i as usePublicPosts, t as BlogSidebar } from "./_ssr/BlogSidebar-xwDpmm_-.mjs";
import { n as BlogPostCard, t as BlogPagination } from "./_ssr/BlogPagination-CiWpnIWu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-CwQAmEo-.js
var import_jsx_runtime = require_jsx_runtime();
function BlogTag() {
	const { slug } = useParams$1();
	const [searchParams, setSearchParams] = useSearchParams();
	const page = parseInt(searchParams.get("page") || "1", 10);
	const { data: tag, isLoading: loadingTag } = usePublicTag(slug || "");
	const { data, isLoading } = usePublicPosts({
		page,
		tagSlug: slug
	});
	const handlePageChange = (newPage) => {
		setSearchParams({ page: newPage.toString() });
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	};
	if (loadingTag) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "container max-w-6xl mx-auto px-4 py-12",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-48 mb-4" })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (!tag) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-bold text-foreground mb-4",
							children: "Tag not found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground mb-6",
							children: "The tag you're looking for doesn't exist."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
								to: "/blog",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Blog"]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container max-w-6xl mx-auto px-4 py-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: "/blog",
							className: "inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 mr-1" }), "Back to Blog"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
							className: "mb-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-3xl font-bold text-foreground",
								children: ["#", tag.name]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" })
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
											children: "No posts with this tag"
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
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	}) });
}
var SplitComponent = BlogTag;
//#endregion
export { SplitComponent as component };
