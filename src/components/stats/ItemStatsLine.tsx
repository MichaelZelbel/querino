import { formatCount } from "@/components/shared/formatDate";
import { emptyItemStatsSummary, type ItemStatsSummary } from "@/lib/itemStats";

function count(n: number, one: string, many: string): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}

/**
 * The Library's one row of 30-day totals under each of the person's own items.
 * Render it only once the numbers have loaded: then a missing summary means
 * nothing was counted, and the line shows zeros.
 */
export function ItemStatsLine({
  summary,
}: {
  summary: ItemStatsSummary | undefined;
}) {
  const s = summary ?? emptyItemStatsSummary();
  return (
    <p className="mt-2 px-1 text-xs text-muted-foreground tabular-nums">
      Last 30 days: {count(s.views, "view", "views")} ·{" "}
      {count(s.sendsTotal, "send", "sends")} ·{" "}
      {count(s.copies, "copy", "copies")} · {count(s.clicks, "click", "clicks")}
    </p>
  );
}
