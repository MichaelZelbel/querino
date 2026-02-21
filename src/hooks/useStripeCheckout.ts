import { useState } from "react";
import { toast } from "sonner";

type BillingCycle = "monthly" | "yearly";

// NOTE: Stripe checkout is currently disabled. To re-enable, restore
// the Stripe SDK invocation from git history.

export function useStripeCheckout() {
  const [isLoading] = useState(false);

  const createCheckoutSession = async (_billingCycle: BillingCycle) => {
    toast.info("To upgrade your plan, contact support@querino.ai");
    return null;
  };

  return {
    createCheckoutSession,
    isLoading,
  };
}
