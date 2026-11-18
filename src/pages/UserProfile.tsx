import { useState } from "react";
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
import type { ProfilePageData } from "@/lib/route-loaders";
import { PROFILE_LIST_LIMIT } from "@/lib/profileLists";

function MoreNote({ kind }: { kind: string }) {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Showing the {PROFILE_LIST_LIMIT} newest {kind}. Find the rest on{" "}
      <Link to="/discover" className="text-primary hover:underline">
        Discover
      </Link>
      .
    </p>
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
  data: ProfilePageData | null;
}) {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("prompts");

  if (!data) {
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

  const { profile, prompts, skills, workflows, promptKits, truncated } = data;

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
                Prompts ({prompts.length}
                {truncated.prompts ? "+" : ""})
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Skills ({skills.length}
                {truncated.skills ? "+" : ""})
              </TabsTrigger>
              <TabsTrigger value="workflows" className="gap-2">
                <Workflow className="h-4 w-4" />
                Workflows ({workflows.length}
                {truncated.workflows ? "+" : ""})
              </TabsTrigger>
              <TabsTrigger value="promptKits" className="gap-2">
                <Package className="h-4 w-4" />
                Prompt Kits ({promptKits.length}
                {truncated.promptKits ? "+" : ""})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prompts">
              {prompts.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    This creator has not published any prompts yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      currentUserId={user?.id}
                      showAuthorInfo={false}
                    />
                  ))}
                </div>
              )}
              {truncated.prompts && <MoreNote kind="prompts" />}
            </TabsContent>

            <TabsContent value="skills">
              {skills.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    This creator has not published any skills yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {skills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
              {truncated.skills && <MoreNote kind="skills" />}
            </TabsContent>

            <TabsContent value="workflows">
              {workflows.length === 0 ? (
                <div className="py-12 text-center">
                  <Workflow className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    This creator has not published any workflows yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {workflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
              {truncated.workflows && <MoreNote kind="workflows" />}
            </TabsContent>

            <TabsContent value="promptKits">
              {promptKits.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    This creator has not published any prompt kits yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {promptKits.map((kit) => (
                    <PromptKitCard
                      key={kit.id}
                      kit={kit}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
              {truncated.promptKits && <MoreNote kind="prompt kits" />}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
