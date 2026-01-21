import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeMode } from "@/config/stripe";
import { toast } from "sonner";

type BillingCycle = "monthly" | "yearly";

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async (billingCycle: BillingCycle, priceId?: string) => {
    setIsLoading(true);
    
    try {
      const mode = getStripeMode();
      console.log("Creating checkout with mode:", mode);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to upgrade");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId,
          billingCycle,
          mode,
        },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to start checkout. Please try again.");
        return null;
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
        return data;
      }

      toast.error("No checkout URL received");
      return null;
    } catch (error) {
      console.error("Checkout error:", error);
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
