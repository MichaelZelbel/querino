import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCloneSkill } from "@/hooks/useCloneSkill";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, ArrowLeft, Pencil, Lock, Calendar, Tag, Files, BookOpen, FolderPlus } from "lucide-react";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { ActivitySidebar } from "@/components/activity/ActivitySidebar";
import { toast } from "sonner";
import type { Skill, SkillAuthor } from "@/types/skill";
import { format } from "date-fns";

interface SkillWithAuthor extends Skill {
  author?: SkillAuthor | null;
}

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { cloneSkill, cloning } = useCloneSkill();
  const [skill, setSkill] = useState<SkillWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const isAuthor = skill?.author_id && user?.id === skill.author_id;

  useEffect(() => {
    async function fetchSkill() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase
          .from("skills") as any)
          .select(`
            *,
            profiles:author_id (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching skill:", error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else {
          const skillData: SkillWithAuthor = {
            ...data,
            author: data.profiles || null,
          };
          setSkill(skillData);
        }
      } catch (err) {
        console.error("Error fetching skill:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSkill();
  }, [id]);

  const handleCopy = async () => {
    if (!skill) return;
    
    try {
      await navigator.clipboard.writeText(skill.content);
      setCopied(true);
      toast.success("Skill content copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy skill");
    }
  };

  const getAuthorInitials = () => {
    if (skill?.author?.display_name) {
      return skill.author.display_name
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
          <div className="container mx-auto max-w-4xl px-4">
            <Skeleton className="mb-4 h-8 w-48" />
            <Skeleton className="mb-8 h-12 w-3/4" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !skill) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="mb-4 text-display-md font-bold text-foreground">
              Skill Not Found
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              The skill you're looking for doesn't exist or is no longer available.
            </p>
            <Link to="/discover">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Discover
              </Button>
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
        <div className="container mx-auto max-w-4xl px-4">
          <Link 
            to="/discover" 
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>

          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="text-sm gap-1">
                <BookOpen className="h-3 w-3" />
                Skill
              </Badge>
              {!skill.published && isAuthor && (
                <Badge variant="outline" className="gap-1 text-sm">
                  <Lock className="h-3 w-3" />
                  Draft
                </Badge>
              )}
              {skill.tags && skill.tags.length > 0 && (
                <>
                  {skill.tags.slice(0, 5).map((tag) => (
                    <Badge 
                      key={tag}
                      variant="outline" 
                      className="text-sm gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </>
              )}
            </div>
            
            <h1 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
              {skill.title}
            </h1>
            
            {skill.description && (
              <p className="text-lg text-muted-foreground">
                {skill.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-6">
              {skill.author && (
                <Link 
                  to={`/u/${encodeURIComponent(skill.author.display_name || "")}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={skill.author.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getAuthorInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      {skill.author.display_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </Link>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {format(new Date(skill.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Skill Content
            </h2>
            <div className="relative rounded-xl border border-border bg-muted/30 p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                {skill.content}
              </pre>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant={copied ? "success" : "default"}
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Skill
                </>
              )}
            </Button>

            {isAuthor && (
              <Link to={`/skills/${id}/edit`}>
                <Button size="lg" variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Skill
                </Button>
              </Link>
            )}

            {user && !isAuthor && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => cloneSkill(skill, user.id)}
                disabled={cloning}
                className="gap-2"
              >
                <Files className="h-4 w-4" />
                {cloning ? "Cloning..." : "Clone Skill"}
              </Button>
            )}

            {user && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowCollectionModal(true)}
                className="gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Add to Collection
              </Button>
            )}
          </div>

          {/* Add to Collection Modal */}
          <AddToCollectionModal
            open={showCollectionModal}
            onOpenChange={setShowCollectionModal}
            itemType="skill"
            itemId={skill.id}
          />

          {/* Activity Sidebar */}
          <div className="mt-8">
            <ActivitySidebar itemId={skill.id} itemType="skill" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
