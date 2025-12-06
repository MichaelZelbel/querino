import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Copy, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
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
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="gap-2">
              Start Exploring
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Link to="/dashboard">
              <Button variant="hero-outline" size="xl">
                View Your Library
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-foreground md:text-3xl">
                <Copy className="h-6 w-6 text-primary" />
                10k+
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Prompts Available</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-foreground md:text-3xl">
                <Zap className="h-6 w-6 text-warning" />
                50k+
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Daily Copies</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-foreground md:text-3xl">
                <Sparkles className="h-6 w-6 text-success" />
                4.9
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
