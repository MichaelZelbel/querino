import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useSearchParams } from "@/lib/router-compat";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptsSection } from "@/components/landing/PromptsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillCard } from "@/components/skills/SkillCard";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { PromptKitCard } from "@/components/promptKits/PromptKitCard";
import { DiscoverToolbar } from "@/components/discover/DiscoverToolbar";
import {
  readDiscoverParams,
  writeDiscoverParams,
  type DiscoverTab,
} from "@/components/discover/discoverParams";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import { usePromptKits } from "@/hooks/usePromptKits";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { FileText, Workflow, Sparkles, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthContext } from "@/contexts/AuthContext";
import type { ArtifactSortOption } from "@/hooks/useArtifactList";

const Discover = () => {
  // Deep-linkable state: /discover?type=skills&tag=planning&q=meeting&sort=rating&category=coding
  // (see discoverParams.ts). Back from a card returns to the same list.
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const state = readDiscoverParams(searchParams);
  const { tab: activeTab, tag: tagFilter } = state;

  // Writes go through the router directly so a search or filter change can
  // keep the scroll position; router-compat's setter always scrolls to the top.
  const replaceParams = useCallback(
    (
      change: Parameters<typeof writeDiscoverParams>[1],
      resetScroll = false,
    ) => {
      const live = router.state.location;
      const next = writeDiscoverParams(
        new URLSearchParams(live.searchStr ?? ""),
        change,
      );
      const search: Record<string, string> = {};
      next.forEach((v, k) => {
        search[k] = v;
      });
      router.navigate({
        to: live.pathname,
        search: search as never,
        replace: true,
        resetScroll,
      });
    },
    [router],
  );

  // The box updates on every keystroke; the address (and the queries that
  // read it) follow once typing pauses. `written` is the last value this page
  // put in the address, so a keystroke typed while that write lands is not
  // overwritten by it; any other change of ?q= (the site search, Back) is.
  const [searchInput, setSearchInput] = useState(state.q);
  const written = useRef(state.q);
  useEffect(() => {
    if (state.q !== written.current) {
      written.current = state.q;
      setSearchInput(state.q);
    }
  }, [state.q]);
  const debouncedSearch = useDebounce(searchInput, 300);
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q === written.current) return;
    written.current = q;
    replaceParams({ q });
  }, [debouncedSearch, replaceParams]);

  const isSearching = state.q.trim().length > 0;
  // Skills, workflows and kits have no "trending"; their hooks get newest.
  const artifactSort: ArtifactSortOption =
    state.sort === "rating" ? "rating" : "newest";

  // Cap public discovery fetches — without a limit these downloaded the
  // entire table (full content bodies included) on every visit.
  const DISCOVER_LIMIT = 60;
  const listOptions = {
    published: true,
    sortBy: artifactSort,
    category: state.category,
    tag: tagFilter || undefined,
    limit: DISCOVER_LIMIT,
    searchQuery: state.q,
  };
  const {
    data: skills,
    isLoading: skillsLoading,
    isError: skillsError,
    refetch: refetchSkills,
  } = useSkills(listOptions);
  const {
    data: workflows,
    isLoading: workflowsLoading,
    isError: workflowsError,
    refetch: refetchWorkflows,
  } = useWorkflows(listOptions);
  const {
    data: kits,
    isLoading: kitsLoading,
    isError: kitsError,
    refetch: refetchKits,
  } = usePromptKits(listOptions);

  // The tag is filtered on the server (see useArtifactList), so the 60-row cap
  // applies to tagged rows rather than hiding matches past the first 60.
  const visibleSkills = skills || [];
  const visibleWorkflows = workflows || [];
  const visibleKits = kits || [];

  const handleTabChange = (tab: string) => {
    replaceParams({ tab: tab as DiscoverTab }, true);
  };
  const clearTag = () => replaceParams({ tag: "" });
  const clearSearch = () => {
    setSearchInput("");
    written.current = "";
    replaceParams({ q: "" });
  };
  const clearFilters = () => {
    setSearchInput("");
    written.current = "";
    replaceParams({ q: "", category: "all", tag: "" });
  };

  const toolbar = (
    <DiscoverToolbar
      tab={activeTab}
      search={searchInput}
      onSearchChange={setSearchInput}
      sort={state.sort}
      onSortChange={(sort) => replaceParams({ sort })}
      isSearching={isSearching}
      category={state.category}
      onCategoryChange={(category) => replaceParams({ category })}
      tag={tagFilter}
      onClearTag={clearTag}
    />
  );

  const loadError = (what: string, retry: () => void) => (
    <div className="py-12 text-center">
      <p className="text-lg text-destructive">Failed to load {what}.</p>
      <Button variant="outline" className="mt-4" onClick={retry}>
        Try again
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <h1 className="sr-only">
          Discover prompts, skills, workflows and kits
        </h1>
        <div className="container mx-auto max-w-full px-4 py-8 overflow-x-clip">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:flex sm:justify-center">
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-4">
                  <TabsTrigger
                    value="prompts"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Sparkles className="h-4 w-4" />
                    Prompts
                  </TabsTrigger>
                  <TabsTrigger
                    value="skills"
                    className="gap-2 whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4" />
                    Skills
                  </TabsTrigger>
                  <TabsTrigger
                    value="workflows"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Workflow className="h-4 w-4" />
                    Workflows
                  </TabsTrigger>
                  <TabsTrigger value="kits" className="gap-2 whitespace-nowrap">
                    <Package className="h-4 w-4" />
                    Prompt Kits
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="mb-6">{toolbar}</div>

            <TabsContent value="prompts" className="mt-0">
              <PromptsSection
                showHeader={false}
                tagFilter={tagFilter}
                controlled={{
                  searchQuery: state.q,
                  sortBy: state.sort,
                  category: state.category,
                  onClearFilters: clearFilters,
                }}
              />
            </TabsContent>

            <TabsContent value="kits" className="mt-0">
              <div className="space-y-6">
                {kitsError ? (
                  loadError("prompt kits", () => void refetchKits())
                ) : kitsLoading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="space-y-4 rounded-xl border border-border bg-card p-6"
                      >
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : visibleKits.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visibleKits.map((kit) => (
                      <PromptKitCard key={kit.id} kit={kit} showAuthorInfo />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    variant="compact"
                    icon={Package}
                    title={
                      isSearching
                        ? "No prompt kits match your search"
                        : tagFilter
                          ? `No prompt kits tagged #${tagFilter}`
                          : "No prompt kits published yet"
                    }
                    description={
                      isSearching
                        ? "Try a different keyword or clear the search."
                        : tagFilter
                          ? "Clear the tag to see everything that is published."
                          : "Be the first to publish a Prompt Kit for the community."
                    }
                    primaryAction={
                      isSearching
                        ? {
                            label: "Clear search",
                            onClick: clearSearch,
                          }
                        : tagFilter
                          ? { label: "Clear tag", onClick: clearTag }
                          : user
                            ? {
                                label: "Create a Prompt Kit",
                                to: "/prompt-kits/new",
                                icon: Sparkles,
                              }
                            : {
                                label: "Sign up to create a kit",
                                to: "/auth?tab=signup",
                                icon: Sparkles,
                              }
                    }
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <div className="space-y-6">
                {skillsError ? (
                  loadError("skills", () => void refetchSkills())
                ) : skillsLoading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="space-y-4 rounded-xl border border-border bg-card p-6"
                      >
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : visibleSkills.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visibleSkills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} showAuthorInfo />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    variant="compact"
                    icon={FileText}
                    title={
                      isSearching
                        ? "No skills match your search"
                        : tagFilter
                          ? `No skills tagged #${tagFilter}`
                          : "No skills published yet"
                    }
                    description={
                      isSearching
                        ? "Try a different keyword or clear the search."
                        : tagFilter
                          ? "Clear the tag to see everything that is published."
                          : "Be the first to publish a Skill for the community."
                    }
                    primaryAction={
                      isSearching
                        ? {
                            label: "Clear search",
                            onClick: clearSearch,
                          }
                        : tagFilter
                          ? { label: "Clear tag", onClick: clearTag }
                          : user
                            ? {
                                label: "Create a Skill",
                                to: "/skills/new",
                                icon: Sparkles,
                              }
                            : {
                                label: "Sign up to create a skill",
                                to: "/auth?tab=signup",
                                icon: Sparkles,
                              }
                    }
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="workflows" className="mt-0">
              <div className="space-y-6">
                {workflowsError ? (
                  loadError("workflows", () => void refetchWorkflows())
                ) : workflowsLoading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="space-y-4 rounded-xl border border-border bg-card p-6"
                      >
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : visibleWorkflows.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visibleWorkflows.map((workflow) => (
                      <WorkflowCard
                        key={workflow.id}
                        workflow={workflow}
                        showAuthorInfo
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    variant="compact"
                    icon={Workflow}
                    title={
                      isSearching
                        ? "No workflows match your search"
                        : tagFilter
                          ? `No workflows tagged #${tagFilter}`
                          : "No workflows published yet"
                    }
                    description={
                      isSearching
                        ? "Try a different keyword or clear the search."
                        : tagFilter
                          ? "Clear the tag to see everything that is published."
                          : "Be the first to publish a Workflow for the community."
                    }
                    primaryAction={
                      isSearching
                        ? {
                            label: "Clear search",
                            onClick: clearSearch,
                          }
                        : tagFilter
                          ? { label: "Clear tag", onClick: clearTag }
                          : user
                            ? {
                                label: "Create a Workflow",
                                to: "/workflows/new",
                                icon: Sparkles,
                              }
                            : {
                                label: "Sign up to create a workflow",
                                to: "/auth?tab=signup",
                                icon: Sparkles,
                              }
                    }
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
