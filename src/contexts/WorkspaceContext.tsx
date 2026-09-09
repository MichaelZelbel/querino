import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const { data: teams = [], isLoading } = useUserTeams();
  // The user id seen on the previous render, so a real logout (a user that
  // WAS there and is now gone) can be told apart from the first render, when
  // auth has not resolved yet and `user` is null for everyone.
  const previousUserIdRef = useRef<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<"personal" | string>(
    "personal",
  );

  // Load saved workspace on mount
  useEffect(() => {
    const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
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
        localStorage.setItem(WORKSPACE_STORAGE_KEY, "personal");
      }
    }
  }, [teams, isLoading, currentWorkspace, authLoading, user]);

  // Reset to personal on a real logout: a user that was there and is now gone.
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = user?.id ?? null;
    if (previousUserId && !user) {
      setCurrentWorkspace("personal");
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
  }, [user]);

  const switchWorkspace = (workspaceId: "personal" | string) => {
    setCurrentWorkspace(workspaceId);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
  };

  const currentTeam =
    currentWorkspace === "personal"
      ? null
      : teams.find((t) => t.id === currentWorkspace) || null;

  const isTeamWorkspace = currentWorkspace !== "personal";
  const canManageTeam =
    currentTeam?.role === "owner" || currentTeam?.role === "admin";
  const canPublish =
    currentTeam?.role === "owner" || currentTeam?.role === "admin";

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        currentTeam,
        teams,
        isLoading,
        switchWorkspace,
        isTeamWorkspace,
        canManageTeam,
        canPublish,
      }}
    >
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
