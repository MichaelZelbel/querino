import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPriceId, getStripeMode } from "@/config/stripe";
import { toast } from "sonner";

type BillingCycle = "monthly" | "yearly";

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async (billingCycle: BillingCycle) => {
    setIsLoading(true);
    
    try {
      // Get fresh mode value from localStorage at the moment of checkout
      const mode = getStripeMode();
      const priceId = getPriceId(billingCycle);
      
      console.log("[Checkout] Starting checkout", { 
        priceId, 
        mode, 
        billingCycle,
        localStorageValue: localStorage.getItem("querino_stripe_mode") 
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to upgrade");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, mode },
      });

      if (error) {
        console.error("[Checkout] Edge function error:", error);
        toast.error("Failed to start checkout. Please try again.");
        return null;
      }

      console.log("[Checkout] Session created", { 
        url: data?.url?.substring(0, 60) + "...",
        isTestUrl: data?.url?.includes("cs_test_")
      });

      if (data?.url) {
        // Redirect in the same tab to maintain auth state
        window.location.href = data.url;
        return data;
      }

      toast.error("No checkout URL received");
      return null;
    } catch (error) {
      console.error("[Checkout] Unexpected error:", error);
      toast.error("An error occurred. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    isLoading,
  };
}
