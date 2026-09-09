import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogAdminLayout } from "@/components/blog/admin/BlogAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogTags } from "@/hooks/useBlogTags";
import { useBlogMedia } from "@/hooks/useBlogMedia";
import { FileText, FolderOpen, Tags, Image, Plus } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatDistanceToNow } from "date-fns";
import type { BlogPostStatus } from "@/types/blog";

// The Recent Posts list is capped at five, so the totals cannot be counted from
// it. Ask the database for the real count per status instead.
function useBlogPostCount(status: BlogPostStatus) {
  return useQuery({
    queryKey: ["blog-post-count", status],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export default function BlogAdminDashboard() {
  const { data: posts } = useBlogPosts({ limit: 5 });
  const { data: categories } = useBlogCategories();
  const { data: tags } = useBlogTags();
  const { data: media } = useBlogMedia();
  const { data: publishedCount = 0 } = useBlogPostCount("published");
  const { data: draftCount = 0 } = useBlogPostCount("draft");

  const stats = [
    {
      label: "Published",
      value: publishedCount,
      icon: FileText,
      color: "text-green-500",
    },
    {
      label: "Drafts",
      value: draftCount,
      icon: FileText,
      color: "text-amber-500",
    },
    {
      label: "Categories",
      value: categories?.length || 0,
      icon: FolderOpen,
      color: "text-blue-500",
    },
    {
      label: "Tags",
      value: tags?.length || 0,
      icon: Tags,
      color: "text-purple-500",
    },
    {
      label: "Media",
      value: media?.length || 0,
      icon: Image,
      color: "text-pink-500",
    },
  ];

  return (
    <BlogAdminLayout
      title="Dashboard"
      actions={
        <Button asChild>
          <Link to="/blog/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Posts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/blog/admin/posts">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {posts && posts.length > 0 ? (
              <div className="space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/blog/admin/posts/${post.id}/edit`}
                        className="font-medium hover:underline truncate block"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        post.status === "published"
                          ? "bg-green-500/10 text-green-600"
                          : post.status === "scheduled"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No posts yet.{" "}
                <Link
                  to="/blog/admin/posts/new"
                  className="text-primary hover:underline"
                >
                  Create your first post
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link
              to="/blog/admin/posts/new"
              className="flex flex-col items-center gap-2"
            >
              <FileText className="h-5 w-5" />
              <span>New Post</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link
              to="/blog/admin/categories"
              className="flex flex-col items-center gap-2"
            >
              <FolderOpen className="h-5 w-5" />
              <span>Categories</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link
              to="/blog/admin/tags"
              className="flex flex-col items-center gap-2"
            >
              <Tags className="h-5 w-5" />
              <span>Tags</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4" asChild>
            <Link
              to="/blog/admin/media"
              className="flex flex-col items-center gap-2"
            >
              <Image className="h-5 w-5" />
              <span>Media</span>
            </Link>
          </Button>
        </div>
      </div>
    </BlogAdminLayout>
  );
}
