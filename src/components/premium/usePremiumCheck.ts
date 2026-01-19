import { useAuthContext } from '@/contexts/AuthContext';
import type { PlanRequirement } from './PremiumGate';

/**
 * Hook to check if user has premium access
 */
export function usePremiumCheck() {
  const { user, profile } = useAuthContext();

  const isPremium = profile?.plan_type === 'premium';
  const isFree = user && profile?.plan_type === 'free';
  const isAnonymous = !user;

  const hasAccess = (requires: PlanRequirement): boolean => {
    if (!user || !profile) return false;
    // Both 'premium' and 'team' requirements are satisfied by premium plan
    // since "team" is now just a feature of premium, not a separate plan
    if (requires === 'premium' || requires === 'team') return isPremium;
    return false;
  };

  return {
    user,
    profile,
    isPremium,
    isFree,
    isAnonymous,
    hasAccess,
  };
}
