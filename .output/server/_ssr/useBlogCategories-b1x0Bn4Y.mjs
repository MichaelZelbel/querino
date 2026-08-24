import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useQueryClient, n as useMutation, r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useBlogCategories-b1x0Bn4Y.js
function useBlogCategories() {
	return useQuery({
		queryKey: ["blog-categories"],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_categories").select("*").order("name");
			if (error) throw error;
			const { data: counts } = await supabase.from("blog_post_categories").select("category_id");
			const countMap = /* @__PURE__ */ new Map();
			counts?.forEach((c) => {
				countMap.set(c.category_id, (countMap.get(c.category_id) || 0) + 1);
			});
			return data.map((cat) => ({
				...cat,
				post_count: countMap.get(cat.id) || 0
			}));
		}
	});
}
function useCreateBlogCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data) => {
			const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
			const { data: category, error } = await supabase.from("blog_categories").insert({
				...data,
				slug
			}).select().single();
			if (error) throw error;
			return category;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
			toast.success("Category created");
		},
		onError: (error) => {
			toast.error(`Failed to create category: ${error.message}`);
		}
	});
}
function useUpdateBlogCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }) => {
			const { data: category, error } = await supabase.from("blog_categories").update(data).eq("id", id).select().single();
			if (error) throw error;
			return category;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
			toast.success("Category updated");
		},
		onError: (error) => {
			toast.error(`Failed to update category: ${error.message}`);
		}
	});
}
function useDeleteBlogCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("blog_categories").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
			toast.success("Category deleted");
		},
		onError: (error) => {
			toast.error(`Failed to delete category: ${error.message}`);
		}
	});
}
//#endregion
export { useUpdateBlogCategory as i, useCreateBlogCategory as n, useDeleteBlogCategory as r, useBlogCategories as t };
