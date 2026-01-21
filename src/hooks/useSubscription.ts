import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SubscriptionStatus {
  subscribed: boolean;
  plan_type: string;
  product_id: string | null;
  subscription_end: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Subscription check error:", error);
        setError(error.message);
        return;
      }

      setSubscription(data);
    } catch (err) {
      console.error("Subscription check error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) {
        console.error("Customer portal error:", error);
        return null;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        return data.url;
      }

      return null;
    } catch (err) {
      console.error("Customer portal error:", err);
      return null;
    }
  };

  // Check subscription on mount and when user changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Set up periodic refresh (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    subscription,
    isLoading,
    error,
    isPremium: subscription?.plan_type === "premium",
    checkSubscription,
    openCustomerPortal,
  };
}
