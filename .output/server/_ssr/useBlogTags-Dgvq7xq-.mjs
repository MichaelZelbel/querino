import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useQueryClient, n as useMutation, r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useBlogTags-Dgvq7xq-.js
function useBlogTags() {
	return useQuery({
		queryKey: ["blog-tags"],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_tags").select("*").order("name");
			if (error) throw error;
			const { data: counts } = await supabase.from("blog_post_tags").select("tag_id");
			const countMap = /* @__PURE__ */ new Map();
			counts?.forEach((t) => {
				countMap.set(t.tag_id, (countMap.get(t.tag_id) || 0) + 1);
			});
			return data.map((tag) => ({
				...tag,
				post_count: countMap.get(tag.id) || 0
			}));
		}
	});
}
function useCreateBlogTag() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data) => {
			const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
			const { data: tag, error } = await supabase.from("blog_tags").insert({
				...data,
				slug
			}).select().single();
			if (error) throw error;
			return tag;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
			toast.success("Tag created");
		},
		onError: (error) => {
			toast.error(`Failed to create tag: ${error.message}`);
		}
	});
}
function useUpdateBlogTag() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }) => {
			const { data: tag, error } = await supabase.from("blog_tags").update(data).eq("id", id).select().single();
			if (error) throw error;
			return tag;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
			toast.success("Tag updated");
		},
		onError: (error) => {
			toast.error(`Failed to update tag: ${error.message}`);
		}
	});
}
function useDeleteBlogTag() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("blog_tags").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
			toast.success("Tag deleted");
		},
		onError: (error) => {
			toast.error(`Failed to delete tag: ${error.message}`);
		}
	});
}
//#endregion
export { useUpdateBlogTag as i, useCreateBlogTag as n, useDeleteBlogTag as r, useBlogTags as t };
