import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  subscribed: boolean;
  plan_type: string;
  product_id: string | null;
  subscription_end: string | null;
  mode?: string | null;
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

    // Debounce: don't check more than once per 5 seconds unless forced
    const now = Date.now();
    if (!force && now - lastCheckRef.current < 5000) {
      console.log("[Subscription] Skipping check - too recent");
      return;
    }
    lastCheckRef.current = now;

    setIsLoading(true);
    setError(null);

    try {
      console.log("[Subscription] Checking subscription status...");
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("[Subscription] Check error:", error);
        setError(error.message);
        return;
      }

      console.log("[Subscription] Status received:", data);
      setSubscription(data);
    } catch (err) {
      console.error("[Subscription] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const openCustomerPortal = async () => {
    try {
      const { getStripeMode } = await import("@/config/stripe");
      const mode = getStripeMode();
      
      console.log("[Subscription] Opening customer portal", { mode });
      
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { mode },
      });

      if (error) {
        console.error("[Subscription] Customer portal error:", error);
        return null;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        return data.url;
      }

      return null;
    } catch (err) {
      console.error("[Subscription] Customer portal unexpected error:", err);
      return null;
    }
  };

  // Check subscription on mount and when user changes
  useEffect(() => {
    if (user) {
      checkSubscription(true);
    }
  }, [user, checkSubscription]);

  // Set up periodic refresh (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => checkSubscription(), 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  // Check for checkout success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      console.log("[Subscription] Checkout success detected, forcing subscription check");
      // Wait a moment for Stripe to process, then check
      setTimeout(() => checkSubscription(true), 2000);
      
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("checkout");
      newUrl.searchParams.delete("session_id");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [checkSubscription]);

  return {
    subscription,
    isLoading,
    error,
    isPremium: subscription?.plan_type === "premium",
    checkSubscription: () => checkSubscription(true),
    openCustomerPortal,
  };
}
