import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptsSection } from "@/components/landing/PromptsSection";

const Discover = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-background py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-display-lg font-bold text-foreground md:text-display-xl">
              Discover Powerful Prompts
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Browse public prompts shared by the Querino community. Find inspiration, copy instantly, and supercharge your AI workflows.
            </p>
          </div>
        </section>
        
        {/* Reuse the same prompts discovery section */}
        <PromptsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Discover;
