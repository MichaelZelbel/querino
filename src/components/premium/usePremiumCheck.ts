import { useAuthContext } from '@/contexts/AuthContext';
import type { PlanRequirement } from './PremiumGate';

/**
 * Hook to check if user has premium access
 */
export function usePremiumCheck() {
  const { user, profile } = useAuthContext();

  const isPremium = profile?.plan_type === 'premium' || profile?.plan_type === 'team';
  const isTeam = profile?.plan_type === 'team';
  const isFree = user && profile?.plan_type === 'free';
  const isAnonymous = !user;

  const hasAccess = (requires: PlanRequirement): boolean => {
    if (!user || !profile) return false;
    if (requires === 'premium') return isPremium;
    if (requires === 'team') return isTeam;
    return false;
  };

  return {
    user,
    profile,
    isPremium,
    isTeam,
    isFree,
    isAnonymous,
    hasAccess,
  };
}
