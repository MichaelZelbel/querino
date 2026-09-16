import { useEffect } from "react";
import { useNavigate, useSearchParams } from "@/lib/router-compat";
import { useAuthContext } from "@/contexts/AuthContext";
import { draftUrl } from "@/lib/draftHandoff";
import { Loader2 } from "lucide-react";

/**
 * Landing page for Menerio's "New Prompt (Querino)" button.
 * Reads query params and redirects to /prompts/new with pre-filled data.
 * If not authenticated, redirects to /auth first.
 */
export default function CreateFromMenerio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;

    // Build the full query string to preserve for /prompts/new
    const title = searchParams.get("title") || "";
    const body = searchParams.get("body") || "";
    const menerioNoteId = searchParams.get("menerio_note_id") || "";
    const menerioCallback = searchParams.get("menerio_callback") || "";
    const entityType = searchParams.get("entity_type") || "prompt";

    if (!user) {
      // Redirect to auth, preserving the full create-from-menerio URL as return path
      const returnUrl = `/create-from-menerio?${searchParams.toString()}`;
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`, {
        replace: true,
      });
      return;
    }

    // User is authenticated — redirect to prompt editor with pre-filled data
    // The note body goes through sessionStorage, not ?content= (see
    // draftHandoff); the Menerio ids stay in the URL, PromptNew reads them there.
    const targetUrl = draftUrl(
      "/prompts/new",
      { title, content: body },
      {
        menerio_note_id: menerioNoteId,
        menerio_callback: menerioCallback,
        entity_type: entityType,
      },
    );

    navigate(targetUrl, { replace: true });
  }, [user, loading, navigate, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Preparing your prompt…</p>
      </div>
    </main>
  );
}
