import { Link } from "@/lib/router-compat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Sparkles,
  BookOpen,
  Package,
  Workflow as WorkflowIcon,
} from "lucide-react";
import type { SimilarArtefactType } from "@/hooks/useSimilarArtefacts";

interface SimilarItem {
  id: string;
  title: string;
  description: string | null;
  category?: string;
  rating_avg?: number;
  rating_count?: number;
}

interface SimilarArtefactsSectionProps {
  type: SimilarArtefactType;
  items: SimilarItem[];
  loading: boolean;
}

const SECTION: Record<
  SimilarArtefactType,
  { title: string; label: string; basePath: string; icon: React.ElementType }
> = {
  prompt: {
    title: "Similar Prompts",
    label: "Prompt",
    basePath: "/prompts",
    icon: Sparkles,
  },
  skill: {
    title: "Similar Skills",
    label: "Skill",
    basePath: "/skills",
    icon: BookOpen,
  },
  workflow: {
    title: "Similar Workflows",
    label: "Workflow",
    basePath: "/workflows",
    icon: WorkflowIcon,
  },
  "prompt-kit": {
    title: "Similar Prompt Kits",
    label: "Prompt Kit",
    basePath: "/prompt-kits",
    icon: Package,
  },
};

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

export function SimilarArtefactsSection({
  type,
  items,
  loading,
}: SimilarArtefactsSectionProps) {
  const { title, label, basePath, icon: Icon } = SECTION[type];

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : items.slice(0, 6).map((item) => (
              <Link key={item.id} to={`${basePath}/${item.id}`}>
                <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      {item.category ? (
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {item.category}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Icon className="h-3 w-3" />
                          {label}
                        </Badge>
                      )}
                      {!!item.rating_count && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {item.rating_avg?.toFixed(1)}
                        </span>
                      )}
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
