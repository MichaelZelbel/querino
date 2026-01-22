import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { pricingPlans, type PricingPlan } from "@/config/pricing";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuthContext } from "@/contexts/AuthContext";

interface PricingCardsProps {
  fromDashboard?: boolean;
}

export function PricingCards({ fromDashboard = false }: PricingCardsProps) {
  const { user } = useAuthContext();
  const { isPremium, isLoading: isSubLoading } = useSubscription();
  const { createCheckoutSession, isLoading: isCheckoutLoading } = useStripeCheckout();

  const handleGetStarted = async (plan: PricingPlan) => {
    if (plan.id === "free") {
      // Navigate to sign up
      window.location.href = plan.ctaLink;
      return;
    }
    
    if (!user) {
      // Redirect to auth first
      window.location.href = "/auth?redirect=/pricing";
      return;
    }
    
    // Start checkout for premium
    await createCheckoutSession("monthly");
  };

  const getButtonContent = (plan: PricingPlan) => {
    // Free plan - always show "Get Started"
    if (plan.id === "free") {
      if (user && !isPremium) {
        return { text: "Your Current Plan", disabled: true, showArrow: false };
      }
      return { text: "Get Started", disabled: false, showArrow: true };
    }
    
    // Premium plan
    if (isPremium) {
      return { text: "Your Current Plan", disabled: true, showArrow: false };
    }
    
    return { text: "Get Started", disabled: false, showArrow: true };
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
      {pricingPlans.map((plan, index) => {
        const buttonContent = getButtonContent(plan);
        const isLoading = plan.id === "premium" && isCheckoutLoading;
        
        return (
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
              {plan.id === "free" && !user ? (
                <Link to={plan.ctaLink} className="w-full">
                  <Button variant={plan.variant} className="w-full">
                    {buttonContent.text}
                    {buttonContent.showArrow && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant={plan.variant} 
                  className="w-full"
                  disabled={buttonContent.disabled || isLoading || isSubLoading}
                  onClick={() => handleGetStarted(plan)}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {buttonContent.text}
                  {buttonContent.showArrow && !isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
