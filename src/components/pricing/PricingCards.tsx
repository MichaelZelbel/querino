import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { pricingPlans, type PricingPlan } from "@/config/pricing";

interface PricingCardsProps {
  fromDashboard?: boolean;
}

export function PricingCards({ fromDashboard = false }: PricingCardsProps) {
  const getLink = (plan: PricingPlan) => {
    if (plan.ctaLink.startsWith("mailto:")) {
      return plan.ctaLink;
    }
    return fromDashboard ? `${plan.ctaLink}?from=dashboard` : plan.ctaLink;
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
      {pricingPlans.map((plan, index) => (
        <Card 
          key={plan.id}
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
            {plan.ctaLink.startsWith("mailto:") ? (
              <a href={plan.ctaLink} className="w-full">
                <Button variant={plan.variant} className="w-full">
                  {plan.cta}
                </Button>
              </a>
            ) : (
              <Link to={getLink(plan)} className="w-full">
                <Button variant={plan.variant} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
