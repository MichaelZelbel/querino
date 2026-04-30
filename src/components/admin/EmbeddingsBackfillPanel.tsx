import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";

type ItemType = "prompt" | "skill" | "workflow" | "claw";

interface RunResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export function EmbeddingsBackfillPanel() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastResults, setLastResults] = useState<Record<string, RunResult> | null>(null);

  const loadCounts = async () => {
    setLoadingCounts(true);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-embeddings", {
        body: { dryRun: true },
      });
      if (error) throw error;
      const c = (data as { counts?: Record<string, { missing: number }> })?.counts;
      if (c) {
        setCounts({
          prompt: c.prompt?.missing ?? 0,
          skill: c.skill?.missing ?? 0,
          workflow: c.workflow?.missing ?? 0,
          claw: c.claw?.missing ?? 0,
        });
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load embedding counts");
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const runBackfill = async (itemType?: ItemType) => {
    setRunning(true);
    setLastResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-embeddings", {
        body: { maxItems: 200, itemType },
      });
      if (error) throw error;
      const d = data as {
        processed: number;
        results: Record<string, RunResult>;
        remaining: Record<string, number>;
      };
      setLastResults(d.results);
      setCounts({
        prompt: d.remaining?.prompt ?? 0,
        skill: d.remaining?.skill ?? 0,
        workflow: d.remaining?.workflow ?? 0,
        claw: d.remaining?.claw ?? 0,
      });
      const totalSucceeded = Object.values(d.results).reduce((s, r) => s + r.succeeded, 0);
      const totalFailed = Object.values(d.results).reduce((s, r) => s + r.failed, 0);
      if (totalFailed === 0) {
        toast.success(`Generated ${totalSucceeded} embeddings`);
      } else {
        toast.warning(`Done: ${totalSucceeded} succeeded, ${totalFailed} failed`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Backfill failed");
    } finally {
      setRunning(false);
    }
  };

  const totalMissing =
    (counts?.prompt ?? 0) + (counts?.skill ?? 0) + (counts?.workflow ?? 0) + (counts?.claw ?? 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Generate Missing Embeddings</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCounts}
            disabled={loadingCounts || running}
          >
            <RefreshCw className={`h-4 w-4 ${loadingCounts ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>
          Generates embeddings for artifacts where the vector column is empty. Uses
          OpenAI <code>text-embedding-3-small</code> (1536 dim). Processes up to 200 items per run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["prompt", "skill", "workflow", "claw"] as ItemType[]).map((t) => (
            <div key={t} className="rounded-md border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t}s</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {counts?.[t] ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">missing</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => runBackfill()}
            disabled={running || loadingCounts || totalMissing === 0}
          >
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Run backfill (all types)</>
            )}
          </Button>
          {totalMissing === 0 && counts && (
            <Badge variant="secondary">All caught up</Badge>
          )}
        </div>

        {lastResults && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
            <div className="font-medium">Last run</div>
            {Object.entries(lastResults).map(([type, r]) => (
              <div key={type} className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs uppercase">{type}</span>
                  <span className="ml-2 text-muted-foreground">
                    processed {r.processed} · ✓ {r.succeeded} · ✗ {r.failed}
                  </span>
                </div>
                {r.errors.length > 0 && (
                  <details className="text-xs text-muted-foreground max-w-[60%]">
                    <summary className="cursor-pointer">errors ({r.errors.length})</summary>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      {r.errors.map((e, i) => (
                        <li key={i} className="break-all">{e}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
