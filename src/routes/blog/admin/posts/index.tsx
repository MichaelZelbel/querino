import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import BlogAdminPosts from "@/pages/blog/admin/BlogAdminPosts";

export const Route = createFileRoute("/blog/admin/posts/")({
  head: () => privateHead("Blog Posts"),
  component: BlogAdminPosts,
});
