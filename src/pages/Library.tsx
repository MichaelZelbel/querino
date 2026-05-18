import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Library as LibraryIcon, Sparkles, Search, Github, FileText, Workflow, Building2, Pin, FolderOpen, Plus, ExternalLink, CheckCircle2, Package, CheckSquare } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import { usePromptKits } from "@/hooks/usePromptKits";
import { PromptKitCard } from "@/components/promptKits/PromptKitCard";
import { SectionHeader } from "@/components/library/SectionHeader";
import { BulkActionBar } from "@/components/library/BulkActionBar";
import { BulkAddToCollectionModal, type BulkSelectionItem } from "@/components/library/BulkAddToCollectionModal";
import { usePinnedPrompts } from "@/hooks/usePinnedPrompts";
import { useCollections } from "@/hooks/useCollections";
import { useMenerioIntegration } from "@/hooks/useMenerioIntegration";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Prompt } from "@/types/prompt";
import { EmptyState } from "@/components/ui/empty-state";

type ArtifactType = "prompt" | "skill" | "workflow" | "prompt_kit";
const TABLE_BY_TYPE: Record<ArtifactType, "prompts" | "skills" | "workflows" | "prompt_kits"> = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
};

function SelectableCard({
  selectMode,
  selected,
  onToggle,
  children,
  label,
}: {
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className={cn(selectMode && "pointer-events-none")}>{children}</div>
      {selectMode && (
        <>
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={`${selected ? "Deselect" : "Select"} ${label}`}
            className={cn(
              "absolute inset-0 rounded-xl border-2 transition-colors",
              selected
                ? "border-primary bg-primary/5"
                : "border-transparent hover:bg-foreground/[0.03]",
            )}
          />
          <div className="absolute left-3 top-3 z-10 rounded-md bg-card/90 p-1 shadow-sm backdrop-blur">
            <Checkbox
              checked={selected}
              onCheckedChange={onToggle}
              aria-label={`Select ${label}`}
            />
          </div>
        </>
      )}
    </div>
  );
}

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

  // --- Sort / filter controls (state persisted in URL) ---
  const ALL_TYPES = ["prompts", "skills", "workflows", "kits", "saved", "collections"] as const;
  type LibType = (typeof ALL_TYPES)[number];
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = (searchParams.get("sort") || "recent") as
    | "recent"
    | "oldest"
    | "az"
    | "za"
    | "rating";
  const typesParam = searchParams.get("types");
  const activeTypes: LibType[] = typesParam
    ? (typesParam.split(",").filter((t) => (ALL_TYPES as readonly string[]).includes(t)) as LibType[])
    : [...ALL_TYPES];
  const menerioFilter = (searchParams.get("menerio") || "all") as "all" | "synced" | "unsynced";

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSort = (value: string) => updateParam("sort", value === "recent" ? null : value);
  const setTypes = (values: string[]) => {
    if (values.length === 0 || values.length === ALL_TYPES.length) {
      updateParam("types", null);
    } else {
      updateParam("types", values.join(","));
    }
  };
  const setMenerioFilter = (value: string) =>
    updateParam("menerio", value === "all" ? null : value);

  const isTypeVisible = (t: LibType) => activeTypes.includes(t);

  function sortItems<T extends { title: string; created_at: string; rating_avg?: number }>(
    items: T[],
  ): T[] {
    const copy = [...items];
    switch (sort) {
      case "oldest":
        return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
      case "az":
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      case "za":
        return copy.sort((a, b) => b.title.localeCompare(a.title));
      case "rating":
        return copy.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
      case "recent":
      default:
        return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }

  function applyMenerio<T extends { menerio_synced?: boolean }>(items: T[]): T[] {
    if (menerioFilter === "all") return items;
    if (menerioFilter === "synced") return items.filter((i) => i.menerio_synced);
    return items.filter((i) => !i.menerio_synced);
  }
  const [githubSettings, setGithubSettings] = useState<GithubSyncSettings | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessDialogOpen, setSyncSuccessDialogOpen] = useState(false);

  // Fetch user's skills and workflows - filtered by workspace
  const { data: mySkills, isLoading: skillsLoading } = useSkills({ 
    authorId: isTeamWorkspace ? undefined : user?.id,
    teamId: isTeamWorkspace ? currentWorkspace : undefined,
  });
  const { data: myWorkflows, isLoading: workflowsLoading } = useWorkflows({ 
    authorId: isTeamWorkspace ? undefined : user?.id,
    teamId: isTeamWorkspace ? currentWorkspace : undefined,
  });
  const { data: myKits, isLoading: kitsLoading } = usePromptKits({
    authorId: isTeamWorkspace ? undefined : user?.id,
    teamId: isTeamWorkspace ? currentWorkspace : undefined,
  });

  // Fetch pinned prompts - filtered by workspace
  const { 
    pinnedPromptIds, 
    pinnedPrompts, 
    loading: pinnedLoading, 
    isPromptPinned,
    refetch: refetchPinned 
  } = usePinnedPrompts({
    teamId: isTeamWorkspace ? currentWorkspace : undefined,
    personalOnly: !isTeamWorkspace,
  });

  // Fetch user's collections
  const { data: myCollections, isLoading: collectionsLoading } = useCollections(user?.id);

  // Check Menerio integration
  const { hasIntegration: hasMenerio } = useMenerioIntegration(user?.id);

  const queryClient = useQueryClient();

  // --- Bulk selection state ---
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);

  const selKey = (type: ArtifactType, id: string) => `${type}:${id}`;
  const isSelected = useCallback(
    (type: ArtifactType, id: string) => selected.has(selKey(type, id)),
    [selected],
  );
  const toggleSelect = useCallback((type: ArtifactType, id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = selKey(type, id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  const selectedItems: BulkSelectionItem[] = useMemo(
    () =>
      Array.from(selected).map((key) => {
        const [type, id] = key.split(":") as [ArtifactType, string];
        return { type, id };
      }),
    [selected],
  );

  const groupSelected = useMemo(() => {
    const groups: Record<ArtifactType, string[]> = {
      prompt: [],
      skill: [],
      workflow: [],
      prompt_kit: [],
    };
    for (const { type, id } of selectedItems) groups[type].push(id);
    return groups;
  }, [selectedItems]);

  const handleBulkDelete = async () => {
    if (!user || selectedItems.length === 0) return;
    setBulkDeleting(true);
    try {
      let totalDeleted = 0;
      for (const t of Object.keys(groupSelected) as ArtifactType[]) {
        const ids = groupSelected[t];
        if (ids.length === 0) continue;
        const table = TABLE_BY_TYPE[t];
        let q = (supabase.from(table) as any).delete().in("id", ids);
        if (isTeamWorkspace) {
          q = q.eq("team_id", currentWorkspace);
        } else {
          q = q.eq("author_id", user.id).is("team_id", null);
        }
        const { error } = await q;
        if (error) {
          console.error(`Bulk delete ${table} failed:`, error);
          toast.error(`Failed to delete some ${table}`);
        } else {
          totalDeleted += ids.length;
        }
      }
      if (totalDeleted > 0) {
        toast.success(`Deleted ${totalDeleted} item${totalDeleted === 1 ? "" : "s"}.`);
      }
      // Refresh local + cached lists
      setMyPrompts((prev) => prev.filter((p) => !groupSelected.prompt.includes(p.id)));
      setSavedPrompts((prev) => prev.filter((p) => !groupSelected.prompt.includes(p.id)));
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["prompt_kits"] });
      refetchPinned();
      exitSelectMode();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkSyncMenerio = async () => {
    if (!user || !hasMenerio) return;
    const syncable = selectedItems.filter((i) => i.type !== "prompt_kit");
    if (syncable.length === 0) {
      toast.info("Selected items can't be synced to Menerio.");
      return;
    }
    setBulkSyncing(true);
    try {
      const rows = syncable.map((i) => ({
        user_id: user.id,
        artifact_type: i.type,
        artifact_id: i.id,
        status: "pending" as const,
      }));
      const { error } = await supabase.from("menerio_sync_queue").insert(rows);
      if (error) {
        console.error("Bulk Menerio sync failed:", error);
        toast.error("Failed to queue Menerio sync");
      } else {
        toast.success(`${rows.length} item${rows.length === 1 ? "" : "s"} queued for Menerio sync.`);
        exitSelectMode();
      }
    } finally {
      setBulkSyncing(false);
    }
  };

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

  const filteredMyKits = useMemo(() => {
    if (!debouncedSearch.trim() || !myKits) return myKits || [];
    const search = debouncedSearch.toLowerCase();
    return myKits.filter(
      (kit) =>
        kit.title.toLowerCase().includes(search) ||
        (kit.description?.toLowerCase().includes(search) ?? false) ||
        (kit.content?.toLowerCase().includes(search) ?? false) ||
        (kit.tags?.some((tag) => tag.toLowerCase().includes(search)) ?? false)
    );
  }, [myKits, debouncedSearch]);

  // Apply sort + Menerio filter on top of search-filtered lists
  const displayPinnedPrompts = useMemo(
    () => sortItems(applyMenerio(filteredPinnedPrompts)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredPinnedPrompts, sort, menerioFilter],
  );
  const displayMyPrompts = useMemo(
    () => sortItems(applyMenerio(filteredMyPrompts)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredMyPrompts, sort, menerioFilter],
  );
  const displayMySkills = useMemo(
    () => sortItems(applyMenerio(filteredMySkills)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredMySkills, sort, menerioFilter],
  );
  const displayMyWorkflows = useMemo(
    () => sortItems(applyMenerio(filteredMyWorkflows)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredMyWorkflows, sort, menerioFilter],
  );
  const displayMyKits = useMemo(
    // Kits don't carry menerio_synced — sort only
    () => sortItems(filteredMyKits),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredMyKits, sort],
  );
  const displaySavedPrompts = useMemo(
    () => sortItems(applyMenerio(filteredSavedPrompts)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredSavedPrompts, sort, menerioFilter],
  );




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
        setSyncSuccessDialogOpen(true);
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

  const getGithubFolderUrl = () => {
    if (!githubSettings?.github_repo) return "";
    const branch = githubSettings.github_branch || "main";
    const folder = githubSettings.github_folder?.replace(/^\/+|\/+$/g, "") || "";
    const baseUrl = `https://github.com/${githubSettings.github_repo}/tree/${branch}`;
    return folder ? `${baseUrl}/${folder}` : baseUrl;
  };

  const handleOpenGithub = () => {
    const url = getGithubFolderUrl();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setSyncSuccessDialogOpen(false);
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

  const isLoading = loading || skillsLoading || workflowsLoading || kitsLoading || pinnedLoading || collectionsLoading;

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
              <Button
                className="gap-2"
                onClick={() => navigate("/prompts/new")}
              >
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </div>
          </div>

          {/* Search + sort/filter controls */}
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-[170px]" aria-label="Sort library">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="az">Title A–Z</SelectItem>
                  <SelectItem value="za">Title Z–A</SelectItem>
                  <SelectItem value="rating">Top rated</SelectItem>
                </SelectContent>
              </Select>

              <ToggleGroup
                type="multiple"
                value={activeTypes}
                onValueChange={(v) => setTypes(v)}
                variant="outline"
                size="sm"
                aria-label="Filter by type"
                className="flex-wrap"
              >
                <ToggleGroupItem value="prompts" aria-label="Show prompts">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Prompts
                </ToggleGroupItem>
                <ToggleGroupItem value="skills" aria-label="Show skills">
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  Skills
                </ToggleGroupItem>
                <ToggleGroupItem value="workflows" aria-label="Show workflows">
                  <Workflow className="mr-1 h-3.5 w-3.5" />
                  Workflows
                </ToggleGroupItem>
                <ToggleGroupItem value="kits" aria-label="Show prompt kits">
                  <Package className="mr-1 h-3.5 w-3.5" />
                  Kits
                </ToggleGroupItem>
                {!isTeamWorkspace && (
                  <>
                    <ToggleGroupItem value="saved" aria-label="Show saved prompts">
                      <LibraryIcon className="mr-1 h-3.5 w-3.5" />
                      Saved
                    </ToggleGroupItem>
                    <ToggleGroupItem value="collections" aria-label="Show collections">
                      <FolderOpen className="mr-1 h-3.5 w-3.5" />
                      Collections
                    </ToggleGroupItem>
                  </>
                )}
              </ToggleGroup>

              {hasMenerio && (
                <Select value={menerioFilter} onValueChange={setMenerioFilter}>
                  <SelectTrigger className="h-9 w-[180px]" aria-label="Filter by Menerio sync">
                    <SelectValue placeholder="Menerio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All items</SelectItem>
                    <SelectItem value="synced">Synced to Menerio</SelectItem>
                    <SelectItem value="unsynced">Not synced</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button
                type="button"
                variant={selectMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  if (selectMode) exitSelectMode();
                  else setSelectMode(true);
                }}
                className="gap-2"
                aria-pressed={selectMode}
              >
                <CheckSquare className="h-4 w-4" />
                {selectMode ? "Done" : "Select"}
              </Button>
            </div>
          </div>



          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-12">
              {/* Pinned Section - only show if user has pinned items */}
              {isTypeVisible('prompts') && pinnedPrompts.length > 0 && (
                <section>
                  <SectionHeader
                    iconNode={<Pin className="h-5 w-5 text-warning" />}
                    title="📌 Pinned"
                    count={displayPinnedPrompts.length}
                    total={pinnedPrompts.length}
                    showFraction={!!debouncedSearch}
                  />
                  {displayPinnedPrompts.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No pinned prompts match your search.
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {displayPinnedPrompts.map((prompt) => (
                        <SelectableCard
                          key={prompt.id}
                          selectMode={selectMode}
                          selected={isSelected("prompt", prompt.id)}
                          onToggle={() => toggleSelect("prompt", prompt.id)}
                          label={prompt.title}
                        >
                          <PromptCard
                            prompt={prompt}
                            showAuthorBadge
                            currentUserId={user?.id}
                            editPath="library"
                            showSendToLLM
                            isPinned
                            showMenerioStatus={hasMenerio}
                          />
                        </SelectableCard>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* My Prompts Section - count includes ALL owned prompts, but renders only unpinned to avoid duplication */}
              {isTypeVisible('prompts') && myPrompts.length > 0 && (
                <section>
                  <SectionHeader
                    icon={Sparkles}
                    title={isTeamWorkspace ? "Team Prompts" : "My Prompts"}
                    count={displayMyPrompts.length}
                    total={myPrompts.length}
                    showFraction={!!debouncedSearch}
                  />
                  {displayMyPrompts.length === 0 ? (
                    <EmptyState
                      variant="compact"
                      icon={Search}
                      title={debouncedSearch ? "No prompts match your search" : "No prompts yet"}
                      description={debouncedSearch ? "Try a different keyword or clear your search." : "Create your first prompt to see it here."}
                      primaryAction={debouncedSearch
                        ? { label: "Clear search", onClick: () => setSearchQuery("") }
                        : { label: "New Prompt", to: "/prompts/new", icon: Plus }}
                    />
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {displayMyPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          showAuthorBadge
                          currentUserId={user?.id}
                          editPath="library"
                          showSendToLLM
                          isPinned={isPromptPinned(prompt.id)}
                          showMenerioStatus={hasMenerio}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* My Skills Section */}
              {isTypeVisible('skills') && (mySkills?.length || 0) > 0 && (
                <section>
                  <SectionHeader
                    icon={FileText}
                    title={isTeamWorkspace ? "Team Skills" : "My Skills"}
                    count={displayMySkills.length}
                    total={mySkills?.length}
                    showFraction={!!debouncedSearch}
                  />
                  {displayMySkills.length === 0 ? (
                    <EmptyState
                      variant="compact"
                      icon={Search}
                      title="No skills match your search"
                      description="Try a different keyword or clear your search."
                      primaryAction={{ label: "Clear search", onClick: () => setSearchQuery("") }}
                    />
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {displayMySkills.map((skill) => (
                        <SkillCard key={skill.id} skill={skill} showEditButton currentUserId={user?.id} showMenerioStatus={hasMenerio} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* My Workflows Section */}
              {isTypeVisible('workflows') && (myWorkflows?.length || 0) > 0 && (
                <section>
                  <SectionHeader
                    icon={Workflow}
                    title={isTeamWorkspace ? "Team Workflows" : "My Workflows"}
                    count={displayMyWorkflows.length}
                    total={myWorkflows?.length}
                    showFraction={!!debouncedSearch}
                  />
                  {displayMyWorkflows.length === 0 ? (
                    <EmptyState
                      variant="compact"
                      icon={Search}
                      title="No workflows match your search"
                      description="Try a different keyword or clear your search."
                      primaryAction={{ label: "Clear search", onClick: () => setSearchQuery("") }}
                    />
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {displayMyWorkflows.map((workflow) => (
                        <WorkflowCard key={workflow.id} workflow={workflow} showEditButton currentUserId={user?.id} showMenerioStatus={hasMenerio} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* My Prompt Kits Section */}
              {isTypeVisible('kits') && (myKits?.length || 0) > 0 && (
                <section>
                  <SectionHeader
                    icon={Package}
                    title={isTeamWorkspace ? "Team Prompt Kits" : "My Prompt Kits"}
                    count={displayMyKits.length}
                    total={myKits?.length}
                    showFraction={!!debouncedSearch}
                  />
                  {displayMyKits.length === 0 ? (
                    <EmptyState
                      variant="compact"
                      icon={Search}
                      title="No prompt kits match your search"
                      description="Try a different keyword or clear your search."
                      primaryAction={{ label: "Clear search", onClick: () => setSearchQuery("") }}
                    />
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {displayMyKits.map((kit) => (
                        <PromptKitCard key={kit.id} kit={kit} showEditButton currentUserId={user?.id} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Saved Prompts Section - only show in personal workspace */}
              {!isTeamWorkspace && isTypeVisible("saved") && (
                <section>
                  <SectionHeader
                    icon={LibraryIcon}
                    title="Saved Prompts"
                    count={displaySavedPrompts.length}
                    total={savedPrompts.length}
                    showFraction={!!debouncedSearch}
                  />
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
                  ) : displaySavedPrompts.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No saved prompts match your search.
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {displaySavedPrompts.map((prompt) => (
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
              {!isTeamWorkspace && isTypeVisible("collections") && (
                <section>
                  <SectionHeader
                    icon={FolderOpen}
                    title="My Collections"
                    count={myCollections?.length || 0}
                    action={
                      <Link to="/collections/new">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          New Collection
                        </Button>
                      </Link>
                    }
                  />
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
                    ? "Contact support for more information about premium features" 
                    : "You have access to all premium features"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* GitHub Sync Success Dialog */}
      <Dialog open={syncSuccessDialogOpen} onOpenChange={setSyncSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Sync Successful
            </DialogTitle>
            <DialogDescription>
              Your {isTeamWorkspace ? "team" : "library"} has been successfully synced to GitHub.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setSyncSuccessDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleOpenGithub} className="gap-2">
              <Github className="h-4 w-4" />
              Open GitHub
              <ExternalLink className="h-3 w-3" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
