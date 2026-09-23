import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { AuthChangeEvent, User, Session } from "@supabase/supabase-js";
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

async function checkOAuthSignupAllowed(authUser: User) {
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
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();

  // The signed-in user id as last seen by this hook. undefined means "not known
  // yet" (before the first auth answer), so the first answer is never mistaken
  // for an account change.
  const currentUserIdRef = useRef<string | null | undefined>(undefined);
  // The user id whose profile has been requested, so the startup pair of
  // answers (the INITIAL_SESSION event and getSession) fetches it once.
  const profileRequestedForRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async (userId: string) => {
      try {
        // role / plan_type / plan_source are column-restricted in the database
        // (they must not leak to team-mates), so they come from the
        // get_my_plan() RPC which only ever returns the caller's own row. The
        // five GitHub sync columns took the same route on 2026-09-16: they were
        // readable on every published author's row by any signed-in user.
        const [{ data, error }, { data: planRows }, { data: githubRows }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select(
                "id, display_name, avatar_url, bio, website, twitter, github, created_at, updated_at",
              )
              .eq("id", userId)
              .maybeSingle(),
            supabase.rpc("get_my_plan"),
            supabase.rpc("get_my_github_settings"),
          ]);

        // The account changed (or the component went away) while this was in
        // flight: the reply belongs to someone who is no longer signed in, and
        // the newer request owns the profile and the loading flag.
        if (cancelled || currentUserIdRef.current !== userId) return;

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          const plan = (planRows as MyPlanRow[] | null)?.[0] ?? {};
          const github = githubRows?.[0] ?? {};
          setProfile(
            data ? ({ ...data, ...github, ...plan } as Profile) : null,
          );
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (!cancelled && currentUserIdRef.current === userId) {
          setLoading(false);
        }
      }
    };

    const applySession = (
      event: AuthChangeEvent | "GET_SESSION",
      nextSession: Session | null,
    ) => {
      const nextUser = nextSession?.user ?? null;
      const nextId = nextUser?.id ?? null;
      const previousId = currentUserIdRef.current;
      currentUserIdRef.current = nextId;

      // supabase-js re-emits SIGNED_IN whenever the tab becomes visible again,
      // and TOKEN_REFRESHED hourly, each time with a fresh user object. A new
      // object here re-ran every effect keyed on `user` and made the edit
      // pages reload their record, wiping unsaved edits. Same account, same
      // updated_at: keep the object React already has.
      setUser((prev) =>
        prev?.id === nextUser?.id && prev?.updated_at === nextUser?.updated_at
          ? prev
          : nextUser,
      );
      setSession((prev) =>
        prev?.access_token === nextSession?.access_token &&
        prev?.user?.id === nextSession?.user?.id
          ? prev
          : nextSession,
      );

      // A different account (or none) from the one the caches were filled
      // for. Several query keys do not carry a user id ("team-members",
      // "team_invites", "blog-posts", "collections"), and route loaders cache
      // per URL, so without this the next person on the same browser saw the
      // previous account's rows until each one refetched.
      if (previousId !== undefined && previousId !== nextId) {
        queryClient.clear();
        router.clearCache();
        void router.invalidate();
      }

      if (nextUser) {
        if (
          profileRequestedForRef.current !== nextId ||
          event === "USER_UPDATED"
        ) {
          profileRequestedForRef.current = nextId;
          // Deferred: calling Supabase inside the auth callback can deadlock.
          setTimeout(() => {
            void fetchProfile(nextUser.id);
          }, 0);
        }

        // Post-login check for OAuth signups that exceeded the cap
        if (event === "SIGNED_IN" && previousId !== nextId) {
          setTimeout(() => {
            void checkOAuthSignupAllowed(nextUser);
          }, 0);
        }
      } else {
        profileRequestedForRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(event, nextSession);
    });

    // THEN check for existing session. Usually INITIAL_SESSION has already
    // answered with the same session, and applySession then changes nothing.
    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      if (!cancelled) applySession("GET_SESSION", nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [queryClient, router]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
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

      // Back to /auth, where the path saved at sign-up (a team invite, a prompt
      // they were about to save) is restored, the way OAuth sign-in does it.
      const redirectUrl = `${window.location.origin}/auth`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      return { error };
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    return { error };
  }, []);

  const signInWithGithub = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    // The SIGNED_OUT event above already empties the caches. This stays for a
    // failed signOut that emits no event: the person pressed "sign out" and
    // must not keep seeing the account's rows.
    queryClient.clear();
    return { error };
  }, [queryClient]);

  // One object per real change, so the auth context does not hand every
  // consumer a new value (and a re-render) each time the provider renders.
  return useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithGithub,
      signOut,
    }),
    [
      user,
      session,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithGithub,
      signOut,
    ],
  );
}
