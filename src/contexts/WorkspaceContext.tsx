import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { safeStorage } from "@/lib/safeStorage";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserTeams } from "@/hooks/useTeams";
import type { TeamWithRole } from "@/types/team";

interface WorkspaceContextType {
  currentWorkspace: "personal" | string; // string = team ID
  currentTeam: TeamWithRole | null;
  teams: TeamWithRole[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: "personal" | string) => void;
  isTeamWorkspace: boolean;
  canManageTeam: boolean; // owner or admin
  canPublish: boolean; // owner or admin only
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

const WORKSPACE_STORAGE_KEY = "querino_current_workspace";
const NO_TEAMS: TeamWithRole[] = [];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const { data: teamsData, isLoading } = useUserTeams();
  // A stable empty list while loading: a fresh [] each render would defeat the
  // memoised context value below.
  const teams = teamsData ?? NO_TEAMS;
  // The user id seen on the previous render, so a real logout (a user that
  // WAS there and is now gone) can be told apart from the first render, when
  // auth has not resolved yet and `user` is null for everyone.
  const previousUserIdRef = useRef<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<"personal" | string>(
    "personal",
  );

  // Load saved workspace on mount
  useEffect(() => {
    const saved = safeStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (saved && saved !== "personal") {
      setCurrentWorkspace(saved);
    }
  }, []);

  // Validate workspace once the signed-in user's teams are known. Before auth
  // resolves, useUserTeams answers [] for a null user, which used to look like
  // "the saved team no longer exists" and wiped the saved workspace on every
  // page load.
  useEffect(() => {
    if (authLoading || !user) return;
    if (!isLoading && currentWorkspace !== "personal") {
      const teamExists = teams.some((t) => t.id === currentWorkspace);
      if (!teamExists) {
        setCurrentWorkspace("personal");
        safeStorage.setItem(WORKSPACE_STORAGE_KEY, "personal");
      }
    }
  }, [teams, isLoading, currentWorkspace, authLoading, user]);

  // Reset to personal on a real logout: a user that was there and is now gone.
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = user?.id ?? null;
    if (previousUserId && !user) {
      setCurrentWorkspace("personal");
      safeStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
  }, [user]);

  const switchWorkspace = useCallback((workspaceId: "personal" | string) => {
    setCurrentWorkspace(workspaceId);
    safeStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
  }, []);

  const currentTeam =
    currentWorkspace === "personal"
      ? null
      : teams.find((t) => t.id === currentWorkspace) || null;

  const isTeamWorkspace = currentWorkspace !== "personal";
  const canManageTeam =
    currentTeam?.role === "owner" || currentTeam?.role === "admin";
  const canPublish =
    currentTeam?.role === "owner" || currentTeam?.role === "admin";

  // Memoised so the many useWorkspace() consumers re-render only when the
  // workspace really changes, not on every render of this provider.
  const value = useMemo<WorkspaceContextType>(
    () => ({
      currentWorkspace,
      currentTeam,
      teams,
      isLoading,
      switchWorkspace,
      isTeamWorkspace,
      canManageTeam,
      canPublish,
    }),
    [
      currentWorkspace,
      currentTeam,
      teams,
      isLoading,
      switchWorkspace,
      isTeamWorkspace,
      canManageTeam,
      canPublish,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
