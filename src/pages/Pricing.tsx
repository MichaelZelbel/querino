import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingCards } from "@/components/pricing/PricingCards";
import { FeatureComparisonTable } from "@/components/pricing/FeatureComparisonTable";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const fromDashboard = searchParams.get("from") === "dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Pricing Cards Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h1 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-muted-foreground">
                Start free and upgrade when you're ready for more power.
              </p>
            </div>

            <PricingCards fromDashboard={fromDashboard} />
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
                Compare Plans
              </h2>
              <p className="text-muted-foreground">
                See exactly what's included in each plan
              </p>
            </div>

            <Card className="mx-auto max-w-5xl overflow-hidden">
              <FeatureComparisonTable />
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
