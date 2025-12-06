import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PromptsSection } from "@/components/landing/PromptsSection";
import { PricingPreview } from "@/components/landing/PricingPreview";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <PromptsSection />
        <FeaturesSection />
        <PricingPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
