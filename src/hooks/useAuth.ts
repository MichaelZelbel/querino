import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Profile } from "@/types/profile";

/** One row from the get_my_plan() RPC, which is how role and plan_type are
 * read now that they are no longer selectable off the profiles table. */
interface MyPlanRow {
  role: string | null;
  plan_type: string | null;
  plan_source: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Defer profile fetch to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);

        // Post-login check for OAuth signups that exceeded the cap
        if (event === "SIGNED_IN") {
          setTimeout(() => {
            checkOAuthSignupAllowed(session.user);
          }, 0);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOAuthSignupAllowed = async (authUser: User) => {
    try {
      // Only check for new accounts (created within the last 60 seconds)
      const createdAt = new Date(authUser.created_at).getTime();
      const now = Date.now();
      if (now - createdAt > 60_000) return; // existing user, skip

      const { data, error } = await supabase.rpc("check_signup_allowed");
      if (error) {
        console.error("Error checking signup cap:", error);
        return;
      }

      const result = data as unknown as {
        allowed: boolean;
        current_count: number;
        max_count: number;
      };
      if (result && !result.allowed) {
        toast.error(
          "We've reached our early access limit. Join the waitlist at support@querino.ai.",
          { duration: 8000 },
        );
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Error in OAuth signup check:", err);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      // role / plan_type / plan_source are column-restricted in the database
      // (they must not leak to team-mates), so they come from the
      // get_my_plan() RPC which only ever returns the caller's own row.
      const [{ data, error }, { data: planRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, display_name, avatar_url, bio, website, twitter, github, created_at, updated_at, github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabase.rpc("get_my_plan"),
      ]);

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        const plan = (planRows as MyPlanRow[] | null)?.[0] ?? {};
        setProfile(data ? ({ ...data, ...plan } as Profile) : null);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    // Check signup cap before attempting registration
    const { data: capCheck, error: capError } = await supabase.rpc(
      "check_signup_allowed",
    );
    if (capError) {
      return {
        error: new Error(
          "Unable to verify signup availability. Please try again.",
        ),
      };
    }
    const capResult = capCheck as unknown as {
      allowed: boolean;
      current_count: number;
      max_count: number;
    };
    if (capResult && !capResult.allowed) {
      return {
        error: new Error(
          "We've reached our early access limit. Join the waitlist at support@querino.ai.",
        ),
      };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    return { error };
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    signOut,
  };
}
