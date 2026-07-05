import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Loader2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { redeemTeamInvite } from "@/hooks/useTeamInvites";

export default function TeamJoin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { user, loading: authLoading } = useAuthContext();
  const { switchWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const redeeming = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setError("This invite link is missing its token.");
      return;
    }

    if (!user) {
      navigate(
        `/auth?redirect=${encodeURIComponent(`/team/join?token=${encodeURIComponent(token)}`)}`,
        { replace: true }
      );
      return;
    }

    if (redeeming.current) return;
    redeeming.current = true;

    (async () => {
      try {
        const result = await redeemTeamInvite(token);
        await queryClient.invalidateQueries({ queryKey: ["user-teams"] });
        switchWorkspace(result.team_id);
        toast.success(`Welcome to ${result.team_name}!`);
        navigate("/library", { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to join team";
        setError(
          message.includes("expired")
            ? "This invite link has expired. Ask a team admin for a new one."
            : message.includes("not found")
              ? "This invite link is invalid or has been revoked."
              : message
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title="Join Team" noIndex />
      <Header />
      <main className="flex flex-1 items-center justify-center py-20">
        <div className="text-center">
          {error ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">Couldn't join team</h1>
              <p className="mb-6 max-w-md text-muted-foreground">{error}</p>
              <Button onClick={() => navigate("/library")}>Go to My Library</Button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">Joining team…</h1>
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
