import { useState } from "react";
import { toast } from "sonner";

type BillingCycle = "monthly" | "yearly";

// POLICY: Stripe checkout is deliberately disabled and must stay disabled.
// Querino must not offer any self-serve purchase flow; "contact support"
// is the only upgrade path. Do NOT restore checkout without the owner's
// explicit instruction.

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
