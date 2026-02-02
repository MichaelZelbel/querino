import { Link } from "react-router-dom";
import { usePublicCategories, usePublicTags } from "@/hooks/usePublicBlog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function BlogSidebar() {
  const { data: categories, isLoading: loadingCategories } = usePublicCategories();
  const { data: tags, isLoading: loadingTags } = usePublicTags();

  return (
    <aside className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Categories
        </h3>
        {loadingCategories ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        ) : categories && categories.length > 0 ? (
          <ul className="space-y-1.5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to={`/blog/category/${category.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No categories yet</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
          Tags
        </h3>
        {loadingTags ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        ) : tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} to={`/blog/tag/${tag.slug}`}>
                <Badge variant="secondary" className="hover:bg-primary/10 cursor-pointer">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags yet</p>
        )}
      </div>
    </aside>
  );
}
