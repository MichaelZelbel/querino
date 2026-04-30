import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { HomeStats } from "./HomeStats";
import { Quentin } from "./Quentin";
import { FloatingCards } from "./FloatingCards";
import { useTheme } from "@/hooks/useTheme";
import { useEffect, useState } from "react";

function useResponsiveMascotSize() {
  const [size, setSize] = useState(320);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) setSize(240);
      else if (w < 1024) setSize(280);
      else setSize(320);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export function HeroSection() {
  const { user } = useAuthContext();
  const { isDark } = useTheme();
  const mascotSize = useResponsiveMascotSize();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* subtle backdrop wash */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left column */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium animate-fade-in"
              style={{
                background: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              The AI Prompt Library
            </div>

            {/* H1 — Bricolage Grotesque */}
            <h1
              className="mb-6 font-display font-bold text-foreground animate-fade-in-up"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                textWrap: "balance",
                animationDelay: "0.1s",
              }}
            >
              Discover, Create &<br />
              Master <span className="hero-grad-text">AI Prompts</span>
            </h1>

            {/* Subhead */}
            <p
              className="mb-8 mx-auto lg:mx-0 text-muted-foreground animate-fade-in-up"
              style={{
                fontSize: "1.0625rem",
                lineHeight: 1.55,
                maxWidth: 520,
                animationDelay: "0.2s",
              }}
            >
              Access thousands of curated prompts, organize your personal library, and refine your AI
              interactions with intelligent tools.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Link to="/discover">
                <Button variant="hero" size="lg" className="gap-2">
                  Start Exploring
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={user ? "/library" : "/auth?redirect=/library"}>
                <Button variant="hero-outline" size="lg">
                  View Your Library
                </Button>
              </Link>
            </div>

            <HomeStats />
          </div>

          {/* Right column — mascot scene */}
          <div className="relative mx-auto flex items-center justify-center" style={{ minHeight: 480 }}>
            <div
              className="relative"
              style={{
                width: "min(560px, 100%)",
                height: "min(560px, 90vw)",
                maxHeight: 560,
              }}
            >
              {/* Halo */}
              <div className="hero-halo absolute inset-0 rounded-full" />

              {/* Floating cards */}
              <FloatingCards dark={isDark} />

              {/* Quentin centered */}
              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <Quentin size={mascotSize} dark={isDark} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
