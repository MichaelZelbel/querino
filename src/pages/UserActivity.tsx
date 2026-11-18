import { useParams, Link } from "@/lib/router-compat";
import { Activity as ActivityIcon, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserActivityFeed } from "@/hooks/useActivityEvents";
import { useAuthContext } from "@/contexts/AuthContext";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { useQuery } from "@tanstack/react-query";
import { findProfileByName } from "@/lib/route-loaders";

export default function UserActivity() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthContext();

  // Fetch user profile by display_name
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-by-username", username],
    // The same lookup as the profile page: an address in other letter case
    // than the stored name finds that profile too (#25). This page is noindex,
    // so it shows the profile instead of sending the address on.
    // enabled: !!username below is what guarantees username is set.
    queryFn: async () => (await findProfileByName(username!))?.profile ?? null,
    enabled: !!username,
  });

  const isOwnProfile = user?.id === profile?.id;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useUserActivityFeed(profile?.id || "", isOwnProfile);

  const events = data?.pages.flat() || [];

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              User not found
            </h1>
            <p className="text-muted-foreground">
              The user "{username}" doesn't exist.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link
            to={`/u/${encodeURIComponent(profile.display_name || username || "")}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={profile.display_name || "User"}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {profile.display_name}'s Activity
              </h1>
              <p className="text-muted-foreground">
                {isOwnProfile
                  ? "Your recent activity"
                  : "Activity is private to each account"}
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          {isOwnProfile ? (
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <ActivityTimeline
                events={events}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage ?? false}
                fetchNextPage={fetchNextPage}
                emptyMessage="You haven't performed any activity yet"
              />
            </div>
          ) : (
            // This page told every visitor "No public activity from this user
            // yet", on every profile, always. There is no public activity:
            // row-level security returns another person's events to nobody, and
            // the events themselves carry the ids of artifacts that are mostly
            // private. Saying it plainly beats implying the person does nothing.
            <div className="border border-border rounded-lg bg-card p-8 text-center">
              <p className="text-muted-foreground">
                {profile.display_name} keeps their activity to themselves, as
                everyone here does. Their published prompts, skills and
                workflows are on their profile.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
