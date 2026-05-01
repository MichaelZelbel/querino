import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTeam, useUpdateTeam } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Bell,
  Shield,
  Palette,
  LogOut,
  Github,
  Loader2,
  Key,
  CheckCircle2,
  XCircle,
  Users,
  Trash2,
  AlertTriangle,
  Building2,
  Info,
  Plug,
  KeyRound,
  Cookie,
  FileText,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { CreditsDisplay } from "@/components/settings/CreditsDisplay";
import { McpSetupSection } from "@/components/settings/McpSetupSection";
import { MenerioIntegrationSection } from "@/components/settings/MenerioIntegrationSection";
import { MenerioBulkSync } from "@/components/menerio/MenerioBulkSync";
import { JoinTeamModal } from "@/components/teams/JoinTeamModal";
import { toast } from "sonner";
import heroSettings from "@/assets/hero-settings.png";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "teams", label: "Teams", icon: Users },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
] as const;

export default function Settings() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => setThemeMounted(true), []);

  const { user, profile, loading: authLoading, signOut } = useAuthContext();
  const { currentWorkspace, currentTeam, isTeamWorkspace } = useWorkspace();
  const { data: teamData } = useTeam(isTeamWorkspace ? currentWorkspace : undefined);
  const updateTeam = useUpdateTeam();

  // Active section tracking for sidebar highlight
  const [activeSection, setActiveSection] = useState<string>("profile");

  // Join team modal
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);

  // Personal GitHub Sync state
  const [personalGithubRepo, setPersonalGithubRepo] = useState("");
  const [personalGithubBranch, setPersonalGithubBranch] = useState("main");
  const [personalGithubFolder, setPersonalGithubFolder] = useState("");
  const [personalGithubSyncEnabled, setPersonalGithubSyncEnabled] = useState(false);
  const [personalGithubToken, setPersonalGithubToken] = useState("");
  const [personalGithubLastSynced, setPersonalGithubLastSynced] = useState<string | null>(null);
  const [savingPersonalGithub, setSavingPersonalGithub] = useState(false);
  const [loadingPersonalGithub, setLoadingPersonalGithub] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  // Team GitHub Sync state
  const [teamGithubRepo, setTeamGithubRepo] = useState("");
  const [teamGithubBranch, setTeamGithubBranch] = useState("main");
  const [teamGithubFolder, setTeamGithubFolder] = useState("");
  const [teamGithubToken, setTeamGithubToken] = useState("");
  const [teamGithubLastSynced, setTeamGithubLastSynced] = useState<string | null>(null);
  const [savingTeamGithub, setSavingTeamGithub] = useState(false);
  const [testingTeamConnection, setTestingTeamConnection] = useState(false);
  const [teamConnectionStatus, setTeamConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Password reset state
  const [sendingReset, setSendingReset] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/settings", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load personal GitHub sync settings
  useEffect(() => {
    async function loadGithubSettings() {
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at")
        .eq("id", user.id)
        .single();

      const { data: credentialData } = await supabase
        .from("user_credentials")
        .select("credential_value")
        .eq("user_id", user.id)
        .eq("credential_type", "github_token")
        .is("team_id", null)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading GitHub settings:", profileError);
      } else if (profileData) {
        setPersonalGithubRepo(profileData.github_repo || "");
        setPersonalGithubBranch(profileData.github_branch || "main");
        setPersonalGithubFolder(profileData.github_folder || "");
        setPersonalGithubSyncEnabled(profileData.github_sync_enabled || false);
        setPersonalGithubLastSynced(profileData.github_last_synced_at || null);
      }

      setPersonalGithubToken(credentialData?.credential_value ? "••••••••••••••••" : "");
      setLoadingPersonalGithub(false);
    }

    if (user) loadGithubSettings();
  }, [user]);

  // Load team GitHub sync settings when team changes
  useEffect(() => {
    if (teamData) {
      setTeamGithubRepo(teamData.github_repo || "");
      setTeamGithubBranch(teamData.github_branch || "main");
      setTeamGithubFolder(teamData.github_folder || "");
      const loadTeamToken = async () => {
        const { data: teamMeta } = await supabase
          .from("teams")
          .select("github_last_synced_at")
          .eq("id", teamData.id)
          .single();

        const { data: credentialData } = await supabase
          .from("user_credentials")
          .select("credential_value")
          .eq("credential_type", "github_token")
          .eq("team_id", teamData.id)
          .maybeSingle();

        setTeamGithubToken(credentialData?.credential_value ? "••••••••••••••••" : "");
        setTeamGithubLastSynced(teamMeta?.github_last_synced_at || null);
      };
      loadTeamToken();
    }
  }, [teamData]);

  // Active section observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [user]);

  const handleSavePersonalGithubSettings = async () => {
    if (!user) return;
    if (personalGithubRepo && !personalGithubRepo.includes("/")) {
      toast.error("Repository must be in format owner/repo");
      return;
    }
    setSavingPersonalGithub(true);
    const cleanFolder = personalGithubFolder.replace(/^\/+|\/+$/g, "");
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          github_repo: personalGithubRepo || null,
          github_branch: personalGithubBranch || "main",
          github_folder: cleanFolder || null,
          github_sync_enabled: personalGithubSyncEnabled,
        })
        .eq("id", user.id);
      if (profileError) throw profileError;

      if (personalGithubToken && !personalGithubToken.includes("•")) {
        const { error: tokenError } = await supabase
          .from("user_credentials")
          .upsert(
            {
              user_id: user.id,
              credential_type: "github_token",
              credential_value: personalGithubToken,
              team_id: null,
            },
            { onConflict: "user_id,credential_type,team_id" }
          );
        if (tokenError) throw tokenError;
      }
      toast.success("Personal GitHub sync settings saved");
      setConnectionStatus("idle");
    } catch (error) {
      console.error("Error saving GitHub settings:", error);
      toast.error("Failed to save GitHub settings");
    } finally {
      setSavingPersonalGithub(false);
    }
  };

  const handleTestConnection = async (isTeam: boolean) => {
    if (isTeam) {
      setTestingTeamConnection(true);
      setTeamConnectionStatus("idle");
    } else {
      setTestingConnection(true);
      setConnectionStatus("idle");
    }
    try {
      const { data, error } = await supabase.functions.invoke("github-sync", {
        body: {
          testConnection: true,
          teamId: isTeam ? currentTeam?.id : undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        if (isTeam) setTeamConnectionStatus("success");
        else setConnectionStatus("success");
        toast.success("GitHub connection successful!");
      } else {
        throw new Error(data?.error || "Connection failed");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      if (isTeam) setTeamConnectionStatus("error");
      else setConnectionStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to connect to GitHub");
    } finally {
      if (isTeam) setTestingTeamConnection(false);
      else setTestingConnection(false);
    }
  };

  const handleSaveTeamGithubSettings = async () => {
    if (!currentTeam || !user) return;
    if (teamGithubRepo && !teamGithubRepo.includes("/")) {
      toast.error("Repository must be in format owner/repo");
      return;
    }
    setSavingTeamGithub(true);
    const cleanFolder = teamGithubFolder.replace(/^\/+|\/+$/g, "");
    try {
      const { error: teamError } = await supabase
        .from("teams")
        .update({
          github_repo: teamGithubRepo || null,
          github_branch: teamGithubBranch || "main",
          github_folder: cleanFolder || null,
        })
        .eq("id", currentTeam.id);
      if (teamError) throw teamError;

      if (teamGithubToken && !teamGithubToken.includes("•")) {
        const { error: tokenError } = await supabase
          .from("user_credentials")
          .upsert(
            {
              user_id: user.id,
              credential_type: "github_token",
              credential_value: teamGithubToken,
              team_id: currentTeam.id,
            },
            { onConflict: "user_id,credential_type,team_id" }
          );
        if (tokenError) throw tokenError;
      }
      toast.success("Team GitHub sync settings saved");
      setTeamConnectionStatus("idle");
    } catch (error) {
      console.error("Error saving team GitHub settings:", error);
      toast.error("Failed to save team GitHub settings");
    } finally {
      setSavingTeamGithub(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      toast.error("No email on file for this account.");
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success(`Password reset link sent to ${user.email}`);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
      return;
    }
    navigate("/", { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-my-account", {
        body: { confirmation: "DELETE" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Account deleted successfully. Redirecting...");
        await supabase.auth.signOut();
        navigate("/", { replace: true });
      } else {
        throw new Error(data?.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setDeletingAccount(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmation("");
    }
  };

  const initials = useMemo(() => {
    const name = profile?.display_name || user?.email || "?";
    return name
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  }, [profile?.display_name, user?.email]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const showTeamGithub = isTeamWorkspace && currentTeam;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-display-lg text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-lg">
              Manage your account preferences and settings.
            </p>
          </div>
          <img
            src={heroSettings}
            alt="Settings"
            className="hidden md:block w-48 h-24 object-cover rounded-lg opacity-80"
          />
        </div>

        {/* Workspace Indicator */}
        <Alert className={`mb-8 ${isTeamWorkspace ? "border-primary/30 bg-primary/5" : "border-border"}`}>
          <div className="flex items-center gap-3">
            {isTeamWorkspace ? (
              <Building2 className="h-5 w-5 text-primary" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            <AlertDescription className="flex-1">
              <span className="font-medium">
                {isTeamWorkspace ? `Team: ${currentTeam?.name}` : "Personal Workspace"}
              </span>
              <span className="text-muted-foreground ml-2">
                — {isTeamWorkspace
                  ? "GitHub sync settings below apply to this team's artefacts."
                  : "GitHub sync settings below apply to your personal artefacts."}
              </span>
            </AlertDescription>
            {isTeamWorkspace && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                {currentTeam?.role}
              </Badge>
            )}
          </div>
        </Alert>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Navigation */}
          <nav className="space-y-2 lg:sticky lg:top-24 lg:self-start">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <Button
                  key={s.id}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "font-medium"
                  )}
                >
                  <a href={`#${s.id}`}>
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </a>
                </Button>
              );
            })}
            <Separator className="my-4" />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>

          {/* Settings Content */}
          <div className="space-y-8">
            {/* ── Profile ───────────────────────── */}
            <Card id="profile" className="scroll-mt-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile
                  </CardTitle>
                  {profile?.display_name && (
                    <Badge variant="outline" className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      {profile.display_name}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Your public identity on Querino. Edit your display name, avatar, bio and links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "Avatar"} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {profile?.display_name || "Unnamed user"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    {profile?.bio && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                    )}
                  </div>
                </div>
                <Button onClick={() => navigate("/profile/edit")} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </Button>
                <Separator />
                {/* AI Credits */}
                <div>
                  <p className="font-medium mb-2">AI credits</p>
                  <CreditsDisplay />
                </div>
              </CardContent>
            </Card>

            {/* ── Notifications ─────────────────── */}
            <Card id="notifications" className="scroll-mt-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <Badge variant="outline" className="text-muted-foreground">Coming soon</Badge>
                </div>
                <CardDescription>Choose what notifications you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new prompts and features.
                    </p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">
                      Get a weekly summary of trending prompts.
                    </p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Community Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications about comments and interactions.
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>

            {/* ── Appearance ────────────────────── */}
            <Card id="appearance" className="scroll-mt-24">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how Querino looks for you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for reduced eye strain.
                    </p>
                  </div>
                  <Switch
                    checked={themeMounted && resolvedTheme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    aria-label="Toggle dark mode"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Teams ─────────────────────────── */}
            <Card id="teams" className="scroll-mt-24">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teams
                </CardTitle>
                <CardDescription>
                  Join team workspaces to collaborate with others.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Join a team</p>
                    <p className="text-sm text-muted-foreground">
                      Enter a team ID shared with you to join their workspace.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setShowJoinTeamModal(true)}>
                    Join team
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Integrations ──────────────────── */}
            <div id="integrations" className="scroll-mt-24 space-y-8">
              {/* GitHub Sync */}
              <Card className={showTeamGithub ? "border-primary/30" : ""}>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub Sync
                    {showTeamGithub && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary border-0"
                      >
                        <Building2 className="h-2.5 w-2.5" />
                        Team
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {showTeamGithub
                      ? `Sync ${currentTeam?.name}'s artefacts to a shared GitHub repository.`
                      : "Sync your personal prompts, skills and workflows to a GitHub repository."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {showTeamGithub ? (
                    <>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          These settings apply to all artefacts in the{" "}
                          <strong>{currentTeam?.name}</strong> workspace. Team members with editor+
                          access can sync to this repository.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="teamGithubToken" className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Personal Access Token
                        </Label>
                        <Input
                          id="teamGithubToken"
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={teamGithubToken}
                          onChange={(e) => {
                            setTeamGithubToken(e.target.value);
                            setTeamConnectionStatus("idle");
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Create a token at{" "}
                          <a
                            href="https://github.com/settings/tokens/new?scopes=repo&description=Querino%20Sync"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            GitHub Settings
                          </a>{" "}
                          with <code className="bg-muted px-1 rounded">repo</code> scope.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="teamGithubRepo">Repository (owner/name)</Label>
                        <Input
                          id="teamGithubRepo"
                          placeholder="organization/team-repo"
                          value={teamGithubRepo}
                          onChange={(e) => setTeamGithubRepo(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="teamGithubBranch">Branch</Label>
                          <Input
                            id="teamGithubBranch"
                            placeholder="main"
                            value={teamGithubBranch}
                            onChange={(e) => setTeamGithubBranch(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teamGithubFolder">Folder path</Label>
                          <Input
                            id="teamGithubFolder"
                            placeholder="prompts"
                            value={teamGithubFolder}
                            onChange={(e) => setTeamGithubFolder(e.target.value)}
                          />
                        </div>
                      </div>

                      {teamGithubLastSynced && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Last synced: {new Date(teamGithubLastSynced).toLocaleString()}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <Button onClick={handleSaveTeamGithubSettings} disabled={savingTeamGithub}>
                          {savingTeamGithub ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Team GitHub Settings"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection(true)}
                          disabled={testingTeamConnection || !teamGithubRepo || !teamGithubToken}
                        >
                          {testingTeamConnection ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : teamConnectionStatus === "success" ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Connected
                            </>
                          ) : teamConnectionStatus === "error" ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" />
                              Failed
                            </>
                          ) : (
                            "Test Connection"
                          )}
                        </Button>
                      </div>
                    </>
                  ) : loadingPersonalGithub ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="personalGithubToken" className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Personal Access Token
                        </Label>
                        <Input
                          id="personalGithubToken"
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={personalGithubToken}
                          onChange={(e) => {
                            setPersonalGithubToken(e.target.value);
                            setConnectionStatus("idle");
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Create a token at{" "}
                          <a
                            href="https://github.com/settings/tokens/new?scopes=repo&description=Querino%20Sync"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            GitHub Settings
                          </a>{" "}
                          with <code className="bg-muted px-1 rounded">repo</code> scope.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="personalGithubRepo">Repository (owner/name)</Label>
                        <Input
                          id="personalGithubRepo"
                          placeholder="yourname/your-repo"
                          value={personalGithubRepo}
                          onChange={(e) => setPersonalGithubRepo(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="personalGithubBranch">Branch</Label>
                          <Input
                            id="personalGithubBranch"
                            placeholder="main"
                            value={personalGithubBranch}
                            onChange={(e) => setPersonalGithubBranch(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="personalGithubFolder">Folder path</Label>
                          <Input
                            id="personalGithubFolder"
                            placeholder="querino-prompts"
                            value={personalGithubFolder}
                            onChange={(e) => setPersonalGithubFolder(e.target.value)}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Enable GitHub Sync</p>
                          <p className="text-sm text-muted-foreground">
                            Allow syncing your prompts, skills, and workflows to GitHub.
                          </p>
                        </div>
                        <Switch
                          checked={personalGithubSyncEnabled}
                          onCheckedChange={setPersonalGithubSyncEnabled}
                        />
                      </div>

                      {personalGithubLastSynced && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Last synced: {new Date(personalGithubLastSynced).toLocaleString()}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <Button onClick={handleSavePersonalGithubSettings} disabled={savingPersonalGithub}>
                          {savingPersonalGithub ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save GitHub Settings"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleTestConnection(false)}
                          disabled={testingConnection || !personalGithubRepo || !personalGithubToken}
                        >
                          {testingConnection ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : connectionStatus === "success" ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Connected
                            </>
                          ) : connectionStatus === "error" ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" />
                              Failed
                            </>
                          ) : (
                            "Test Connection"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Menerio */}
              <MenerioIntegrationSection />
              <MenerioBulkSync />

              {/* MCP */}
              <McpSetupSection />
            </div>

            {/* ── Privacy & Security ────────────── */}
            <div id="privacy" className="scroll-mt-24 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription>
                    Manage your password, cookie preferences, and data privacy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Password */}
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <KeyRound className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">Change password</p>
                        <p className="text-sm text-muted-foreground">
                          We'll email a secure reset link to {user.email}.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendPasswordReset}
                      disabled={sendingReset}
                    >
                      {sendingReset ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </div>
                  <Separator />
                  {/* Cookies */}
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Cookie className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">Cookie preferences</p>
                        <p className="text-sm text-muted-foreground">
                          Review what we store and adjust your consent.
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/cookies">
                        Manage <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <Separator />
                  {/* Privacy policy */}
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">Privacy policy</p>
                        <p className="text-sm text-muted-foreground">
                          Read how we collect, store, and process your data.
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/privacy">
                        Open <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Account */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Delete Account
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Deleting your account will permanently remove:
                      <ul className="list-disc ml-4 mt-2 space-y-1">
                        <li>Your profile and personal information</li>
                        <li>All prompts, skills, and workflows you created</li>
                        <li>Your collections and saved items</li>
                        <li>Reviews and comments you've made</li>
                        <li>Team memberships and owned teams</li>
                        <li>Usage history and AI credits</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete My Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          Confirm Account Deletion
                        </DialogTitle>
                        <DialogDescription>
                          This action is permanent and cannot be undone. All your data will be
                          permanently deleted.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                          To confirm deletion, type{" "}
                          <strong className="text-foreground">DELETE</strong> in the field below:
                        </p>
                        <Input
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="font-mono"
                        />
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDeleteDialogOpen(false);
                            setDeleteConfirmation("");
                          }}
                          disabled={deletingAccount}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== "DELETE" || deletingAccount}
                        >
                          {deletingAccount ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Permanently Delete Account"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <JoinTeamModal open={showJoinTeamModal} onOpenChange={setShowJoinTeamModal} />
    </div>
  );
}
