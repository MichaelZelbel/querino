import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function PricingPreview() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
            Flexible plans for every AI builder
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Start free with essential features and upgrade anytime to unlock unlimited storage, 
            AI refinement tools, and team collaboration.
          </p>
          <Link to="/pricing">
            <Button variant="hero" size="lg" className="gap-2">
              View Pricing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
