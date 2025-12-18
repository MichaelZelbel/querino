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
    description: "For serious prompt engineers",
    features: [
      "Unlimited prompt library",
      "AI prompt refinement tools",
      "AI Insights & recommendations",
      "Semantic search",
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
    price: "€30",
    period: " + €5/seat/month",
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

// Feature comparison for pricing table
export interface FeatureComparison {
  category: string;
  features: {
    name: string;
    free: boolean | string;
    premium: boolean | string;
    team: boolean | string;
    isPremium?: boolean;
  }[];
}

export const featureComparison: FeatureComparison[] = [
  {
    category: "Core Features",
    features: [
      { name: "Browse public prompts", free: true, premium: true, team: true },
      { name: "Copy prompts", free: true, premium: true, team: true },
      { name: "Save prompts", free: "25 max", premium: "Unlimited", team: "Unlimited" },
      { name: "Create prompts", free: "10 max", premium: "Unlimited", team: "Unlimited" },
      { name: "Tags & categories", free: true, premium: true, team: true },
    ],
  },
  {
    category: "AI Features",
    features: [
      { name: "AI Insights & summaries", free: false, premium: true, team: true, isPremium: true },
      { name: "AI recommendations", free: false, premium: true, team: true, isPremium: true },
      { name: "Prompt Wizard", free: false, premium: true, team: true, isPremium: true },
      { name: "Semantic search", free: false, premium: true, team: true, isPremium: true },
      { name: "Similar artefacts", free: false, premium: true, team: true, isPremium: true },
    ],
  },
  {
    category: "Productivity",
    features: [
      { name: "Version history", free: "Last 3", premium: "Unlimited", team: "Unlimited" },
      { name: "GitHub sync", free: false, premium: true, team: true, isPremium: true },
      { name: "Markdown import/export", free: "Basic", premium: "Full", team: "Full" },
      { name: "Collections", free: "3 max", premium: "Unlimited", team: "Unlimited" },
    ],
  },
  {
    category: "Collaboration",
    features: [
      { name: "Team workspaces", free: false, premium: false, team: true },
      { name: "Role-based access", free: false, premium: false, team: true },
      { name: "Edit suggestions", free: true, premium: true, team: true },
      { name: "Comments", free: true, premium: true, team: true },
    ],
  },
  {
    category: "Support",
    features: [
      { name: "Community support", free: true, premium: true, team: true },
      { name: "Priority support", free: false, premium: true, team: true },
      { name: "Dedicated support", free: false, premium: false, team: true },
      { name: "SSO integration", free: false, premium: false, team: true },
    ],
  },
];
