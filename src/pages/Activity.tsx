import { Activity as ActivityIcon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useGlobalActivityFeed } from "@/hooks/useActivityEvents";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";

export default function Activity() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGlobalActivityFeed();

  const events = data?.pages.flat() || [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ActivityIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Activity Feed</h1>
              <p className="text-muted-foreground">
                See what's happening across the Querino community
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <ActivityTimeline
              events={events}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage ?? false}
              fetchNextPage={fetchNextPage}
              emptyMessage="No public activity yet. Be the first to create something!"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
