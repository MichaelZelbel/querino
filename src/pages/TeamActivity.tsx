import { useParams, Navigate, Link } from "react-router-dom";
import { Activity as ActivityIcon, ArrowLeft, Settings } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useActivityEvents } from "@/hooks/useActivityEvents";
import { useTeam, useCurrentUserTeamRole } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";

export default function TeamActivity() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: userRole, isLoading: roleLoading } = useCurrentUserTeamRole(id);
  
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useActivityEvents({ teamId: id });

  const events = data?.pages.flat() || [];

  if (authLoading || teamLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userRole) {
    return <Navigate to="/library" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link 
            to={`/team/${id}/settings`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Team Settings
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <ActivityIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {team?.name || "Team"} Activity
                </h1>
                <p className="text-muted-foreground">
                  Recent activity within your team
                </p>
              </div>
            </div>

            <Button variant="outline" asChild>
              <Link to={`/team/${id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>

          {/* Activity Timeline */}
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <ActivityTimeline
              events={events}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage ?? false}
              fetchNextPage={fetchNextPage}
              emptyMessage="No team activity yet. Start creating prompts, skills, or workflows!"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
