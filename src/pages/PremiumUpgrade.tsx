import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Brain, Shield, ArrowRight, X, Loader2 } from "lucide-react";
import { StripeModeToggle } from "@/components/stripe/StripeModeToggle";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import heroPremium from "@/assets/hero-premium.png";

const plans = [
  {
    name: "Premium",
    price: "$9",
    period: "/month",
    description: "For serious prompt engineers",
    popular: true,
    features: [
      "Unlimited prompt storage",
      "AI Prompt Improvement Suite",
      "In-Dashboard LLM Chat",
      "Advanced analytics",
      "Priority support",
      "Version history",
    ],
    notIncluded: [],
  },
  {
    name: "Team",
    price: "$29",
    period: "/month",
    description: "For teams and organizations",
    popular: false,
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Shared prompt libraries",
      "Admin controls",
      "SSO authentication",
      "GitHub integration",
      "API access",
    ],
    notIncluded: [],
  },
];

const comparisonFeatures = [
  { name: "Prompt storage", free: "50 prompts", premium: "Unlimited", team: "Unlimited" },
  { name: "Copy public prompts", free: true, premium: true, team: true },
  { name: "Create & publish prompts", free: true, premium: true, team: true },
  { name: "AI Prompt Improvement", free: false, premium: true, team: true },
  { name: "In-Dashboard LLM Chat", free: false, premium: true, team: true },
  { name: "Version control", free: false, premium: true, team: true },
  { name: "Team collaboration", free: false, premium: false, team: true },
  { name: "GitHub sync", free: false, premium: false, team: true },
  { name: "API access", free: false, premium: false, team: true },
];

export default function PremiumUpgrade() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { createCheckoutSession, isLoading } = useStripeCheckout();
  const { user } = useAuth();

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      window.location.href = "/auth?redirect=/premium-feature-upgrade";
      return;
    }
    await createCheckoutSession(billingCycle);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section with Image */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-20">
            <img src={heroPremium} alt="" className="w-full h-full object-cover" />
          </div>
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-3 w-3" />
            Upgrade Your Experience
          </Badge>
          <h1 className="font-display text-display-lg text-foreground mb-4">
            Unlock the Full Power of <span className="text-gradient">Querino</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Get access to AI-powered tools, unlimited storage, and premium features to supercharge your prompt engineering workflow.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 bg-success/10 text-success">Save 20%</Badge>
            </button>
          </div>
          
          {/* Stripe Mode Toggle - only visible in dev */}
          <div className="mt-6 flex justify-center">
            <StripeModeToggle showInProduction={false} />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-20">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-primary shadow-lg" : "border-border"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {billingCycle === "yearly" 
                      ? `$${parseInt(plan.price.replace("$", "")) * 0.8 * 12}`
                      : plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    {billingCycle === "yearly" ? "/year" : plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-display-sm text-foreground text-center mb-8">
            Compare Plans
          </h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-foreground">Feature</th>
                    <th className="text-center p-4 font-medium text-foreground">Free</th>
                    <th className="text-center p-4 font-medium text-foreground">Premium</th>
                    <th className="text-center p-4 font-medium text-foreground">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="p-4 text-sm text-foreground">{feature.name}</td>
                      <td className="p-4 text-center">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feature.premium === "boolean" ? (
                          feature.premium ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-foreground">{feature.premium}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof feature.team === "boolean" ? (
                          feature.team ? (
                            <Check className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-foreground">{feature.team}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <h2 className="font-display text-display-sm text-foreground mb-4">
            Questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            We're here to help. Contact our support team or check out our FAQ.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline">View FAQ</Button>
            <Button variant="outline">Contact Support</Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
