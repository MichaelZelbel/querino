import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Globe, Twitter, Github, UserPlus, Sparkles, BookOpen, Workflow, Activity } from "lucide-react";
import type { Prompt } from "@/types/prompt";
import type { Skill } from "@/types/skill";
import type { Workflow as WorkflowType } from "@/types/workflow";

interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("prompts");

  useEffect(() => {
    async function fetchProfile() {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Find user by display_name or email prefix
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, bio, website, twitter, github")
          .or(`display_name.ilike.${username}`)
          .maybeSingle();

        if (profileError || !profileData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        // Fetch published prompts, skills, workflows in parallel
        const [promptsRes, skillsRes, workflowsRes] = await Promise.all([
          supabase
            .from("prompts")
            .select("*")
            .eq("author_id", profileData.id)
            .eq("is_public", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("skills")
            .select("*")
            .eq("author_id", profileData.id)
            .eq("published", true)
            .order("created_at", { ascending: false }) as any,
          supabase
            .from("workflows")
            .select("*")
            .eq("author_id", profileData.id)
            .eq("published", true)
            .order("created_at", { ascending: false }) as any,
        ]);

        setPrompts(promptsRes.data || []);
        setSkills(skillsRes.data || []);
        setWorkflows(workflowsRes.data || []);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
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

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Creator Not Found
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The creator you're looking for doesn't exist or hasn't published anything yet.
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
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
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
                    <Twitter className="h-4 w-4" />
                    @{profile.twitter.replace("@", "")}
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
              <Button variant="outline" className="gap-2" disabled>
                <UserPlus className="h-4 w-4" />
                Follow (coming soon)
              </Button>
              <Link to={`/u/${encodeURIComponent(username || "")}/activity`}>
                <Button variant="outline" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="prompts" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Prompts ({prompts.length})
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Skills ({skills.length})
              </TabsTrigger>
              <TabsTrigger value="workflows" className="gap-2">
                <Workflow className="h-4 w-4" />
                Workflows ({workflows.length})
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
