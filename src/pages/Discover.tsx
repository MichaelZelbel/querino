import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptsSection } from "@/components/landing/PromptsSection";

const Discover = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <PromptsSection showHeader={false} />
      </main>
      <Footer />
    </div>
  );
};

export default Discover;
