import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  showForPremiumUsers?: boolean;
}

/**
 * Shows a "Premium" badge for free users only (unless showForPremiumUsers is true).
 * Used to indicate premium features in tabs, buttons, etc.
 */
export function PremiumBadge({ className, showForPremiumUsers = false }: PremiumBadgeProps) {
  const { user, profile } = useAuthContext();

  // Don't show for anonymous users
  if (!user) return null;

  const isPremium = profile?.plan_type === 'premium';

  // Only show for free users (unless overridden)
  if (isPremium && !showForPremiumUsers) return null;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "h-5 px-1.5 text-[10px] font-medium gap-0.5 bg-primary/10 text-primary border-0",
        className
      )}
    >
      <Crown className="h-2.5 w-2.5" />
      Premium
    </Badge>
  );
}
