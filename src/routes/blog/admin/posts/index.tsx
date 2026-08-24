import { createFileRoute } from "@tanstack/react-router";
import BlogAdminPosts from "@/pages/blog/admin/BlogAdminPosts";

export const Route = createFileRoute("/blog/admin/posts/")({
  component: BlogAdminPosts,
});
