import { Activity as ActivityIcon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useOwnActivityFeed } from "@/hooks/useActivityEvents";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";

export default function Activity() {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOwnActivityFeed(user?.id);

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
              <h1 className="text-3xl font-bold text-foreground">Your activity</h1>
              <p className="text-muted-foreground">
                Everything you have done across your prompts, skills and workflows
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          {user ? (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <ActivityTimeline
                events={events}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage ?? false}
                fetchNextPage={fetchNextPage}
                emptyMessage="Nothing here yet. Your activity shows up as you create and work on things."
              />
            </div>
          ) : (
            // This page used to show a logged-out visitor an empty list under
            // the words "see what's happening across the Querino community",
            // because the query it ran could only ever return the caller's own
            // rows. Activity is private, so say so.
            <div className="border border-border rounded-lg bg-card p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Activity is private to each account. Sign in to see yours.
              </p>
              <Link
                to="/auth?redirect=/activity"
                className="text-primary underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
