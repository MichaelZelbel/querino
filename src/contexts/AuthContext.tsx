import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { settleCoachChats } from "@/lib/coachChats";
import type { Profile } from "@/types/profile";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithGithub: () => Promise<{ error: Error | null }>;
  /** This browser only unless `scope` is "global" (every device). */
  signOut: (scope?: "local" | "global") => Promise<{ error: Error | null }>;
  /** Re-read the signed-in user's profile (after editing it). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The AI coach chats on disk belong to one account: they go when it signs out
 * here (or in another tab, which supabase-js reports to this one) and when a
 * different account signs in (coachChats.ts).
 */
function useCoachChatsFollowAccount(userId: string | null, known: boolean) {
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!known) return;
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (previous === userId) return;
    settleCoachChats(userId, previous);
  }, [userId, known]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  // `loading` waits for the profile too; the account is known once there is a
  // user, or once loading ends without one.
  useCoachChatsFollowAccount(
    auth.user?.id ?? null,
    !!auth.user || !auth.loading,
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
