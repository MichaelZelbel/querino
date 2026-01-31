/**
 * User role types - stored in the user_roles table.
 * This is the single source of truth for user plan/role status.
 * 
 * Role meanings:
 * - free: No paid plan
 * - premium: Active paid subscription via Stripe
 * - premium_gift: Premium access via gift/promo (not from Stripe)
 * - admin: Full admin access + premium features (admins always have premium access)
 */
export type AppRole = 'free' | 'premium' | 'premium_gift' | 'admin';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

/**
 * Check if a role grants premium access
 */
export function hasPremiumAccess(role: AppRole | null): boolean {
  return role === 'premium' || role === 'premium_gift' || role === 'admin';
}

/**
 * Check if a role grants admin access
 */
export function hasAdminAccess(role: AppRole | null): boolean {
  return role === 'admin';
}
