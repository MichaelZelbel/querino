import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { AppRole } from "@/types/userRole";
import { toast } from "sonner";

interface SubscriptionStatus {
  subscribed: boolean;
  role: AppRole;
  plan_type: string;
  plan_source: string | null;
  product_id: string | null;
  subscription_end: string | null;
  mode: string | null;
  admin_override?: boolean;
}

export function useSubscription() {
  const { user } = useAuthContext();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkSubscription = useCallback(async (force = false) => {
    if (!user) {
      setSubscription(null);
      return;
    }

    const now = Date.now();
    if (!force && now - lastCheckRef.current < 5000) {
      return;
    }
    lastCheckRef.current = now;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("[Subscription] Check error:", error);
        setError(error.message);
        return;
      }

      setSubscription(data);
    } catch (err) {
      console.error("[Subscription] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // NOTE: Stripe customer portal disabled. Contact support instead.
  const openCustomerPortal = async () => {
    toast.info("To manage your subscription, contact support@querino.ai");
    return null;
  };

  useEffect(() => {
    if (user) {
      checkSubscription(true);
    }
  }, [user, checkSubscription]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => checkSubscription(), 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  // Check for checkout success in URL (kept for backwards compat)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setTimeout(() => checkSubscription(true), 2000);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("checkout");
      newUrl.searchParams.delete("session_id");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [checkSubscription]);

  const isPremium = subscription?.role === "premium" || 
                    subscription?.role === "premium_gift" || 
                    subscription?.role === "admin";

  return {
    subscription,
    isLoading,
    error,
    isPremium,
    isAdminOverride: subscription?.admin_override === true,
    checkSubscription: () => checkSubscription(true),
    openCustomerPortal,
  };
}
