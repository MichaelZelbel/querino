import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptCard } from "@/components/prompts/PromptCard";
import { SkillCard } from "@/components/skills/SkillCard";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Library as LibraryIcon, Sparkles, Search, Github, FileText, Workflow, Building2, Pin, FolderOpen, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import { usePinnedPrompts } from "@/hooks/usePinnedPrompts";
import { useCollections } from "@/hooks/useCollections";
import { toast } from "sonner";
import type { Prompt } from "@/types/prompt";

interface UserRatings {
  [promptId: string]: number;
}

interface GithubSyncSettings {
  github_repo: string | null;
  github_branch: string | null;
  github_folder: string | null;
  github_sync_enabled: boolean | null;
}

export default function Library() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const { currentWorkspace, currentTeam, isTeamWorkspace } = useWorkspace();
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [userRatings, setUserRatings] = useState<UserRatings>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [githubSettings, setGithubSettings] = useState<GithubSyncSettings | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch user's skills and workflows - filtered by workspace
  const { data: mySkills, isLoading: skillsLoading } = useSkills({ 
    authorId: isTeamWorkspace ? undefined : user?.id,
    teamId: isTeamWorkspace ? currentWorkspace : undefined,
  });
  const { data: myWorkflows, isLoading: workflowsLoading } = useWorkflows({ 
    authorId: isTeamWorkspace ? undefined : user?.id,
    teamId: isTeamWorkspace ? currentWorkspace : undefined,
  });

  // Fetch pinned prompts
  const { 
    pinnedPromptIds, 
    pinnedPrompts, 
    loading: pinnedLoading, 
    isPromptPinned,
    refetch: refetchPinned 
  } = usePinnedPrompts();

  // Fetch user's collections
  const { data: myCollections, isLoading: collectionsLoading } = useCollections(user?.id);

  // Filter prompts based on search query (include ALL owned prompts, even pinned ones)
  const filteredMyPrompts = useMemo(() => {
    if (!debouncedSearch.trim()) return myPrompts;
    const search = debouncedSearch.toLowerCase();
    return myPrompts.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(search) ||
        prompt.description.toLowerCase().includes(search) ||
        prompt.content.toLowerCase().includes(search) ||
        (prompt.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
    );
  }, [myPrompts, debouncedSearch]);

  // Filter pinned prompts based on search
  const filteredPinnedPrompts = useMemo(() => {
    if (!debouncedSearch.trim()) return pinnedPrompts;
    const search = debouncedSearch.toLowerCase();
    return pinnedPrompts.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(search) ||
        prompt.description.toLowerCase().includes(search) ||
        prompt.content.toLowerCase().includes(search) ||
        (prompt.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
    );
  }, [pinnedPrompts, debouncedSearch]);

  const filteredSavedPrompts = useMemo(() => {
    if (!debouncedSearch.trim()) return savedPrompts;
    const search = debouncedSearch.toLowerCase();
    return savedPrompts.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(search) ||
        prompt.description.toLowerCase().includes(search) ||
        prompt.content.toLowerCase().includes(search) ||
        (prompt.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
    );
  }, [savedPrompts, debouncedSearch]);

  const filteredMySkills = useMemo(() => {
    if (!debouncedSearch.trim() || !mySkills) return mySkills || [];
    const search = debouncedSearch.toLowerCase();
    return mySkills.filter(
      (skill) =>
        skill.title.toLowerCase().includes(search) ||
        (skill.description?.toLowerCase().includes(search) ?? false) ||
        skill.content.toLowerCase().includes(search) ||
        (skill.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
    );
  }, [mySkills, debouncedSearch]);

  const filteredMyWorkflows = useMemo(() => {
    if (!debouncedSearch.trim() || !myWorkflows) return myWorkflows || [];
    const search = debouncedSearch.toLowerCase();
    return myWorkflows.filter(
      (workflow) =>
        workflow.title.toLowerCase().includes(search) ||
        (workflow.description?.toLowerCase().includes(search) ?? false) ||
        (workflow.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
    );
  }, [myWorkflows, debouncedSearch]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/library", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load GitHub sync settings - use team settings if in team workspace
  useEffect(() => {
    async function loadGithubSettings() {
      if (!user) return;
      
      if (isTeamWorkspace && currentTeam) {
        // Use team GitHub settings
        setGithubSettings({
          github_repo: currentTeam.github_repo,
          github_branch: currentTeam.github_branch,
          github_folder: currentTeam.github_folder,
          github_sync_enabled: !!currentTeam.github_repo,
        });
      } else {
        // Use personal GitHub settings
        const { data, error } = await supabase
          .from("profiles")
          .select("github_repo, github_branch, github_folder, github_sync_enabled")
          .eq("id", user.id)
          .single();
        
        if (!error && data) {
          setGithubSettings(data);
        }
      }
    }
    
    if (user) {
      loadGithubSettings();
    }
  }, [user, isTeamWorkspace, currentTeam]);

  const handleSyncToGithub = async () => {
    if (!user || !githubSettings?.github_repo) return;
    
    setSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("github-sync", {
        body: { 
          teamId: isTeamWorkspace ? currentWorkspace : undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || "Successfully synced to GitHub!");
      } else {
        throw new Error(data?.error || "Sync failed");
      }
    } catch (error) {
      console.error("GitHub sync error:", error);
      toast.error(error instanceof Error ? error.message : "GitHub sync failed. Please check your settings.");
    } finally {
      setSyncing(false);
    }
  };

  const canSyncToGithub = 
    githubSettings?.github_sync_enabled && 
    githubSettings?.github_repo;

  const hasContent = myPrompts.length > 0 || (mySkills?.length || 0) > 0 || (myWorkflows?.length || 0) > 0;

  // Fetch prompts - filtered by workspace
  useEffect(() => {
    async function fetchLibraryData() {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch prompts based on workspace
        let promptsQuery = supabase.from("prompts").select("*");
        
        if (isTeamWorkspace) {
          // Team workspace: get prompts with this team_id
          promptsQuery = promptsQuery.eq("team_id", currentWorkspace);
        } else {
          // Personal workspace: get prompts with author_id = user and team_id = null
          promptsQuery = promptsQuery
            .eq("author_id", user.id)
            .is("team_id", null);
        }
        
        const { data: ownPrompts, error: ownError } = await promptsQuery.order("created_at", { ascending: false });

        if (ownError) {
          console.error("Error fetching prompts:", ownError);
        } else {
          setMyPrompts((ownPrompts as Prompt[]) || []);
        }

        // Fetch saved prompts (only in personal workspace)
        if (!isTeamWorkspace) {
          const { data: savedData, error: savedError } = await supabase
            .from("user_saved_prompts")
            .select("prompt_id")
            .eq("user_id", user.id);

          if (savedError) {
            console.error("Error fetching saved prompts:", savedError);
          }

          if (savedData && savedData.length > 0) {
            const promptIds = savedData.map((s) => s.prompt_id);
            const { data: promptsData, error: promptsError } = await supabase
              .from("prompts")
              .select("*")
              .in("id", promptIds);

            if (promptsError) {
              console.error("Error fetching prompts:", promptsError);
            } else {
              setSavedPrompts((promptsData as Prompt[]) || []);
            }

            // Fetch user's ratings for saved prompts
            const { data: ratingsData, error: ratingsError } = await supabase
              .from("prompt_reviews")
              .select("prompt_id, rating")
              .eq("user_id", user.id)
              .in("prompt_id", promptIds);

            if (ratingsError) {
              console.error("Error fetching ratings:", ratingsError);
            } else if (ratingsData) {
              const ratings: UserRatings = {};
              ratingsData.forEach((r) => {
                ratings[r.prompt_id] = r.rating;
              });
              setUserRatings(ratings);
            }
          } else {
            setSavedPrompts([]);
          }
        } else {
          // Clear saved prompts in team workspace
          setSavedPrompts([]);
        }
      } catch (err) {
        console.error("Error fetching library data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchLibraryData();
      refetchPinned();
    }
  }, [user, currentWorkspace, isTeamWorkspace, refetchPinned]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const isLoading = loading || skillsLoading || workflowsLoading || pinnedLoading || collectionsLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-display-md font-bold text-foreground">
                  {isTeamWorkspace ? currentTeam?.name : "My Library"}
                </h1>
                {isTeamWorkspace && (
                  <Badge variant="secondary" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    Team
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">
                {isTeamWorkspace 
                  ? "Team shared prompts, skills, and workflows"
                  : `Welcome back${profile?.display_name ? `, ${profile.display_name}` : ""}!`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {canSyncToGithub && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleSyncToGithub}
                  disabled={syncing || !hasContent}
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="h-4 w-4" />
                  )}
                  {syncing ? "Syncing..." : "Sync to GitHub"}
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-12">
              {/* Pinned Section - only show if user has pinned items */}
              {pinnedPrompts.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <Pin className="h-5 w-5 text-warning" />
                    <h2 className="text-xl font-semibold text-foreground">
                      📌 Pinned ({filteredPinnedPrompts.length}{debouncedSearch ? ` of ${pinnedPrompts.length}` : ""})
                    </h2>
                  </div>
                  {filteredPinnedPrompts.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No pinned prompts match your search.
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredPinnedPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          showAuthorBadge
                          currentUserId={user?.id}
                          editPath="library"
                          showSendToLLM
                          isPinned
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* My Prompts Section - count includes ALL owned prompts, but renders only unpinned to avoid duplication */}
              {myPrompts.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                      {isTeamWorkspace ? "Team Prompts" : "My Prompts"} ({debouncedSearch ? `${filteredMyPrompts.length} of ` : ""}{myPrompts.length})
                    </h2>
                  </div>
                  {filteredMyPrompts.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      {debouncedSearch ? "No prompts match your search." : "No prompts yet."}
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMyPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          showAuthorBadge
                          currentUserId={user?.id}
                          editPath="library"
                          showSendToLLM
                          isPinned={isPromptPinned(prompt.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* My Skills Section */}
              {(mySkills?.length || 0) > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                      {isTeamWorkspace ? "Team Skills" : "My Skills"} ({filteredMySkills.length}{debouncedSearch ? ` of ${mySkills?.length}` : ""})
                    </h2>
                  </div>
                  {filteredMySkills.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No skills match your search.
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMySkills.map((skill) => (
                        <SkillCard key={skill.id} skill={skill} showEditButton />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* My Workflows Section */}
              {(myWorkflows?.length || 0) > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                      {isTeamWorkspace ? "Team Workflows" : "My Workflows"} ({filteredMyWorkflows.length}{debouncedSearch ? ` of ${myWorkflows?.length}` : ""})
                    </h2>
                  </div>
                  {filteredMyWorkflows.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No workflows match your search.
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMyWorkflows.map((workflow) => (
                        <WorkflowCard key={workflow.id} workflow={workflow} showEditButton />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Saved Prompts Section - only show in personal workspace */}
              {!isTeamWorkspace && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <LibraryIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">
                      Saved Prompts ({filteredSavedPrompts.length}{debouncedSearch ? ` of ${savedPrompts.length}` : ""})
                    </h2>
                  </div>
                  {savedPrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <LibraryIcon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        No saved prompts yet
                      </h3>
                      <p className="mb-6 max-w-md text-muted-foreground">
                        Discover and save prompts you love to build your collection.
                      </p>
                      <Link to="/discover">
                        <Button variant="secondary" className="gap-2">
                          <Sparkles className="h-4 w-4" />
                          Discover prompts
                        </Button>
                      </Link>
                    </div>
                  ) : filteredSavedPrompts.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No saved prompts match your search.
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredSavedPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          currentUserId={user?.id}
                          userRating={userRatings[prompt.id]}
                          showSendToLLM
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Collections Section - only show in personal workspace */}
              {!isTeamWorkspace && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold text-foreground">
                        My Collections ({myCollections?.length || 0})
                      </h2>
                    </div>
                    <Link to="/collections/new">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Collection
                      </Button>
                    </Link>
                  </div>
                  {(!myCollections || myCollections.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <FolderOpen className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        No collections yet
                      </h3>
                      <p className="mb-6 max-w-md text-muted-foreground">
                        Create collections to organize your prompts, skills, and workflows.
                      </p>
                      <Link to="/collections/new">
                        <Button variant="secondary" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Collection
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {myCollections.map((collection) => (
                        <CollectionCard key={collection.id} collection={collection} showOwner={false} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* Plan Info */}
          <div className="mt-12 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Current Plan: <span className="capitalize">{profile?.plan_type || "Free"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.plan_type === "free" 
                    ? "Upgrade to Premium for unlimited prompts and AI refinement tools" 
                    : "You have access to all premium features"}
                </p>
              </div>
              {profile?.plan_type === "free" && (
                <Link to="/pricing?from=library">
                  <Button size="sm" variant="default">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
