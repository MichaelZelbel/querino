import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Bell, Shield, CreditCard, Palette, LogOut, Github, Loader2, Lock, Crown, Building2, Info, Key, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import heroSettings from "@/assets/hero-settings.png";

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const { currentWorkspace, currentTeam, isTeamWorkspace } = useWorkspace();
  const { data: teamData } = useTeam(isTeamWorkspace ? currentWorkspace : undefined);
  const updateTeam = useUpdateTeam();
  
  // Premium check
  const isPremium = profile?.plan_type === 'premium' || profile?.plan_type === 'team';
  
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
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Team GitHub Sync state
  const [teamGithubRepo, setTeamGithubRepo] = useState("");
  const [teamGithubBranch, setTeamGithubBranch] = useState("main");
  const [teamGithubFolder, setTeamGithubFolder] = useState("");
  const [teamGithubToken, setTeamGithubToken] = useState("");
  const [teamGithubLastSynced, setTeamGithubLastSynced] = useState<string | null>(null);
  const [savingTeamGithub, setSavingTeamGithub] = useState(false);
  const [testingTeamConnection, setTestingTeamConnection] = useState(false);
  const [teamConnectionStatus, setTeamConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
      
      const { data, error } = await supabase
        .from("profiles")
        .select("github_repo, github_branch, github_folder, github_sync_enabled, github_token_encrypted, github_last_synced_at")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error loading GitHub settings:", error);
      } else if (data) {
        setPersonalGithubRepo(data.github_repo || "");
        setPersonalGithubBranch(data.github_branch || "main");
        setPersonalGithubFolder(data.github_folder || "");
        setPersonalGithubSyncEnabled(data.github_sync_enabled || false);
        setPersonalGithubToken(data.github_token_encrypted ? "••••••••••••••••" : "");
        setPersonalGithubLastSynced(data.github_last_synced_at || null);
      }
      setLoadingPersonalGithub(false);
    }
    
    if (user) {
      loadGithubSettings();
    }
  }, [user]);

  // Load team GitHub sync settings when team changes
  useEffect(() => {
    if (teamData) {
      setTeamGithubRepo(teamData.github_repo || "");
      setTeamGithubBranch(teamData.github_branch || "main");
      setTeamGithubFolder(teamData.github_folder || "");
      // Team token - check if exists in DB
      const loadTeamToken = async () => {
        const { data } = await supabase
          .from("teams")
          .select("github_token_encrypted, github_last_synced_at")
          .eq("id", teamData.id)
          .single();
        if (data) {
          setTeamGithubToken(data.github_token_encrypted ? "••••••••••••••••" : "");
          setTeamGithubLastSynced(data.github_last_synced_at || null);
        }
      };
      loadTeamToken();
    }
  }, [teamData]);

  const handleSavePersonalGithubSettings = async () => {
    if (!user) return;
    
    if (personalGithubRepo && !personalGithubRepo.includes("/")) {
      toast.error("Repository must be in format owner/repo");
      return;
    }
    
    setSavingPersonalGithub(true);
    const cleanFolder = personalGithubFolder.replace(/^\/+|\/+$/g, "");
    
    // Prepare update object
    const updateData: Record<string, unknown> = {
      github_repo: personalGithubRepo || null,
      github_branch: personalGithubBranch || "main",
      github_folder: cleanFolder || null,
      github_sync_enabled: personalGithubSyncEnabled,
    };
    
    // Only update token if it's been changed (not the masked value)
    if (personalGithubToken && !personalGithubToken.includes("•")) {
      updateData.github_token_encrypted = personalGithubToken;
    }
    
    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);
    
    setSavingPersonalGithub(false);
    
    if (error) {
      console.error("Error saving GitHub settings:", error);
      toast.error("Failed to save GitHub settings");
    } else {
      toast.success("Personal GitHub sync settings saved");
      setConnectionStatus('idle');
    }
  };

  const handleTestConnection = async (isTeam: boolean) => {
    if (isTeam) {
      setTestingTeamConnection(true);
      setTeamConnectionStatus('idle');
    } else {
      setTestingConnection(true);
      setConnectionStatus('idle');
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
        if (isTeam) {
          setTeamConnectionStatus('success');
        } else {
          setConnectionStatus('success');
        }
        toast.success("GitHub connection successful!");
      } else {
        throw new Error(data?.error || "Connection failed");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      if (isTeam) {
        setTeamConnectionStatus('error');
      } else {
        setConnectionStatus('error');
      }
      toast.error(error instanceof Error ? error.message : "Failed to connect to GitHub");
    } finally {
      if (isTeam) {
        setTestingTeamConnection(false);
      } else {
        setTestingConnection(false);
      }
    }
  };

  const handleSaveTeamGithubSettings = async () => {
    if (!currentTeam) return;
    
    if (teamGithubRepo && !teamGithubRepo.includes("/")) {
      toast.error("Repository must be in format owner/repo");
      return;
    }
    
    setSavingTeamGithub(true);
    const cleanFolder = teamGithubFolder.replace(/^\/+|\/+$/g, "");
    
    // Prepare update object
    const updateData: Record<string, unknown> = {
      github_repo: teamGithubRepo || null,
      github_branch: teamGithubBranch || "main",
      github_folder: cleanFolder || null,
    };
    
    // Only update token if it's been changed (not the masked value)
    if (teamGithubToken && !teamGithubToken.includes("•")) {
      updateData.github_token_encrypted = teamGithubToken;
    }
    
    try {
      // Use direct supabase update for team to include token
      const { error } = await supabase
        .from("teams")
        .update(updateData)
        .eq("id", currentTeam.id);
        
      if (error) throw error;
      toast.success("Team GitHub sync settings saved");
      setTeamConnectionStatus('idle');
    } catch (error) {
      console.error("Error saving team GitHub settings:", error);
      toast.error("Failed to save team GitHub settings");
    } finally {
      setSavingTeamGithub(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine which GitHub settings to show based on workspace
  const showTeamGithub = isTeamWorkspace && currentTeam;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-display-lg text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your account preferences and settings.</p>
          </div>
          <img 
            src={heroSettings} 
            alt="Settings" 
            className="hidden md:block w-48 h-24 object-cover rounded-lg opacity-80"
          />
        </div>

        {/* Workspace Indicator */}
        <Alert className={`mb-8 ${isTeamWorkspace ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
          <div className="flex items-center gap-3">
            {isTeamWorkspace ? (
              <Building2 className="h-5 w-5 text-primary" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
            <AlertDescription className="flex-1">
              <span className="font-medium">
                {isTeamWorkspace ? `Team: ${currentTeam?.name}` : 'Personal Workspace'}
              </span>
              <span className="text-muted-foreground ml-2">
                — {isTeamWorkspace 
                  ? 'GitHub sync settings below apply to this team\'s artefacts.' 
                  : 'GitHub sync settings below apply to your personal artefacts.'}
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
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Shield className="h-4 w-4" />
              Privacy & Security
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <CreditCard className="h-4 w-4" />
              Billing
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Palette className="h-4 w-4" />
              Appearance
            </Button>
            <Separator className="my-4" />
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>

          {/* Settings Content */}
          <div className="space-y-8">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal details and public profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" placeholder="Tell us about yourself..." />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates about new prompts and features.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Get a weekly summary of trending prompts.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Community Updates</p>
                    <p className="text-sm text-muted-foreground">Notifications about comments and interactions.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Appearance Section */}
            <Card>
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
                    <p className="text-sm text-muted-foreground">Use dark theme for reduced eye strain.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* GitHub Sync Section - Workspace Aware */}
            <Card className={showTeamGithub ? 'border-primary/30' : ''}>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Sync
                  {showTeamGithub ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary border-0">
                      <Building2 className="h-2.5 w-2.5" />
                      Team
                    </Badge>
                  ) : !isPremium ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary border-0">
                      <Crown className="h-2.5 w-2.5" />
                      Premium
                    </Badge>
                  ) : null}
                </CardTitle>
                <CardDescription>
                  {showTeamGithub 
                    ? `Sync ${currentTeam?.name}'s artefacts to a shared GitHub repository.`
                    : 'Sync your personal prompts to a GitHub repository.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isPremium && !showTeamGithub ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Premium Feature</h4>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
                      GitHub Sync is a Premium feature. Upgrade to sync your artefacts to any GitHub repository.
                    </p>
                    <Link to="/pricing">
                      <Button className="gap-2">
                        <Crown className="h-4 w-4" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </div>
                ) : showTeamGithub ? (
                  // Team GitHub Settings
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        These settings apply to all artefacts in the <strong>{currentTeam?.name}</strong> workspace. 
                        Team members with editor+ access can sync to this repository.
                      </p>
                    </div>
                    
                    {/* Token Input */}
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
                          setTeamConnectionStatus('idle');
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
                        </a>
                        {" "}with <code className="bg-muted px-1 rounded">repo</code> scope.
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

                    {/* Last synced info */}
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
                        ) : teamConnectionStatus === 'success' ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Connected
                          </>
                        ) : teamConnectionStatus === 'error' ? (
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
                  // Personal GitHub Settings
                  <>
                    {/* Token Input */}
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
                          setConnectionStatus('idle');
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
                        </a>
                        {" "}with <code className="bg-muted px-1 rounded">repo</code> scope.
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

                    {/* Last synced info */}
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
                        ) : connectionStatus === 'success' ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Connected
                          </>
                        ) : connectionStatus === 'error' ? (
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
