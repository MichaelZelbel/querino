import { useState, type ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PromptCard } from "@/components/prompts/PromptCard";
import { SkillCard } from "@/components/skills/SkillCard";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { PromptKitCard } from "@/components/promptKits/PromptKitCard";
import {
  Globe,
  Twitter,
  Github,
  Sparkles,
  BookOpen,
  Workflow,
  Activity,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadProfileListPage,
  type ProfileListRow,
  type ProfilePageData,
} from "@/lib/route-loaders";
import type { ArtifactListTable } from "@/lib/artifactListColumns";
import {
  appendProfilePage,
  hasMoreInProfileList,
  type ProfileList,
} from "@/lib/profileLists";

/**
 * One profile list: the loader's first page, then each page "Load more"
 * brings, until every public item of the person is shown.
 */
function useProfileList<Table extends ArtifactListTable>(
  table: Table,
  authorId: string,
  first: ProfileList<ProfileListRow[Table]>,
) {
  const [list, setList] = useState(first);
  const [loading, setLoading] = useState(false);
  // The loader ran again (a sign-in, say): start over from its new first page.
  const [shownFirst, setShownFirst] = useState(first);
  if (shownFirst !== first) {
    setShownFirst(first);
    setList(first);
  }

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const page = await loadProfileListPage(
        table,
        authorId,
        list.items.length,
      );
      setList((current) => appendProfilePage(current, page));
    } catch {
      toast.error("Could not load more. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { list, loading, loadMore, hasMore: hasMoreInProfileList(list) };
}

function ProfileListTab<T extends { id: string }>({
  list,
  hasMore,
  loading,
  loadMore,
  kind,
  icon,
  renderItem,
}: {
  list: ProfileList<T>;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  kind: string;
  icon: ReactNode;
  renderItem: (item: T) => ReactNode;
}) {
  if (list.items.length === 0) {
    return (
      <div className="py-12 text-center">
        {icon}
        <p className="text-muted-foreground">
          This creator has not published any {kind} yet.
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.items.map(renderItem)}
      </div>
      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {list.items.length} of {list.total} {kind}
          </p>
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}

/** The route's not-found view: no profile has this name (HTTP 404). */
export function UserProfileNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 text-display-md font-bold text-foreground">
            Creator Not Found
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            The creator you're looking for doesn't exist or hasn't published
            anything yet.
          </p>
          <Link to="/discover">
            <Button>Browse Discover</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/** Shown while another profile loads, so the previous one never stays on screen. */
export function UserProfileSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96 max-w-full" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function UserProfile({
  username,
  data,
}: {
  username: string;
  data: ProfilePageData;
}) {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("prompts");
  const { profile } = data;
  const prompts = useProfileList("prompts", profile.id, data.prompts);
  const skills = useProfileList("skills", profile.id, data.skills);
  const workflows = useProfileList("workflows", profile.id, data.workflows);
  const promptKits = useProfileList("prompt_kits", profile.id, data.promptKits);

  const getInitials = () => {
    if (profile.display_name) {
      return profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Profile Header */}
          <div className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="mb-2 text-display-sm font-bold text-foreground">
                {profile.display_name || "Anonymous Creator"}
              </h1>

              {profile.bio && (
                <p className="mb-4 text-muted-foreground max-w-xl">
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {profile.website && (
                  <a
                    href={
                      profile.website.startsWith("http")
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={`https://x.com/${profile.twitter.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter className="h-4 w-4" />@
                    {profile.twitter.replace("@", "")}
                  </a>
                )}
                {profile.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    {profile.github}
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to={`/u/${encodeURIComponent(username)}/activity`}>
                <Button variant="outline" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="prompts" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Prompts ({prompts.list.total})
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Skills ({skills.list.total})
              </TabsTrigger>
              <TabsTrigger value="workflows" className="gap-2">
                <Workflow className="h-4 w-4" />
                Workflows ({workflows.list.total})
              </TabsTrigger>
              <TabsTrigger value="promptKits" className="gap-2">
                <Package className="h-4 w-4" />
                Prompt Kits ({promptKits.list.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompts">
              <ProfileListTab
                {...prompts}
                kind="prompts"
                icon={
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                }
                renderItem={(prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    currentUserId={user?.id}
                    showAuthorInfo={false}
                  />
                )}
              />
            </TabsContent>

            <TabsContent value="skills">
              <ProfileListTab
                {...skills}
                kind="skills"
                icon={
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                }
                renderItem={(skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    currentUserId={user?.id}
                  />
                )}
              />
            </TabsContent>

            <TabsContent value="workflows">
              <ProfileListTab
                {...workflows}
                kind="workflows"
                icon={
                  <Workflow className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                }
                renderItem={(workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    currentUserId={user?.id}
                  />
                )}
              />
            </TabsContent>

            <TabsContent value="promptKits">
              <ProfileListTab
                {...promptKits}
                kind="prompt kits"
                icon={
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                }
                renderItem={(kit) => (
                  <PromptKitCard
                    key={kit.id}
                    kit={kit}
                    currentUserId={user?.id}
                  />
                )}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
