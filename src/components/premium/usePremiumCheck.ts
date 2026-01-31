import { useUserRole, type AppRole } from '@/hooks/useUserRole';
import { useAuthContext } from '@/contexts/AuthContext';
import type { PlanRequirement } from './PremiumGate';

/**
 * Hook to check if user has premium access based on user_roles table.
 * This is the authoritative source for premium gating.
 */
export function usePremiumCheck() {
  const { user } = useAuthContext();
  const { role, isLoading, isPremium, isAdmin, isFree, refetch } = useUserRole();

  const isAnonymous = !user;

  const hasAccess = (requires: PlanRequirement): boolean => {
    if (!user || !role) return false;
    // Both 'premium' and 'team' requirements are satisfied by premium access
    // (premium, premium_gift, or admin roles all grant premium access)
    if (requires === 'premium' || requires === 'team') return isPremium;
    return false;
  };

  return {
    user,
    role,
    isPremium,
    isAdmin,
    isFree,
    isAnonymous,
    isLoading,
    hasAccess,
    refetch,
  };
}
