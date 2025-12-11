import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Activity } from "lucide-react";
import { ActivityEventCard } from "./ActivityEventCard";
import type { ActivityEventWithActor } from "@/types/activity";

interface ActivityTimelineProps {
  events: ActivityEventWithActor[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  showItemLink?: boolean;
  emptyMessage?: string;
}

export function ActivityTimeline({
  events,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  showItemLink = true,
  emptyMessage = "No activity yet",
}: ActivityTimelineProps) {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {events.map((event) => (
        <ActivityEventCard 
          key={event.id} 
          event={event} 
          showItemLink={showItemLink}
        />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasNextPage && events.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No more activity to load
        </div>
      )}
    </div>
  );
}
