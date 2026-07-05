import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptsSection } from "@/components/landing/PromptsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillCard } from "@/components/skills/SkillCard";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { PromptKitCard } from "@/components/promptKits/PromptKitCard";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import { usePromptKits } from "@/hooks/usePromptKits";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, Workflow, Sparkles, Package, Clock, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { categoryOptions } from "@/types/prompt";
import type { ArtifactSortOption } from "@/hooks/useArtifactList";

const VALID_TABS = ["prompts", "kits", "skills", "workflows"];

const Discover = () => {
  // Deep-linkable state: /discover?type=skills&tag=planning&q=meeting
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFilter = searchParams.get("tag") || "";
  const initialQuery = searchParams.get("q") || "";
  const typeParam = searchParams.get("type") || "prompts";

  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(typeParam) ? typeParam : "prompts");
  const [skillSearch, setSkillSearch] = useState(initialQuery);
  const [workflowSearch, setWorkflowSearch] = useState(initialQuery);
  const [kitSearch, setKitSearch] = useState(initialQuery);

  const debouncedSkillSearch = useDebounce(skillSearch, 300);
  const debouncedWorkflowSearch = useDebounce(workflowSearch, 300);
  const debouncedKitSearch = useDebounce(kitSearch, 300);

  // Shared sort + category for the skills/workflows/kits tabs (prompts tab
  // has its own richer toolbar inside PromptsSection).
  const [tabSort, setTabSort] = useState<ArtifactSortOption>("newest");
  const [tabCategory, setTabCategory] = useState("all");

  // Cap public discovery fetches — without a limit these downloaded the
  // entire table (full content bodies included) on every visit.
  const DISCOVER_LIMIT = 60;
  const listOptions = { published: true, sortBy: tabSort, category: tabCategory, limit: DISCOVER_LIMIT };
  const { data: skills, isLoading: skillsLoading } = useSkills({ ...listOptions, searchQuery: debouncedSkillSearch });
  const { data: workflows, isLoading: workflowsLoading } = useWorkflows({ ...listOptions, searchQuery: debouncedWorkflowSearch });
  const { data: kits, isLoading: kitsLoading } = usePromptKits({ ...listOptions, searchQuery: debouncedKitSearch });

  const byTag = <T extends { tags?: string[] | null }>(items: T[] | undefined): T[] =>
    (items || []).filter((item) => !tagFilter || (item.tags || []).includes(tagFilter));

  const visibleSkills = byTag(skills);
  const visibleWorkflows = byTag(workflows);
  const visibleKits = byTag(kits);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("type", tab);
        return next;
      },
      { replace: true }
    );
  };

  const clearTag = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tag");
        return next;
      },
      { replace: true }
    );
  };

  // Sort + category toolbar shared by the non-prompt tabs
  const tabToolbar = (isSearchingTab: boolean) => (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        variant={tabSort === "newest" && !isSearchingTab ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTabSort("newest")}
        disabled={isSearchingTab}
        className="gap-1.5"
      >
        <Clock className="h-4 w-4" />
        Newest
      </Button>
      <Button
        variant={tabSort === "rating" && !isSearchingTab ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTabSort("rating")}
        disabled={isSearchingTab}
        className="gap-1.5"
      >
        <Star className="h-4 w-4" />
        Top Rated
      </Button>
      <Select value={tabCategory} onValueChange={setTabCategory}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categoryOptions.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-full px-4 py-8 overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:flex sm:justify-center">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-4">
                  <TabsTrigger value="prompts" className="gap-2 whitespace-nowrap"><Sparkles className="h-4 w-4" />Prompts</TabsTrigger>
                  <TabsTrigger value="kits" className="gap-2 whitespace-nowrap"><Package className="h-4 w-4" />Prompt Kits</TabsTrigger>
                  <TabsTrigger value="skills" className="gap-2 whitespace-nowrap"><FileText className="h-4 w-4" />Skills</TabsTrigger>
                  <TabsTrigger value="workflows" className="gap-2 whitespace-nowrap"><Workflow className="h-4 w-4" />Workflows</TabsTrigger>
                </TabsList>
              </div>
            </div>

            {tagFilter && activeTab !== "prompts" && (
              <div className="mb-6 flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">Filtered by tag:</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">#{tagFilter}</span>
                <button onClick={clearTag} className="text-muted-foreground underline-offset-2 hover:underline">
                  Clear
                </button>
              </div>
            )}

            <TabsContent value="prompts" className="mt-0">
              <PromptsSection
                showHeader={false}
                tagFilter={tagFilter}
                initialSearch={initialQuery}
                onClearTag={clearTag}
              />
            </TabsContent>

            <TabsContent value="kits" className="mt-0">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Search prompt kits..." value={kitSearch} onChange={(e) => setKitSearch(e.target.value)} className="pl-10" /></div>
                {tabToolbar(!!debouncedKitSearch.trim())}
                {kitsLoading ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /></div>)}</div>
                ) : visibleKits.length > 0 ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleKits.map((kit) => <PromptKitCard key={kit.id} kit={kit} showAuthorInfo />)}</div>
                ) : (
                  <EmptyState
                    variant="compact"
                    icon={Package}
                    title={debouncedKitSearch ? "No prompt kits match your search" : "No prompt kits published yet"}
                    description={debouncedKitSearch ? "Try a different keyword or clear the search." : "Be the first to publish a Prompt Kit for the community."}
                    primaryAction={debouncedKitSearch
                      ? { label: "Clear search", onClick: () => setKitSearch("") }
                      : { label: "Create a Prompt Kit", to: "/prompt-kits/new", icon: Sparkles }}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Search skills..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} className="pl-10" /></div>
                {tabToolbar(!!debouncedSkillSearch.trim())}
                {skillsLoading ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /></div>)}</div>
                ) : visibleSkills.length > 0 ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleSkills.map((skill) => <SkillCard key={skill.id} skill={skill} showAuthorInfo />)}</div>
                ) : (
                  <EmptyState
                    variant="compact"
                    icon={FileText}
                    title={debouncedSkillSearch ? "No skills match your search" : "No skills published yet"}
                    description={debouncedSkillSearch ? "Try a different keyword or clear the search." : "Be the first to publish a Skill for the community."}
                    primaryAction={debouncedSkillSearch
                      ? { label: "Clear search", onClick: () => setSkillSearch("") }
                      : { label: "Create a Skill", to: "/skills/new", icon: Sparkles }}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="workflows" className="mt-0">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Search workflows..." value={workflowSearch} onChange={(e) => setWorkflowSearch(e.target.value)} className="pl-10" /></div>
                {tabToolbar(!!debouncedWorkflowSearch.trim())}
                {workflowsLoading ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /></div>)}</div>
                ) : visibleWorkflows.length > 0 ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleWorkflows.map((workflow) => <WorkflowCard key={workflow.id} workflow={workflow} showAuthorInfo />)}</div>
                ) : (
                  <EmptyState
                    variant="compact"
                    icon={Workflow}
                    title={debouncedWorkflowSearch ? "No workflows match your search" : "No workflows published yet"}
                    description={debouncedWorkflowSearch ? "Try a different keyword or clear the search." : "Be the first to publish a Workflow for the community."}
                    primaryAction={debouncedWorkflowSearch
                      ? { label: "Clear search", onClick: () => setWorkflowSearch("") }
                      : { label: "Create a Workflow", to: "/workflows/new", icon: Sparkles }}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Discover;
