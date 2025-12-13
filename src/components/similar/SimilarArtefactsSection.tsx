import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Sparkles, BookOpen, Workflow as WorkflowIcon } from "lucide-react";
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

export function SimilarPromptsSection({ items, loading }: SimilarPromptsSectionProps) {
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
                  {item.short_description}
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
