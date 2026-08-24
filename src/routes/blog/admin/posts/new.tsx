import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import BlogAdminPostEditor from "@/pages/blog/admin/BlogAdminPostEditor";

export const Route = createFileRoute("/blog/admin/posts/new")({
  head: () => privateHead("New Blog Post"),
  component: BlogAdminPostEditor,
});
