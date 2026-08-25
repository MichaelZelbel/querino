import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BlogSidebar-xwDpmm_-.js
var import_jsx_runtime = require_jsx_runtime();
var POSTS_PER_PAGE = 10;
function usePublicPosts({ page = 1, categorySlug, tagSlug } = {}) {
	return useQuery({
		queryKey: [
			"public-blog-posts",
			page,
			categorySlug,
			tagSlug
		],
		queryFn: async () => {
			const from = (page - 1) * POSTS_PER_PAGE;
			const to = from + POSTS_PER_PAGE - 1;
			let query = supabase.from("blog_posts").select(`
          id,
          title,
          slug,
          excerpt,
          status,
          published_at,
          author_id,
          featured_image_id,
          created_at,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text)
        `, { count: "exact" }).eq("status", "published").order("published_at", { ascending: false });
			if (categorySlug) {
				const { data: category } = await supabase.from("blog_categories").select("id").eq("slug", categorySlug).maybeSingle();
				if (category) {
					const { data: postIds } = await supabase.from("blog_post_categories").select("post_id").eq("category_id", category.id);
					const ids = postIds?.map((p) => p.post_id) || [];
					if (ids.length > 0) query = query.in("id", ids);
					else return {
						posts: [],
						totalPages: 0,
						currentPage: page
					};
				}
			}
			if (tagSlug) {
				const { data: tag } = await supabase.from("blog_tags").select("id").eq("slug", tagSlug).maybeSingle();
				if (tag) {
					const { data: postIds } = await supabase.from("blog_post_tags").select("post_id").eq("tag_id", tag.id);
					const ids = postIds?.map((p) => p.post_id) || [];
					if (ids.length > 0) query = query.in("id", ids);
					else return {
						posts: [],
						totalPages: 0,
						currentPage: page
					};
				}
			}
			const { data, error, count } = await query.range(from, to);
			if (error) throw error;
			return {
				posts: data || [],
				totalPages: Math.ceil((count || 0) / POSTS_PER_PAGE),
				currentPage: page,
				totalCount: count || 0
			};
		}
	});
}
function usePublicPost(slug) {
	return useQuery({
		queryKey: ["public-blog-post", slug],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_posts").select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text, width, height)
        `).eq("slug", slug).eq("status", "published").maybeSingle();
			if (error) throw error;
			if (!data) return null;
			const { data: categoryLinks } = await supabase.from("blog_post_categories").select("category_id, category:blog_categories(*)").eq("post_id", data.id);
			const { data: tagLinks } = await supabase.from("blog_post_tags").select("tag_id, tag:blog_tags(*)").eq("post_id", data.id);
			return {
				...data,
				categories: categoryLinks?.map((l) => l.category) || [],
				tags: tagLinks?.map((l) => l.tag) || []
			};
		},
		enabled: !!slug
	});
}
function usePublicCategory(slug) {
	return useQuery({
		queryKey: ["public-blog-category", slug],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_categories").select("*").eq("slug", slug).maybeSingle();
			if (error) throw error;
			return data;
		},
		enabled: !!slug
	});
}
function usePublicTag(slug) {
	return useQuery({
		queryKey: ["public-blog-tag", slug],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_tags").select("*").eq("slug", slug).maybeSingle();
			if (error) throw error;
			return data;
		},
		enabled: !!slug
	});
}
function usePublicCategories() {
	return useQuery({
		queryKey: ["public-blog-categories"],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_categories").select("*").order("name");
			if (error) throw error;
			return data;
		}
	});
}
function usePublicTags() {
	return useQuery({
		queryKey: ["public-blog-tags"],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_tags").select("*").order("name");
			if (error) throw error;
			return data;
		}
	});
}
function BlogSidebar() {
	const { data: categories, isLoading: loadingCategories } = usePublicCategories();
	const { data: tags, isLoading: loadingTags } = usePublicTags();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-sm font-semibold text-foreground uppercase tracking-wider mb-3",
			children: "Categories"
		}), loadingCategories ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-24" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-32" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-20" })
			]
		}) : categories && categories.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1.5",
			children: categories.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
				to: `/blog/category/${category.slug}`,
				className: "text-sm text-muted-foreground hover:text-primary transition-colors",
				children: category.name
			}) }, category.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "No categories yet"
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-sm font-semibold text-foreground uppercase tracking-wider mb-3",
			children: "Tags"
		}), loadingTags ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-16" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-20" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-14" })
			]
		}) : tags && tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-2",
			children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
				to: `/blog/tag/${tag.slug}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "secondary",
					className: "hover:bg-primary/10 cursor-pointer",
					children: tag.name
				})
			}, tag.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "No tags yet"
		})] })]
	});
}
//#endregion
export { usePublicTag as a, usePublicPosts as i, usePublicCategory as n, usePublicPost as r, BlogSidebar as t };
