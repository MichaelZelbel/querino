import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useQueryClient, n as useMutation, r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useBlogMedia-BH2C2dqg.js
function useBlogMedia() {
	return useQuery({
		queryKey: ["blog-media"],
		queryFn: async () => {
			const { data, error } = await supabase.from("blog_media").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
}
function useUploadBlogMedia() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (file) => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");
			const fileExt = file.name.split(".").pop();
			const filePath = `blog/${`${crypto.randomUUID()}.${fileExt}`}`;
			const { error: uploadError } = await supabase.storage.from("blog-media").upload(filePath, file);
			if (uploadError) throw uploadError;
			const { data: { publicUrl } } = supabase.storage.from("blog-media").getPublicUrl(filePath);
			let width = null;
			let height = null;
			if (file.type.startsWith("image/")) {
				const dimensions = await getImageDimensions(file);
				width = dimensions.width;
				height = dimensions.height;
			}
			const { data: media, error: dbError } = await supabase.from("blog_media").insert({
				url: publicUrl,
				alt_text: file.name.replace(/\.[^/.]+$/, ""),
				width,
				height,
				mime_type: file.type,
				file_size: file.size,
				uploaded_by: user.id
			}).select().single();
			if (dbError) throw dbError;
			return media;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-media"] });
			toast.success("Media uploaded");
		},
		onError: (error) => {
			toast.error(`Failed to upload media: ${error.message}`);
		}
	});
}
function useUpdateBlogMedia() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, data }) => {
			const { data: media, error } = await supabase.from("blog_media").update(data).eq("id", id).select().single();
			if (error) throw error;
			return media;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-media"] });
			toast.success("Media updated");
		},
		onError: (error) => {
			toast.error(`Failed to update media: ${error.message}`);
		}
	});
}
function useDeleteBlogMedia() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("blog_media").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["blog-media"] });
			toast.success("Media deleted");
		},
		onError: (error) => {
			toast.error(`Failed to delete media: ${error.message}`);
		}
	});
}
function getImageDimensions(file) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve({
				width: img.width,
				height: img.height
			});
			URL.revokeObjectURL(img.src);
		};
		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});
}
//#endregion
export { useUploadBlogMedia as i, useDeleteBlogMedia as n, useUpdateBlogMedia as r, useBlogMedia as t };
