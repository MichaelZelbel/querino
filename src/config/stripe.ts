// Stripe configuration with live/sandbox mode switching
// Mode can be toggled via localStorage for easy testing

export type StripeMode = "live" | "sandbox";

const STRIPE_MODE_KEY = "querino_stripe_mode";

export function getStripeMode(): StripeMode {
  if (typeof window === "undefined") return "live";
  const stored = localStorage.getItem(STRIPE_MODE_KEY);
  if (stored === "sandbox" || stored === "live") return stored;
  // Default to sandbox in development, live in production
  return import.meta.env.DEV ? "sandbox" : "live";
}

export function setStripeMode(mode: StripeMode): void {
  localStorage.setItem(STRIPE_MODE_KEY, mode);
}

// Price IDs for Premium subscription
export const STRIPE_PRICES = {
  live: {
    premium_monthly: "price_1SsPvlAOLjIkoJutHVQDWSbf",
    premium_yearly: "price_1SsPw2PI0Qbup0BVmoUmIdfk",
  },
  sandbox: {
    premium_monthly: "price_1SsB8mPI0Qbup0BVjThtGENU",
    premium_yearly: "price_1SsB9API0Qbup0BV78Yd7zGA",
  },
} as const;

// Product IDs for plan type mapping
export const STRIPE_PRODUCTS = {
  live: {
    premium_monthly: "prod_Tq686K3LQZSdbp",
    premium_yearly: "prod_Tq68iP8wBpcugj",
  },
  sandbox: {
    premium_monthly: "prod_Tpqq1Ng9whtnlI",
    premium_yearly: "prod_Tpqqzh9Ejs24xh",
  },
} as const;

export function getPriceId(billingCycle: "monthly" | "yearly"): string {
  const mode = getStripeMode();
  return billingCycle === "yearly" 
    ? STRIPE_PRICES[mode].premium_yearly 
    : STRIPE_PRICES[mode].premium_monthly;
}

export function getAllPremiumProductIds(): string[] {
  return [
    ...Object.values(STRIPE_PRODUCTS.live),
    ...Object.values(STRIPE_PRODUCTS.sandbox),
  ];
}
