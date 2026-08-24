import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type CallerBucket = "free" | "premium" | "admin" | "machine";

interface CallerUsage {
  caller: CallerBucket;
  calls: number;
  total_tokens: number;
  users: number;
}

interface SourceUsage {
  source: string;
  calls: number;
}

interface CallSiteUsage {
  call_site: string;
  calls: number;
  total_tokens: number;
  /** False means the name exists only in the ledger's history. See the note below. */
  is_configured: boolean;
  by_caller: CallerUsage[];
  by_source: SourceUsage[];
}

interface UsageResponse {
  call_sites: CallSiteUsage[];
  totals: {
    calls: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    credits: number;
  };
  by_caller: CallerUsage[];
}

/**
 * What each caller bucket is called on screen, and why it is its own bucket.
 *
 * "Admin" is separate from "Paying" on purpose. The routing layer folds admins
 * in with premium, which is right for choosing a model and wrong here: on this
 * page an admin is the operator testing his own app, and counting that as paid
 * usage would report a thriving paid tier that does not exist.
 */
const CALLER_LABEL: Record<CallerBucket, string> = {
  free: "Free",
  premium: "Paying",
  admin: "Admin",
  machine: "Machine",
};

const CALLER_VARIANT: Record<
  CallerBucket,
  "default" | "secondary" | "outline"
> = {
  free: "secondary",
  premium: "default",
  admin: "outline",
  machine: "outline",
};

const WINDOWS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "0", label: "All time" },
];

/** The free-call volume per month that would reopen the tiering decision. */
const TIERING_THRESHOLD_CALLS_PER_MONTH = 40000;

function num(n: number): string {
  return n.toLocaleString();
}

export default function LLMUsagePanel() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [usage, setUsage] = useState<UsageResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "admin-llm-config",
          {
            body: { action: "usage", days: Number(days) },
          },
        );
        if (error) throw error;
        if (!cancelled) setUsage(data as UsageResponse);
      } catch (e) {
        if (!cancelled) {
          toast.error("Failed to load AI usage", {
            description: (e as Error).message,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const headline = useMemo(() => {
    if (!usage) return null;
    const free = usage.by_caller.find((c) => c.caller === "free");
    const paying = usage.by_caller.find((c) => c.caller === "premium");
    const total = usage.totals.total_tokens;
    return {
      freeCalls: free?.calls ?? 0,
      freeTokens: free?.total_tokens ?? 0,
      payingCalls: paying?.calls ?? 0,
      // Guarded rather than divided directly: an empty window is a real state,
      // and NaN% on an admin page is indistinguishable from a broken query.
      share: total === 0 ? 0 : ((free?.total_tokens ?? 0) / total) * 100,
    };
  }, [usage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI usage by call site</CardTitle>
        <CardDescription>
          Which call sites actually spend money, and who spends it. Per-tier
          configuration (cheaper models for free users) was decided against on
          23 August 2026, because free callers had cost half a cent in seven
          months. This is the view that would reverse that decision: roughly{" "}
          {num(TIERING_THRESHOLD_CALLS_PER_MONTH)} free calls a month, or the
          arrival of real paying users. Cost is shown in tokens and credits
          rather than currency, because no price list is stored and a hardcoded
          one goes stale. A row marked <em>not configured</em> spent tokens
          under a name the table above does not carry: either the name the
          earlier logging used for the same work (counted separately, because
          the old and new names cannot be matched up reliably), or a feature
          such as embeddings that does not go through a configurable call site
          at all.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((w) => (
              <SelectItem key={w.value} value={w.value}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : !usage ? null : (
          <>
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              {headline && (
                <p>
                  <strong>Free callers: {num(headline.freeCalls)} calls</strong>{" "}
                  ({num(headline.freeTokens)} tokens,{" "}
                  {headline.share.toFixed(1)}% of everything the app spent in
                  this window). Paying callers: {num(headline.payingCalls)}{" "}
                  calls.
                </p>
              )}
              <p className="mt-1 text-muted-foreground">
                {num(usage.totals.calls)} calls in total,{" "}
                {num(usage.totals.total_tokens)} tokens (
                {num(usage.totals.prompt_tokens)} in,{" "}
                {num(usage.totals.completion_tokens)} out),{" "}
                {usage.totals.credits.toFixed(2)} credits.
              </p>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Call site</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead>Who called it</TableHead>
                    <TableHead>Which row served it</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.call_sites.map((c) => (
                    <TableRow
                      key={c.call_site}
                      className={c.calls === 0 ? "opacity-50" : undefined}
                    >
                      <TableCell className="font-mono text-xs">
                        {c.call_site}
                        {!c.is_configured && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px] font-sans"
                          >
                            not configured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {num(c.calls)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {num(c.total_tokens)}
                      </TableCell>
                      <TableCell>
                        {c.by_caller.length === 0 ? (
                          <span className="text-xs italic text-muted-foreground">
                            Never called
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {c.by_caller.map((b) => (
                              <Badge
                                key={b.caller}
                                variant={CALLER_VARIANT[b.caller]}
                                className="text-[10px]"
                              >
                                {CALLER_LABEL[b.caller]} {num(b.calls)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.by_source.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            not used yet
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {c.by_source.map((s) => (
                              <Badge
                                key={s.source}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {s.source} {num(s.calls)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
