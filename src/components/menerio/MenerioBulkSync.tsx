import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RefreshCw, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ArtifactStats {
  total: number;
  synced: number;
}

type StatsMap = Record<"prompt" | "skill" | "workflow" | "prompt_kit", ArtifactStats>;

const ARTIFACT_LABELS: Record<string, string> = {
  prompt: "Prompts",
  prompt_kit: "Prompt Kits",
  skill: "Skills",
  workflow: "Workflows",
};

const TABLES = ["prompts", "prompt_kits", "skills", "workflows"] as const;
const TYPES = ["prompt", "prompt_kit", "skill", "workflow"] as const;

export function MenerioBulkSync() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<StatsMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [resetting, setResetting] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const results: Partial<StatsMap> = {};

    const queries = TABLES.map((table, i) =>
      (supabase.from(table) as any)
        .select("id, menerio_synced", { count: "exact" })
        .eq("author_id", user.id)
        .then(({ data, count }: any) => {
          const synced = data?.filter((r: any) => r.menerio_synced).length ?? 0;
          results[TYPES[i]] = { total: count ?? 0, synced };
        })
    );

    await Promise.all(queries);
    setStats(results as StatsMap);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleBulkSync = async () => {
    if (!user) return;
    setSyncing(true);

    try {
      const toSync: { type: string; id: string }[] = [];

      for (let i = 0; i < TABLES.length; i++) {
        const { data } = await (supabase.from(TABLES[i]) as any)
          .select("id, menerio_synced, updated_at, menerio_synced_at")
          .eq("author_id", user.id);

        if (data) {
          for (const row of data as any[]) {
            const needsSync =
              !row.menerio_synced ||
              (row.menerio_synced_at && row.updated_at > row.menerio_synced_at);
            if (needsSync) {
              toSync.push({ type: TYPES[i], id: row.id });
            }
          }
        }
      }

      if (toSync.length === 0) {
        toast.info("All artifacts are already synced.");
        setSyncing(false);
        return;
      }

      setProgress({ current: 0, total: toSync.length });

      const queueEntries = toSync.map((item) => ({
        user_id: user.id,
        artifact_type: item.type,
        artifact_id: item.id,
        status: "pending",
      }));

      const { error: insertError } = await supabase
        .from("menerio_sync_queue")
        .insert(queueEntries);

      if (insertError) throw insertError;

      let completed = 0;
      const maxPolls = 120;
      let polls = 0;

      while (completed < toSync.length && polls < maxPolls) {
        await new Promise((r) => setTimeout(r, 5000));
        polls++;

        const { data: queueData } = await supabase
          .from("menerio_sync_queue")
          .select("status")
          .eq("user_id", user.id)
          .in(
            "artifact_id",
            toSync.map((t) => t.id)
          );

        if (queueData) {
          const done = queueData.filter(
            (q: any) => q.status === "completed" || q.status === "failed"
          ).length;
          completed = Math.max(done, toSync.length - (queueData.filter((q: any) => q.status === "pending" || q.status === "processing").length));
          setProgress({ current: completed, total: toSync.length });
        }

        if (queueData && queueData.every((q: any) => q.status === "completed" || q.status === "failed")) {
          break;
        }
      }

      await fetchStats();
      toast.success(`Sync complete. ${completed} artifacts synchronized.`);
    } catch (error) {
      console.error("Bulk sync error:", error);
      toast.error("Bulk sync failed");
    } finally {
      setSyncing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleResetAll = async () => {
    if (!user) return;
    setResetting(true);

    try {
      const resetPayload = {
        menerio_synced: false,
        menerio_note_id: null,
        menerio_synced_at: null,
      };

      await Promise.all(
        TABLES.map((table) =>
          (supabase.from(table) as any)
            .update(resetPayload)
            .eq("author_id", user.id)
        )
      );

      await fetchStats();
      toast.success("All Menerio links have been removed.");
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to reset");
    } finally {
      setResetting(false);
    }
  };

  if (!user) return null;

  const totalArtifacts = stats
    ? Object.values(stats).reduce((s, v) => s + v.total, 0)
    : 0;
  const totalSynced = stats
    ? Object.values(stats).reduce((s, v) => s + v.synced, 0)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync all artifacts
        </CardTitle>
        <CardDescription>
          Sync all your artifacts at once with Menerio. Already synced artifacts will be updated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TYPES.map((type) => (
                <div
                  key={type}
                  className="rounded-lg border border-border bg-secondary/30 p-3 text-center"
                >
                  <p className="text-sm font-medium">{ARTIFACT_LABELS[type]}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {stats![type].synced}
                    <span className="text-muted-foreground font-normal text-sm">
                      {" "}
                      / {stats![type].total}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">synced</p>
                </div>
              ))}
            </div>

            {syncing && progress.total > 0 && (
              <div className="space-y-2">
                <Progress
                  value={(progress.current / progress.total) * 100}
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Syncing {progress.current} of {progress.total}…
                </p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap items-center">
              <Button onClick={handleBulkSync} disabled={syncing || resetting}>
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing…
                  </>
                ) : totalArtifacts === totalSynced && totalArtifacts > 0 ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    All synced
                  </>
                ) : (
                  "Sync all"
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={syncing || resetting || totalSynced === 0}
                    className="text-destructive hover:text-destructive"
                  >
                    {resetting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Remove all syncs
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Remove all Menerio links?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      The notes in Menerio will remain, but they will no longer
                      be automatically updated. You can re-sync at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAll}>
                      Yes, remove all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
