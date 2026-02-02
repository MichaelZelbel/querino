import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import type { BlogPost } from "@/types/blog";

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const authorName = post.author?.display_name || "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const publishedDate = post.published_at 
    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
    : null;

  return (
    <Card variant="interactive" className="overflow-hidden">
      <Link to={`/blog/${post.slug}`} className="block">
        {post.featured_image?.url && (
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            <img
              src={post.featured_image.url}
              alt={post.featured_image.alt_text || post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className="p-5">
          <h2 className="text-xl font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author?.avatar_url || undefined} alt={authorName} />
              <AvatarFallback className="text-xs">{authorInitial}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{authorName}</span>
              {publishedDate && (
                <span className="text-xs text-muted-foreground">{publishedDate}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
