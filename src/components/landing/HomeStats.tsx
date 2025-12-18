import { useEffect, useState } from "react";
import { Copy, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeStatsData {
  publicPrompts: number | null;
  activeCreators: number | null;
  averageRating: number | null;
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value <= 10) {
      // Animate from 0 to value for small numbers
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
    activeCreators: null,
    averageRating: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch all stats in parallel
        const [promptsResult, creatorsResult, ratingsResult] = await Promise.all([
          // Count public prompts
          supabase
            .from("prompts")
            .select("id", { count: "exact", head: true })
            .eq("is_public", true),
          
          // Get active creators (last 7 days)
          supabase.rpc("active_creators_last_7_days"),
          
          // Get average rating from prompt_reviews
          supabase
            .from("prompt_reviews")
            .select("rating"),
        ]);

        // Calculate average rating
        let avgRating: number | null = null;
        if (ratingsResult.data && ratingsResult.data.length > 0) {
          const sum = ratingsResult.data.reduce((acc, r) => acc + r.rating, 0);
          avgRating = sum / ratingsResult.data.length;
        }

        setStats({
          publicPrompts: promptsResult.count ?? 0,
          activeCreators: creatorsResult.data ?? 0,
          averageRating: avgRating,
        });
      } catch (error) {
        console.error("Error fetching homepage stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatRating = (rating: number | null) => {
    if (rating === null) return "–";
    return rating.toFixed(1);
  };

  const renderCreatorsValue = () => {
    if (stats.activeCreators === 0) {
      return (
        <span className="text-lg md:text-xl">
          Just Launched 🎉
        </span>
      );
    }
    return <AnimatedNumber value={stats.activeCreators ?? 0} />;
  };

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

      {/* Active Creators */}
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start">
          <Users className="h-5 w-5 text-warning" />
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            renderCreatorsValue()
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Active Creators This Week</p>
      </div>

      {/* Average Rating */}
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center gap-1.5 text-xl font-bold text-foreground md:text-2xl lg:justify-start">
          <Star className="h-5 w-5 text-success" />
          {loading ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <span>{formatRating(stats.averageRating)}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Average Rating</p>
      </div>
    </div>
  );
}
