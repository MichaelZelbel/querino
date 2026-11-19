import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount } from "@/components/shared/formatDate";
import { useItemStats } from "@/hooks/useItemStats";
import type { ItemStatsSummary, UsageItemType } from "@/lib/itemStats";
import { LLM_OPTIONS } from "@/lib/openLLM";

interface ItemStatsPanelProps {
  itemType: UsageItemType;
  itemId: string;
  isPublic: boolean;
  /** A prompt kit has no send buttons, so its send rows would only ever say 0. */
  showSends?: boolean;
}

interface StatsRow {
  label: string;
  value: (summary: ItemStatsSummary) => number;
}

/** The author's Stats tab: last 7 and 30 days of views, sends, copies and link clicks. */
export function ItemStatsPanel({
  itemType,
  itemId,
  isPublic,
  showSends = true,
}: ItemStatsPanelProps) {
  const { data, isLoading, isError } = useItemStats(itemType, itemId, true);

  const rows: StatsRow[] = [
    { label: "Page views", value: (s) => s.views },
    ...(showSends
      ? LLM_OPTIONS.map((option) => ({
          label: `Sent to ${option.name}`,
          value: (s: ItemStatsSummary) => s.sends[option.id],
        }))
      : []),
    { label: "Copies (incl. Download .md)", value: (s) => s.copies },
    { label: "Link clicks", value: (s) => s.clicks },
  ];

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError || !data ? (
        <p className="text-sm text-muted-foreground">
          The numbers could not be loaded. Please try again later.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead className="text-right">Last 7 days</TableHead>
              <TableHead className="text-right">Last 30 days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCount(row.value(data.last7))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCount(row.value(data.last30))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <p className="text-xs text-muted-foreground">
        Your own visits, copies and sends are not counted. Daily numbers are
        kept for 400 days.
        {!isPublic && " This item is private, so nothing is counted."}
      </p>
    </div>
  );
}
