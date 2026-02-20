import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, BookOpen, Workflow as WorkflowIcon, Lock, Crown } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import type { SimilarPrompt, SimilarSkill, SimilarWorkflow } from "@/hooks/useSimilarArtefacts";

interface SimilarPromptsSectionProps {
  items: SimilarPrompt[];
  loading: boolean;
}

interface SimilarSkillsSectionProps {
  items: SimilarSkill[];
  loading: boolean;
}

interface SimilarWorkflowsSectionProps {
  items: SimilarWorkflow[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

function LoadingSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function PremiumLockedSection({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary border-0">
          <Crown className="h-2.5 w-2.5" />
          Premium
        </Badge>
      </h2>
      <Card className="overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Similar artefact recommendations are a Premium feature. Contact support to learn more.
          </p>
          <a href="mailto:support@querino.ai">
            <Button size="sm" variant="outline" className="gap-2">
              Contact Support
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

export function SimilarPromptsSection({ items, loading }: SimilarPromptsSectionProps) {
  const { user, profile } = useAuthContext();
  const isPremium = profile?.plan_type === 'premium';
  const isFreeUser = user && !isPremium;

  if (isFreeUser) {
    return <PremiumLockedSection title="Similar Prompts" icon={Sparkles} />;
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Similar Prompts
        </h2>
        <LoadingSkeletons />
      </div>
    );
  }

  if (items.length < 2) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Similar Prompts
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((item) => (
          <Link key={item.id} to={`/prompts/${item.id}`}>
            <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {item.category}
                  </Badge>
                  {item.rating_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {item.rating_avg?.toFixed(1)}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 line-clamp-1 font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SimilarSkillsSection({ items, loading }: SimilarSkillsSectionProps) {
  const { user, profile } = useAuthContext();
  const isPremium = profile?.plan_type === 'premium';
  const isFreeUser = user && !isPremium;

  if (isFreeUser) {
    return <PremiumLockedSection title="Similar Skills" icon={BookOpen} />;
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Similar Skills
        </h2>
        <LoadingSkeletons />
      </div>
    );
  }

  if (items.length < 2) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        Similar Skills
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((item) => (
          <Link key={item.id} to={`/skills/${item.id}`}>
            <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full">
              <CardContent className="p-4">
                <div className="mb-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <BookOpen className="h-3 w-3" />
                    Skill
                  </Badge>
                </div>
                <h3 className="mb-1 line-clamp-1 font-medium text-foreground">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SimilarWorkflowsSection({ items, loading }: SimilarWorkflowsSectionProps) {
  const { user, profile } = useAuthContext();
  const isPremium = profile?.plan_type === 'premium';
  const isFreeUser = user && !isPremium;

  if (isFreeUser) {
    return <PremiumLockedSection title="Similar Workflows" icon={WorkflowIcon} />;
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <WorkflowIcon className="h-5 w-5 text-primary" />
          Similar Workflows
        </h2>
        <LoadingSkeletons />
      </div>
    );
  }

  if (items.length < 2) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
        <WorkflowIcon className="h-5 w-5 text-primary" />
        Similar Workflows
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((item) => (
          <Link key={item.id} to={`/workflows/${item.id}`}>
            <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full">
              <CardContent className="p-4">
                <div className="mb-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <WorkflowIcon className="h-3 w-3" />
                    Workflow
                  </Badge>
                </div>
                <h3 className="mb-1 line-clamp-1 font-medium text-foreground">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
