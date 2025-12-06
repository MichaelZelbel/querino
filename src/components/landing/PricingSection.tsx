import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
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
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
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
    cta: "Upgrade to Pro",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/user/month",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team prompt libraries",
      "Role-based access control",
      "Admin dashboard",
      "SSO integration",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free and upgrade when you're ready for more power.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name}
              variant={plan.popular ? "elevated" : "default"}
              className={`relative flex flex-col animate-fade-in-up ${plan.popular ? "border-primary/50 shadow-lg shadow-primary/10" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1 bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-4">
                <Button variant={plan.variant} className="w-full">
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
