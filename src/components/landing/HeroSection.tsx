import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import heroLanding from "@/assets/hero-landing.png";
import { HomeStats } from "./HomeStats";

export function HeroSection() {
  const { user, loading } = useAuthContext();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
              <Sparkles className="h-4 w-4" />
              The AI Prompt Library
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-display-lg font-bold text-foreground md:text-display-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Discover, Create & Master{" "}
              <span className="text-gradient">AI Prompts</span>
            </h1>

            {/* Subheadline */}
            <p className="mb-8 text-lg text-muted-foreground md:text-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Access thousands of curated prompts, organize your personal library, 
              and refine your AI interactions with intelligent tools.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" className="gap-2">
                Start Exploring
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Link to={user ? "/library" : "/auth?redirect=/library"}>
                <Button variant="hero-outline" size="xl">
                  View Your Library
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <HomeStats />
          </div>

          {/* Hero Image */}
          <div className="animate-fade-in-up hidden lg:block" style={{ animationDelay: "0.3s" }}>
            <img 
              src={heroLanding} 
              alt="AI Prompt Library Interface" 
              className="w-full rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
