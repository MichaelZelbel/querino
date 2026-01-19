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
    price: "€15",
    period: "/month",
    description: "For individuals and collaborative teams",
    features: [
      "Unlimited prompt library",
      "AI prompt refinement tools",
      "AI Insights & recommendations",
      "Semantic search",
      "GitHub sync",
      "Shared team libraries",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    ctaLink: "/premium-feature-upgrade",
    variant: "hero",
    popular: true,
  },
];

// Feature comparison for pricing table
export interface FeatureComparison {
  category: string;
  features: {
    name: string;
    free: boolean | string;
    premium: boolean | string;
    isPremium?: boolean;
  }[];
}

export const featureComparison: FeatureComparison[] = [
  {
    category: "Core Features",
    features: [
      { name: "Browse public prompts", free: true, premium: true },
      { name: "Copy prompts", free: true, premium: true },
      { name: "Save prompts", free: "25 max", premium: "Unlimited" },
      { name: "Create prompts", free: "10 max", premium: "Unlimited" },
      { name: "Tags & categories", free: true, premium: true },
    ],
  },
  {
    category: "AI Features",
    features: [
      { name: "AI Insights & summaries", free: false, premium: true, isPremium: true },
      { name: "AI recommendations", free: false, premium: true, isPremium: true },
      { name: "Prompt Wizard", free: false, premium: true, isPremium: true },
      { name: "Semantic search", free: false, premium: true, isPremium: true },
      { name: "Similar artefacts", free: false, premium: true, isPremium: true },
    ],
  },
  {
    category: "Productivity",
    features: [
      { name: "Version history", free: "Last 3", premium: "Unlimited" },
      { name: "GitHub sync", free: false, premium: true, isPremium: true },
      { name: "Markdown import/export", free: "Basic", premium: "Full" },
      { name: "Collections", free: "3 max", premium: "Unlimited" },
    ],
  },
  {
    category: "Collaboration",
    features: [
      { name: "Team workspaces", free: false, premium: true, isPremium: true },
      { name: "Role-based access", free: false, premium: true, isPremium: true },
      { name: "Edit suggestions", free: true, premium: true },
      { name: "Comments", free: true, premium: true },
    ],
  },
  {
    category: "Support",
    features: [
      { name: "Community support", free: true, premium: true },
      { name: "Priority support", free: false, premium: true },
    ],
  },
];
