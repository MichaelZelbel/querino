import { useEffect } from "react";
import { Activity } from "lucide-react";
import { useActivityEvents } from "@/hooks/useActivityEvents";
import { ActivityTimeline } from "./ActivityTimeline";

type ActivityItemType =
  "prompt" | "skill" | "workflow" | "collection" | "prompt_kit";

interface ActivitySidebarProps {
  itemId: string;
  itemType: ActivityItemType;
  /** Told whether the item has no activity, once the first page has loaded. */
  onEmptyChange?: (isEmpty: boolean) => void;
  /** Render nothing at all when the item has no activity. */
  hideWhenEmpty?: boolean;
}

/**
 * Whether an item has any activity, from the same cached query the sidebar
 * uses, so a detail page can hide its Activity tab without a second request.
 * `isEmpty` stays false while loading, so a tab does not flicker away.
 */
export function useItemActivityIsEmpty(
  itemId: string | undefined,
  itemType: ActivityItemType,
) {
  const { data, isLoading } = useActivityEvents({
    itemId,
    itemType,
    limit: 10,
    enabled: !!itemId,
  });
  const count = data?.pages.flat().length ?? 0;
  return { isEmpty: !isLoading && !!data && count === 0, isLoading };
}

export function ActivitySidebar({
  itemId,
  itemType,
  onEmptyChange,
  hideWhenEmpty = false,
}: ActivitySidebarProps) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useActivityEvents({ itemId, itemType, limit: 10 });

  const events = data?.pages.flat() || [];
  const isEmpty = !isLoading && !!data && events.length === 0;

  useEffect(() => {
    if (!isLoading && data) onEmptyChange?.(isEmpty);
  }, [isLoading, data, isEmpty, onEmptyChange]);

  if (isEmpty) {
    if (hideWhenEmpty) return null;
    return (
      <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4" aria-hidden="true" />
        No activity yet.
      </p>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Activity</h3>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        <ActivityTimeline
          events={events}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage ?? false}
          fetchNextPage={fetchNextPage}
          showItemLink={false}
          emptyMessage="No activity yet."
        />
      </div>
    </div>
  );
}
