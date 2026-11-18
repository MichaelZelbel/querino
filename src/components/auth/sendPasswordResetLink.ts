import { siteOrigin } from "@/config/site";

/**
 * Asks Supabase to mail a password recovery link to `email`.
 *
 * The one place the app calls resetPasswordForEmail: the sign-in form's
 * "Forgot password?", Settings and /reset-password all go through here, so the
 * link always lands on /reset-password (the page that asks for the new
 * password). Pointing it anywhere else only signs the user in and leaves the
 * old password in place.
 *
 * The client is imported on demand because the sign-in page loads it lazily.
 */
export async function sendPasswordResetLink(
  email: string,
): Promise<{ error: Error | null }> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteOrigin()}/reset-password`,
  });
  return { error };
}
