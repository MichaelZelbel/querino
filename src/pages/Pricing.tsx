import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PricingCards } from "@/components/pricing/PricingCards";
import { useSearchParams } from "react-router-dom";

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const fromDashboard = searchParams.get("from") === "dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
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
      </main>

      <Footer />
    </div>
  );
}
