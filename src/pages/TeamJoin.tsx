import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { redeemTeamInvite } from "@/hooks/useTeamInvites";

type JoinState =
  | { kind: "confirm" }
  | { kind: "joining" }
  | { kind: "joined"; teamId: string; teamName: string }
  | { kind: "error"; message: string };

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : "Failed to join team";
  if (message.includes("expired")) {
    return "This invite link has expired. Ask a team admin for a new one.";
  }
  if (message.includes("not found")) {
    return "This invite link is invalid or has been revoked.";
  }
  return message;
}

/**
 * An invite link never joins on its own: opening a link someone sent you
 * must not silently add you to their team. The team's name is not readable
 * before joining (teams are only visible to their members), so the prompt
 * names it once the invite has been redeemed.
 */
export default function TeamJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { user, loading: authLoading } = useAuthContext();
  const { switchWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [state, setState] = useState<JoinState>({ kind: "confirm" });

  useEffect(() => {
    if (authLoading || !token || user) return;
    navigate(
      `/auth?redirect=${encodeURIComponent(`/team/join?token=${encodeURIComponent(token)}`)}`,
      { replace: true },
    );
  }, [authLoading, user, token, navigate]);

  const handleJoin = async () => {
    if (state.kind === "joining") return;
    setState({ kind: "joining" });
    try {
      const result = await redeemTeamInvite(token);
      await queryClient.invalidateQueries({ queryKey: ["user-teams"] });
      toast.success(`You joined ${result.team_name}`);
      setState({
        kind: "joined",
        teamId: result.team_id,
        teamName: result.team_name,
      });
    } catch (err) {
      setState({ kind: "error", message: friendlyError(err) });
    }
  };

  const goToTeam = (teamId: string) => {
    switchWorkspace(teamId);
    navigate("/library", { replace: true });
  };

  const missingToken = !token;
  const waiting = authLoading || (!user && !missingToken);

  let body: React.ReactNode;
  if (missingToken || state.kind === "error") {
    body = (
      <>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Couldn't join team
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          {missingToken
            ? "This invite link is missing its token."
            : state.kind === "error"
              ? state.message
              : null}
        </p>
        <div className="flex justify-center gap-2">
          {!missingToken && (
            <Button variant="outline" onClick={handleJoin}>
              Try again
            </Button>
          )}
          <Button onClick={() => navigate("/library")}>Go to My Library</Button>
        </div>
      </>
    );
  } else if (waiting) {
    body = <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />;
  } else if (state.kind === "joined") {
    body = (
      <>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          You joined {state.teamName}
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          You are still in your current workspace. Switch whenever you like.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => navigate("/library")}>
            Stay here
          </Button>
          <Button onClick={() => goToTeam(state.teamId)}>
            Go to team workspace
          </Button>
        </div>
      </>
    );
  } else {
    const joining = state.kind === "joining";
    body = (
      <>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Join this team?
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          Someone sent you an invite to a team on Querino. Joining makes you a
          member who can see and work on the team's shared artifacts. Only join
          if you trust the person who sent you this link.
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={joining}
            onClick={() => navigate("/library")}
          >
            Cancel
          </Button>
          <Button disabled={joining} onClick={handleJoin}>
            {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join team
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="text-center">{body}</div>
      </main>
      <Footer />
    </div>
  );
}
