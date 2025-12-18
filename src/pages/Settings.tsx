import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
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
import { User, Bell, Shield, CreditCard, Palette, LogOut, Github, Loader2, Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import heroSettings from "@/assets/hero-settings.png";

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  
  // Premium check
  const isPremium = profile?.plan_type === 'premium' || profile?.plan_type === 'team';
  
  // GitHub Sync state
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubFolder, setGithubFolder] = useState("");
  const [githubSyncEnabled, setGithubSyncEnabled] = useState(false);
  const [savingGithub, setSavingGithub] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/settings", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load GitHub sync settings
  useEffect(() => {
    async function loadGithubSettings() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("github_repo, github_branch, github_folder, github_sync_enabled")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error loading GitHub settings:", error);
      } else if (data) {
        setGithubRepo(data.github_repo || "");
        setGithubBranch(data.github_branch || "main");
        setGithubFolder(data.github_folder || "");
        setGithubSyncEnabled(data.github_sync_enabled || false);
      }
      setLoadingGithub(false);
    }
    
    if (user) {
      loadGithubSettings();
    }
  }, [user]);

  const handleSaveGithubSettings = async () => {
    if (!user) return;
    
    // Validate repo format
    if (githubRepo && !githubRepo.includes("/")) {
      toast.error("Repository must be in format owner/repo");
      return;
    }
    
    setSavingGithub(true);
    
    // Clean folder path - strip leading/trailing slashes
    const cleanFolder = githubFolder.replace(/^\/+|\/+$/g, "");
    
    const { error } = await supabase
      .from("profiles")
      .update({
        github_repo: githubRepo || null,
        github_branch: githubBranch || "main",
        github_folder: cleanFolder || null,
        github_sync_enabled: githubSyncEnabled,
      })
      .eq("id", user.id);
    
    setSavingGithub(false);
    
    if (error) {
      console.error("Error saving GitHub settings:", error);
      toast.error("Failed to save GitHub settings");
    } else {
      toast.success("GitHub sync settings saved");
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 flex items-center justify-between">
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

            {/* GitHub Sync Section */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Sync
                  {!isPremium && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary border-0">
                      <Crown className="h-2.5 w-2.5" />
                      Premium
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Sync your prompts to a GitHub repository.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isPremium ? (
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
                ) : loadingGithub ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="githubRepo">Repository (owner/name)</Label>
                      <Input
                        id="githubRepo"
                        placeholder="yourname/your-repo"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="githubBranch">Branch</Label>
                        <Input
                          id="githubBranch"
                          placeholder="main"
                          value={githubBranch}
                          onChange={(e) => setGithubBranch(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="githubFolder">Folder path</Label>
                        <Input
                          id="githubFolder"
                          placeholder="querino-prompts"
                          value={githubFolder}
                          onChange={(e) => setGithubFolder(e.target.value)}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable GitHub Sync</p>
                        <p className="text-sm text-muted-foreground">
                          Allow syncing your prompts to GitHub.
                        </p>
                      </div>
                      <Switch
                        checked={githubSyncEnabled}
                        onCheckedChange={setGithubSyncEnabled}
                      />
                    </div>
                    <Button onClick={handleSaveGithubSettings} disabled={savingGithub}>
                      {savingGithub ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save GitHub Settings"
                      )}
                    </Button>
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
