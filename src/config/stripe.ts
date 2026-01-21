// Stripe configuration with native Lovable integration
// Products created via Stripe integration

export const STRIPE_PRICES = {
  premium_monthly: "price_1SsB03AOLjIkoJut62OdjVVB",
  premium_yearly: "price_1SsB0eAOLjIkoJut3uIxRDFd",
} as const;

export const STRIPE_PRODUCTS = {
  premium_monthly: "prod_TpqhlvF6bKNQIk",
  premium_yearly: "prod_Tpqih5nfN3NUhI",
} as const;

export function getPriceId(billingCycle: "monthly" | "yearly"): string {
  return billingCycle === "yearly" 
    ? STRIPE_PRICES.premium_yearly 
    : STRIPE_PRICES.premium_monthly;
}
