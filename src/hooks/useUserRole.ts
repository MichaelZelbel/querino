import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export type AppRole = 'free' | 'premium' | 'premium_gift' | 'admin';

interface UserRoleState {
  role: AppRole | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage the current user's role from the user_roles table.
 * This is the authoritative source for role/plan information.
 */
export function useUserRole() {
  const { user } = useAuthContext();
  const [state, setState] = useState<UserRoleState>({
    role: null,
    isLoading: true,
    error: null,
  });

  const fetchRole = useCallback(async () => {
    if (!user) {
      setState({ role: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no row found, user might be new - default to 'free'
        if (error.code === 'PGRST116') {
          setState({ role: 'free', isLoading: false, error: null });
        } else {
          console.error("[useUserRole] Error fetching role:", error);
          setState({ role: null, isLoading: false, error: error.message });
        }
        return;
      }

      console.log("[useUserRole] Fetched role:", data.role, "for user:", user.id);
      setState({ 
        role: data.role as AppRole, 
        isLoading: false, 
        error: null 
      });
    } catch (err) {
      console.error("[useUserRole] Unexpected error:", err);
      setState({ 
        role: null, 
        isLoading: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      });
    }
  }, [user]);

  // Fetch role when user changes
  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Computed properties
  const isAdmin = state.role === 'admin';
  const isPremium = state.role === 'premium' || state.role === 'premium_gift' || state.role === 'admin';
  const isFree = state.role === 'free';

  return {
    role: state.role,
    isLoading: state.isLoading,
    error: state.error,
    isAdmin,
    isPremium,
    isFree,
    refetch: fetchRole,
  };
}
