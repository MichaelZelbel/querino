import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Collection, CollectionItem, CollectionWithOwner } from "@/types/collection";

export function useCollections(userId?: string) {
  return useQuery({
    queryKey: ["collections", userId],
    queryFn: async () => {
      let query = supabase
        .from("collections")
        .select(`
          *,
          profiles:owner_id (id, display_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("owner_id", userId);
      } else {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Get item counts for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from("collection_items")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", collection.id);
          
          return {
            ...collection,
            owner: collection.profiles,
            item_count: count || 0,
          } as CollectionWithOwner;
        })
      );
      
      return collectionsWithCounts;
    },
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          profiles:owner_id (id, display_name, avatar_url)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        owner: data.profiles,
      } as CollectionWithOwner;
    },
    enabled: !!id,
  });
}

export function useCollectionItems(collectionId: string) {
  return useQuery({
    queryKey: ["collection-items", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_items")
        .select("*")
        .eq("collection_id", collectionId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as CollectionItem[];
    },
    enabled: !!collectionId,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; is_public: boolean; owner_id: string }) => {
      const { data: collection, error } = await supabase
        .from("collections")
        .insert(data)
        .select()
        .single();

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
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; is_public?: boolean }) => {
      const { data: collection, error } = await supabase
        .from("collections")
        .update(data)
        .eq("id", id)
        .select()
        .single();

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
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted!");
    },
    onError: (error) => {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    },
  });
}

export function useAddToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { collection_id: string; item_type: 'prompt' | 'skill' | 'workflow'; item_id: string }) => {
      // Get current max sort_order
      const { data: items } = await supabase
        .from("collection_items")
        .select("sort_order")
        .eq("collection_id", data.collection_id)
        .order("sort_order", { ascending: false })
        .limit(1);

      const sortOrder = items && items.length > 0 ? items[0].sort_order + 1 : 0;

      const { error } = await supabase
        .from("collection_items")
        .insert({ ...data, sort_order: sortOrder });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection-items", variables.collection_id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Added to collection!");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Item already in collection");
      } else {
        console.error("Error adding to collection:", error);
        toast.error("Failed to add to collection");
      }
    },
  });
}

export function useRemoveFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, itemId }: { collectionId: string; itemId: string }) => {
      const { error } = await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", collectionId)
        .eq("id", itemId);

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
    },
  });
}

export function useUpdateItemOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, items }: { collectionId: string; items: { id: string; sort_order: number }[] }) => {
      for (const item of items) {
        const { error } = await supabase
          .from("collection_items")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection-items", variables.collectionId] });
    },
    onError: (error) => {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    },
  });
}
