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

export function getStripePublishableKey(): string {
  const mode = getStripeMode();
  return mode === "sandbox"
    ? (import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY || "")
    : (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");
}

// Price IDs for Premium subscription - these should match your Stripe products
export const STRIPE_PRICES = {
  live: {
    premium_monthly: "", // Will be set after creating products in Stripe
    premium_yearly: "",
  },
  sandbox: {
    premium_monthly: "", // Will be set after creating products in Stripe
    premium_yearly: "",
  },
} as const;

export function getPriceId(plan: "premium_monthly" | "premium_yearly"): string {
  const mode = getStripeMode();
  return STRIPE_PRICES[mode][plan];
}
