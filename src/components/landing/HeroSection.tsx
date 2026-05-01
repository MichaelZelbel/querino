import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { HomeStats } from "./HomeStats";
import { HeroStage } from "./HeroStage";

export function HeroSection() {
  const { user } = useAuthContext();

  return (
    <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
      {/* Background blobs (indigo + coral) */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-[150px] rounded-full blur-3xl"
          style={{ background: "hsl(var(--primary) / 0.07)" }}
        />
        <div
          className="absolute right-[-10%] top-[30%] h-[500px] w-[500px] rounded-full blur-3xl"
          style={{ background: "hsl(var(--accent-warm) / 0.10)" }}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* LEFT — copy */}
          <div className="text-center lg:text-left">
            {/* Eyebrow pill */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-primary animate-fade-in"
              style={{
                background: "hsl(var(--primary) / 0.08)",
                borderColor: "hsl(var(--primary) / 0.25)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              The AI Prompt Library
            </div>

            {/* Headline — Bricolage Grotesque, gradient on last two words */}
            <h1
              className="mb-6 font-display font-bold text-foreground animate-fade-in-up"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                animationDelay: "0.1s",
                textWrap: "balance" as never,
              }}
            >
              Discover, Create &amp;
              <br />
              Master <span className="querino-grad-text">AI Prompts</span>
            </h1>

            {/* Sub-copy (witty default) */}
            <p
              className="mb-8 max-w-xl text-lg text-muted-foreground md:text-[17px] animate-fade-in-up mx-auto lg:mx-0"
              style={{ animationDelay: "0.2s", lineHeight: 1.55 }}
            >
              Thousands of curated prompts, your personal library, and a tiny
              mascot who genuinely cares whether your prompts are good.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Link to="/discover">
                <Button variant="hero" size="xl" className="gap-2">
                  Start Exploring
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to={user ? "/library" : "/auth?redirect=/library"}>
                <Button variant="hero-outline" size="xl">
                  View Your Library
                </Button>
              </Link>
            </div>

            {/* Stats row (existing) */}
            <HomeStats />
          </div>

          {/* RIGHT — the stage with Quentin */}
          <div
            className="hidden animate-fade-in-up lg:block"
            style={{ animationDelay: "0.3s" }}
          >
            <HeroStage />
          </div>
        </div>
      </div>
    </section>
  );
}
