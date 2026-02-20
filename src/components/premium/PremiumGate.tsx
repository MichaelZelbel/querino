import { ReactNode } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PlanRequirement = 'premium' | 'team';

interface PremiumGateProps {
  requires: PlanRequirement;
  featureName: string;
  children: ReactNode;
  className?: string;
  variant?: 'card' | 'inline' | 'sidebar';
}

export function PremiumGate({
  requires,
  featureName,
  children,
  className,
  variant = 'card',
}: PremiumGateProps) {
  const { user } = useAuthContext();
  const { isPremium, isLoading } = useUserRole();
  

  // Show nothing while loading to prevent flash
  if (isLoading) {
    return null;
  }

  // Check if user has required plan from user_roles
  // Premium plan (premium, premium_gift, admin) grants access to both 'premium' and 'team' features
  const hasAccess = (() => {
    if (!user) return false;
    if (requires === 'premium' || requires === 'team') {
      return isPremium;
    }
    return false;
  })();

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Locked state for logged-in users without premium
  if (user && !hasAccess) {
    if (variant === 'sidebar') {
      return (
        <div className={cn("flex flex-col items-center justify-center p-6 text-center", className)}>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-semibold text-foreground mb-2">Premium Feature</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {featureName} is a Premium feature. Contact support to learn more.
          </p>
          <a href="mailto:support@querino.ai">
            <Button size="sm" variant="outline" className="gap-2">
              Contact Support
            </Button>
          </a>
        </div>
      );
    }

    if (variant === 'inline') {
      return (
        <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border", className)}>
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">{featureName} requires Premium</span>
          <a href="mailto:support@querino.ai">
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
              Contact Support
            </Button>
          </a>
        </div>
      );
    }

    // Default card variant with blur effect
    return (
      <div className={cn("relative overflow-hidden rounded-xl", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h4 className="font-semibold text-foreground mb-2 text-lg">
            {featureName}
          </h4>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
            This feature requires Querino Premium. Contact support for more information.
          </p>
          <a href="mailto:support@querino.ai">
            <Button variant="outline" className="gap-2">
              Contact Support
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // For anonymous users - don't render anything (they shouldn't see premium features)
  return null;
}
