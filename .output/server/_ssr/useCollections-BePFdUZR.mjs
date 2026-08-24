import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useQueryClient, n as useMutation, r as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useCollections-BePFdUZR.js
function useCollections(userId) {
	return useQuery({
		queryKey: ["collections", userId],
		queryFn: async () => {
			let query = supabase.from("collections").select(`
          *,
          profiles:owner_id (id, display_name, avatar_url)
        `).order("created_at", { ascending: false });
			if (userId) query = query.eq("owner_id", userId);
			else query = query.eq("is_public", true);
			const { data, error } = await query;
			if (error) throw error;
			return await Promise.all((data || []).map(async (collection) => {
				const { count } = await supabase.from("collection_items").select("*", {
					count: "exact",
					head: true
				}).eq("collection_id", collection.id);
				return {
					...collection,
					owner: collection.profiles,
					item_count: count || 0
				};
			}));
		}
	});
}
function useCollection(id) {
	return useQuery({
		queryKey: ["collection", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("collections").select(`
          *,
          profiles:owner_id (id, display_name, avatar_url)
        `).eq("id", id).maybeSingle();
			if (error) throw error;
			if (!data) return null;
			return {
				...data,
				owner: data.profiles
			};
		},
		enabled: !!id
	});
}
function useCollectionItems(collectionId) {
	return useQuery({
		queryKey: ["collection-items", collectionId],
		queryFn: async () => {
			const { data, error } = await supabase.from("collection_items").select("*").eq("collection_id", collectionId).order("sort_order", { ascending: true });
			if (error) throw error;
			return data;
		},
		enabled: !!collectionId
	});
}
function useCreateCollection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data) => {
			const { data: collection, error } = await supabase.from("collections").insert(data).select().single();
			if (error) throw error;
			return collection;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			toast.success("Collection created!");
		},
		onError: (error) => {
			console.error("Error creating collection:", error);
			toast.error("Failed to create collection");
		}
	});
}
function useUpdateCollection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, ...data }) => {
			const { data: collection, error } = await supabase.from("collections").update(data).eq("id", id).select().single();
			if (error) throw error;
			return collection;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			queryClient.invalidateQueries({ queryKey: ["collection", variables.id] });
			toast.success("Collection updated!");
		},
		onError: (error) => {
			console.error("Error updating collection:", error);
			toast.error("Failed to update collection");
		}
	});
}
function useDeleteCollection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("collections").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			toast.success("Collection deleted!");
		},
		onError: (error) => {
			console.error("Error deleting collection:", error);
			toast.error("Failed to delete collection");
		}
	});
}
function useAddToCollection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data) => {
			const { data: items } = await supabase.from("collection_items").select("sort_order").eq("collection_id", data.collection_id).order("sort_order", { ascending: false }).limit(1);
			const sortOrder = items && items.length > 0 ? (items[0].sort_order ?? 0) + 1 : 0;
			const { error } = await supabase.from("collection_items").insert({
				...data,
				sort_order: sortOrder
			});
			if (error) throw error;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["collection-items", variables.collection_id] });
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			toast.success("Added to collection!");
		},
		onError: (error) => {
			if (error.code === "23505") toast.error("Item already in collection");
			else {
				console.error("Error adding to collection:", error);
				toast.error("Failed to add to collection");
			}
		}
	});
}
function useRemoveFromCollection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ collectionId, itemId }) => {
			const { error } = await supabase.from("collection_items").delete().eq("collection_id", collectionId).eq("id", itemId);
			if (error) throw error;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["collection-items", variables.collectionId] });
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			toast.success("Removed from collection!");
		},
		onError: (error) => {
			console.error("Error removing from collection:", error);
			toast.error("Failed to remove from collection");
		}
	});
}
function useUpdateItemOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ collectionId, items }) => {
			for (const item of items) {
				const { error } = await supabase.from("collection_items").update({ sort_order: item.sort_order }).eq("id", item.id);
				if (error) throw error;
			}
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["collection-items", variables.collectionId] });
		},
		onError: (error) => {
			console.error("Error updating order:", error);
			toast.error("Failed to update order");
		}
	});
}
//#endregion
export { useCreateCollection as a, useUpdateCollection as c, useCollections as i, useUpdateItemOrder as l, useCollection as n, useDeleteCollection as o, useCollectionItems as r, useRemoveFromCollection as s, useAddToCollection as t };
