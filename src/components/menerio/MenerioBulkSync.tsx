import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RefreshCw, Loader2, Trash2, CheckCircle2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { summariseSyncRun, syncRunMessage } from "./menerioSyncSummary";

interface ArtifactStats {
  total: number;
  synced: number;
}

type StatsMap = Record<
  "prompt" | "skill" | "workflow" | "prompt_kit",
  ArtifactStats
>;

const ARTIFACT_LABELS: Record<string, string> = {
  prompt: "Prompts",
  prompt_kit: "Prompt Kits",
  skill: "Skills",
  workflow: "Workflows",
};

const TABLES = ["prompts", "prompt_kits", "skills", "workflows"] as const;
const TYPES = ["prompt", "prompt_kit", "skill", "workflow"] as const;

/**
 * Bulk sync for an account with an active Menerio connection, limited to the
 * artifact types it syncs (2026-10-07). It used to show without a connection
 * and count every type: the worker then marked each row "completed" with
 * "skipped: no active integration" or "skipped: artifact type not in sync
 * list", and the toast said they were synchronized.
 *
 * `revision` changes when the connection section above saves, so a connect,
 * a disconnect or a new type list is picked up without a reload.
 *
 * Without a connection only "Remove all syncs" is offered, and only while an
 * artifact is still linked (see below).
 */
export function MenerioBulkSync({ revision = 0 }: { revision?: number }) {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<StatsMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [resetting, setResetting] = useState(false);
  // undefined while loading, null without an active connection.
  const [syncTypes, setSyncTypes] = useState<string[] | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void supabase
      .from("menerio_integration" as any)
      .select("sync_artifact_types")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Menerio integration load error:", error);
          setSyncTypes(null);
          return;
        }
        const row = data as { sync_artifact_types?: string[] | null } | null;
        setSyncTypes(row ? (row.sync_artifact_types ?? []) : null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, revision]);

  const selected = TYPES.filter((t) => syncTypes?.includes(t));

  // Counted with two head requests per table: the old count read the rows
  // themselves, and PostgREST returns at most 1000 of them.
  const fetchStats = useCallback(async () => {
    if (!user) return;
    const results: Partial<StatsMap> = {};

    const queries = TABLES.map(async (table, i) => {
      const [all, linked] = await Promise.all([
        (supabase.from(table) as any)
          .select("id", { count: "exact", head: true })
          .eq("author_id", user.id),
        (supabase.from(table) as any)
          .select("id", { count: "exact", head: true })
          .eq("author_id", user.id)
          .eq("menerio_synced", true),
      ]);
      results[TYPES[i]] = { total: all.count ?? 0, synced: linked.count ?? 0 };
    });

    await Promise.all(queries);
    setStats(results as StatsMap);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleBulkSync = async () => {
    if (!user || selected.length === 0) return;
    setSyncing(true);

    try {
      const toSync: { type: string; id: string }[] = [];

      for (let i = 0; i < TABLES.length; i++) {
        if (!selected.includes(TYPES[i])) continue;
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

      const { data: inserted, error: insertError } = await supabase
        .from("menerio_sync_queue")
        .insert(queueEntries)
        .select("id");

      if (insertError) throw insertError;

      // Poll only the rows this run created. Filtering by artifact id also
      // matched the completed rows of earlier syncs, so a second bulk sync
      // reported "complete" at its first poll.
      const queueIds = (inserted ?? []).map((row) => row.id);

      let completed = 0;
      const maxPolls = 120;
      let polls = 0;
      let lastRows: { status: string; error_message: string | null }[] = [];

      while (completed < toSync.length && polls < maxPolls) {
        await new Promise((r) => setTimeout(r, 5000));
        polls++;

        const { data: queueData } = await supabase
          .from("menerio_sync_queue")
          .select("status, error_message")
          .eq("user_id", user.id)
          .in("id", queueIds);

        if (queueData) {
          lastRows = queueData;
          const done = queueData.filter(
            (q: any) => q.status === "completed" || q.status === "failed",
          ).length;
          // Anything not finished is still outstanding. Naming the in-flight
          // states here meant the counter silently stalled when the worker
          // gained delete_processing (finding M4).
          const outstanding = queueData.filter(
            (q: any) => q.status !== "completed" && q.status !== "failed",
          ).length;
          completed = Math.max(done, toSync.length - outstanding);
          setProgress({ current: completed, total: toSync.length });
        }

        if (
          queueData &&
          queueData.every(
            (q: any) => q.status === "completed" || q.status === "failed",
          )
        ) {
          break;
        }
      }

      await fetchStats();
      const result = syncRunMessage(summariseSyncRun(lastRows, toSync.length));
      if (result.ok) toast.success(result.text);
      else toast.error(result.text);
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

      const results = await Promise.all(
        TABLES.map((table) =>
          (supabase.from(table) as any)
            .update(resetPayload)
            .eq("author_id", user.id),
        ),
      );
      // A refused update comes back as { error }, not as a thrown error, so
      // each table's answer is checked before saying the links are gone.
      const failedTables = TABLES.filter((_, i) => results[i]?.error);

      await fetchStats();
      if (failedTables.length > 0) {
        console.error(
          "Menerio reset failed for:",
          failedTables,
          results.map((r) => (r as { error?: unknown })?.error).filter(Boolean),
        );
        toast.error(
          "Some Menerio links could not be removed. Please try again.",
        );
      } else {
        toast.success("All Menerio links have been removed.");
      }
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to reset");
    } finally {
      setResetting(false);
    }
  };

  if (!user || syncTypes === undefined) return null;

  const totalArtifacts = stats
    ? selected.reduce((s, t) => s + stats[t].total, 0)
    : 0;
  const totalSynced = stats
    ? selected.reduce((s, t) => s + stats[t].synced, 0)
    : 0;
  // "Remove all syncs" clears the links of every type, so it counts them all.
  const linkedCount = stats
    ? Object.values(stats).reduce((s, v) => s + v.synced, 0)
    : 0;
  const anyLinked = linkedCount > 0;

  const resetControl = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={syncing || resetting || !anyLinked}
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
          <AlertDialogTitle>Remove all Menerio links?</AlertDialogTitle>
          <AlertDialogDescription>
            The notes in Menerio will remain, but they will no longer be
            automatically updated. You can re-sync at any time.
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
  );

  // No active connection: syncing is impossible, but artifacts synced before
  // a disconnect still carry menerio_synced and menerio_note_id, because
  // disconnecting leaves them. This card used to vanish with the connection
  // and took "Remove all syncs" with it, so those marks could not be cleared
  // at all (2026-10-07). The reset stays for as long as anything is linked.
  if (!syncTypes) {
    if (!anyLinked) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Unlink className="h-5 w-5" />
            Menerio links
          </CardTitle>
          <CardDescription>
            {linkedCount === 1
              ? "1 artifact is"
              : `${linkedCount} artifacts are`}{" "}
            still marked as synced with Menerio from an earlier connection.
            Remove the links to clear those marks.
          </CardDescription>
        </CardHeader>
        <CardContent>{resetControl}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync all artifacts
        </CardTitle>
        <CardDescription>
          Sync all your artifacts of the types chosen above with Menerio at
          once. Already synced artifacts will be updated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {selected.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No artifact type is chosen for syncing. Choose at least one in
                the Menerio settings above and save them.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selected.map((type) => (
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
              <Button
                onClick={handleBulkSync}
                disabled={syncing || resetting || selected.length === 0}
              >
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

              {resetControl}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
