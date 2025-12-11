import { Activity } from "lucide-react";
import { useActivityEvents } from "@/hooks/useActivityEvents";
import { ActivityTimeline } from "./ActivityTimeline";

interface ActivitySidebarProps {
  itemId: string;
  itemType: "prompt" | "skill" | "workflow" | "collection";
}

export function ActivitySidebar({ itemId, itemType }: ActivitySidebarProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useActivityEvents({ itemId, itemType, limit: 10 });

  const events = data?.pages.flat() || [];

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
          emptyMessage="No activity for this item yet"
        />
      </div>
    </div>
  );
}
