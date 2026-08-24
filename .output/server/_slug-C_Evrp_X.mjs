import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./_ssr/skeleton-cOr9hq3l.mjs";
import { An as Calendar, Vn as ArrowLeft } from "./_libs/lucide-react.mjs";
import { c as useParams$1, n as Link$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { n as format } from "./_libs/date-fns.mjs";
import { t as Markdown } from "./_libs/react-markdown+[...].mjs";
import { t as siteOrigin } from "./_ssr/site-jKTsxe7R.mjs";
import { r as usePublicPost, t as BlogSidebar } from "./_ssr/BlogSidebar-xwDpmm_-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-C_Evrp_X.js
var import_jsx_runtime = require_jsx_runtime();
function BlogPost() {
	const { slug } = useParams$1();
	const { data: post, isLoading } = usePublicPost(slug || "");
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container max-w-4xl mx-auto px-4 py-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-3/4 mb-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-1/2 mb-8" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-[16/9] w-full rounded-lg mb-8" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-3/4" })
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (!post) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							children: "Post not found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground mb-6",
							children: "The post you're looking for doesn't exist or has been unpublished."
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
	const authorName = post.author?.display_name || "Anonymous";
	const authorInitial = authorName.charAt(0).toUpperCase();
	const publishedDate = post.published_at ? format(new Date(post.published_at), "MMMM d, yyyy") : null;
	post.og_image_url || post.featured_image?.url;
	`${siteOrigin()}${post.slug}`;
	post.title, post.seo_description || post.excerpt, post.published_at, post.updated_at || post.published_at, `${siteOrigin()}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "container max-w-6xl mx-auto px-4 py-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
						to: "/blog",
						className: "inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 mr-1" }), "Back to Blog"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-4 gap-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
									className: "mb-8",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight",
											children: post.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
													className: "h-8 w-8",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
														src: post.author?.avatar_url || void 0,
														alt: authorName
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, { children: authorInitial })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium text-foreground",
													children: authorName
												})]
											}), publishedDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
													dateTime: post.published_at || void 0,
													children: publishedDate
												})]
											})]
										}),
										(post.categories && post.categories.length > 0 || post.tags && post.tags.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap gap-2",
											children: [post.categories?.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
												to: `/blog/category/${cat.slug}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "hover:bg-primary/10",
													children: cat.name
												})
											}, cat.id)), post.tags?.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
												to: `/blog/tag/${tag.slug}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "secondary",
													className: "hover:bg-primary/10",
													children: tag.name
												})
											}, tag.id))]
										})
									]
								}),
								post.featured_image?.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
									className: "mb-8 rounded-lg overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: post.featured_image.url,
										alt: post.featured_image.alt_text || post.title,
										className: "w-full h-auto",
										width: post.featured_image.width || void 0,
										height: post.featured_image.height || void 0
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "prose prose-lg dark:prose-invert max-w-none",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { children: post.content || "" })
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "lg:col-span-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sticky top-24",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogSidebar, {})
							})
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	}) });
}
var SplitComponent = BlogPost;
//#endregion
export { SplitComponent as component };
