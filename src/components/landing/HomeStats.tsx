import { useEffect, useState } from "react";
import { Copy, Layers, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeStatsData {
  publicPrompts: number | null;
  totalArtifacts: number | null;
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value <= 10) {
      const steps = 20;
      const increment = value / steps;
      const stepDuration = duration / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

export function HomeStats() {
  const [stats, setStats] = useState<HomeStatsData>({
    publicPrompts: null,
    totalArtifacts: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [promptsResult, skillsResult, workflowsResult] = await Promise.all([
          supabase
            .from("prompts")
            .select("id", { count: "exact", head: true })
            .eq("is_public", true),
          supabase
            .from("skills")
            .select("id", { count: "exact", head: true })
            .eq("published", true),
          supabase
            .from("workflows")
            .select("id", { count: "exact", head: true })
            .eq("published", true),
        ]);

        const promptsCount = promptsResult.count ?? 0;
        const skillsCount = skillsResult.count ?? 0;
        const workflowsCount = workflowsResult.count ?? 0;

        setStats({
          publicPrompts: promptsCount,
          totalArtifacts: promptsCount + skillsCount + workflowsCount,
        });
      } catch (error) {
        console.error("Error fetching homepage stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="mt-12 grid grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
      {/* Public Prompts */}
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start">
          <Copy className="h-5 w-5 text-primary" />
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <AnimatedNumber value={stats.publicPrompts ?? 0} />
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Public Prompts</p>
      </div>

      {/* Total Artifacts */}
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start">
          <Layers className="h-5 w-5 text-warning" />
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <AnimatedNumber value={stats.totalArtifacts ?? 0} />
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Total Artifacts</p>
      </div>

      {/* Open Source */}
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start">
          <Code className="h-5 w-5 text-success" />
          <a
            href="https://github.com/MichaelZelbel/querino"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            AGPL-3.0
          </a>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Open Source</p>
      </div>
    </div>
  );
}
