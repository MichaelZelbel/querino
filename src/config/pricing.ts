export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  variant: "outline" | "hero";
  popular: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Get started with essential features",
    features: [
      "Browse & copy all public prompts",
      "Save up to 25 prompts",
      "Basic organization (tags)",
      "Community access",
    ],
    cta: "Get Started",
    ctaLink: "/free-user-sign-up-initial-exploration",
    variant: "outline",
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$12",
    period: "/month",
    description: "For serious prompt engineers",
    features: [
      "Unlimited prompt library",
      "AI prompt refinement tools",
      "In-dashboard LLM chat",
      "Advanced versioning",
      "GitHub sync",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    ctaLink: "/premium-feature-upgrade",
    variant: "hero",
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$29",
    period: "/user/month",
    description: "For teams and organizations",
    features: [
      "Everything in Premium",
      "Team prompt libraries",
      "Role-based access control",
      "Admin dashboard",
      "SSO integration",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:support@querino.ai",
    variant: "outline",
    popular: false,
  },
];
