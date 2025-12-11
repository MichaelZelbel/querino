import { useParams, Link } from "react-router-dom";
import { Activity as ActivityIcon, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserActivityFeed } from "@/hooks/useActivityEvents";
import { useAuth } from "@/hooks/useAuth";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function UserActivity() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  // Fetch user profile by display_name
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-by-username", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("display_name", username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const isOwnProfile = user?.id === profile?.id;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserActivityFeed(profile?.id || "", isOwnProfile);

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
            <h1 className="text-2xl font-bold text-foreground mb-2">User not found</h1>
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
            to={`/u/${username}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {profile.display_name}'s Activity
              </h1>
              <p className="text-muted-foreground">
                {isOwnProfile ? "Your recent activity" : "Public activity from this user"}
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
              emptyMessage={isOwnProfile 
                ? "You haven't performed any activity yet" 
                : "No public activity from this user yet"
              }
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
