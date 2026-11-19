import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { recordItemView } from "@/lib/itemUsage";
import {
  ITEM_STATS_COLUMNS,
  type ItemStatsDay,
  type UsageItemType,
  sumItemStats,
  summarizeByItem,
  utcDay,
  windowStart,
} from "@/lib/itemStats";

// item_stats_daily is not in the generated types until the migration is live
// and the types are regenerated.
const untyped = supabase as unknown as SupabaseClient;

const PAGE = 1000;

/**
 * Reports one page view per item the page shows; record_item_view decides
 * whether it counts. It waits until the session is known, so an author whose
 * session is still loading is not reported as a signed-out visitor.
 */
export function useRecordItemView(
  itemType: UsageItemType,
  itemId: string,
): void {
  const { user, loading } = useAuthContext();
  const known = !!user || !loading;
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (!known || counted.current === itemId) return;
    counted.current = itemId;
    recordItemView(itemType, itemId);
  }, [known, itemType, itemId]);
}

/** One item's numbers for the last 7 and 30 days. Row-level security shows them to the author only. */
export function useItemStats(
  itemType: UsageItemType,
  itemId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["item-stats", itemType, itemId],
    enabled,
    queryFn: async () => {
      const today = utcDay(new Date());
      const { data, error } = await untyped
        .from("item_stats_daily")
        .select(ITEM_STATS_COLUMNS)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .gte("day", windowStart(today, 30));
      if (error) throw error;
      const rows = (data ?? []) as ItemStatsDay[];
      return {
        last7: sumItemStats(rows, today, 7),
        last30: sumItemStats(rows, today, 30),
      };
    },
  });
}

/** The last 30 days of every item the signed-in person wrote, keyed by itemStatsKey. */
export function useOwnItemStats(enabled: boolean) {
  return useQuery({
    queryKey: ["item-stats", "own"],
    enabled,
    queryFn: async () => {
      const today = utcDay(new Date());
      const rows: ItemStatsDay[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await untyped
          .from("item_stats_daily")
          .select(ITEM_STATS_COLUMNS)
          .gte("day", windowStart(today, 30))
          .order("item_type")
          .order("item_id")
          .order("day")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const page = (data ?? []) as ItemStatsDay[];
        rows.push(...page);
        if (page.length < PAGE) break;
      }
      return summarizeByItem(rows, today, 30);
    },
  });
}
