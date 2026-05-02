import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export type AppRole = 'free' | 'premium' | 'premium_gift' | 'admin';

/**
 * Hook to fetch and manage the current user's role from the user_roles table.
 * Backed by TanStack Query so multiple components share a single cached request
 * per user instead of each issuing its own Supabase query.
 *
 * Public API is intentionally identical to the previous useState/useEffect
 * implementation — callers do not need to be updated.
 */
export function useUserRole() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["user-role", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min — role rarely changes mid-session
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<AppRole> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .single();

      if (error) {
        // If no row found, user is new → default to 'free'
        if ((error as { code?: string }).code === "PGRST116") {
          return "free";
        }
        throw error;
      }
      return data.role as AppRole;
    },
  });

  const role: AppRole | null = userId ? (query.data ?? null) : null;

  const refetch = useCallback(async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: ["user-role", userId] });
  }, [queryClient, userId]);

  return {
    role,
    isLoading: !!userId && query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    isAdmin: role === "admin",
    isPremium: role === "premium" || role === "premium_gift" || role === "admin",
    isFree: role === "free",
    refetch,
  };
}
