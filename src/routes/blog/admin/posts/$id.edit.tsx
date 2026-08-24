import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import BlogAdminPostEditor from "@/pages/blog/admin/BlogAdminPostEditor";

export const Route = createFileRoute("/blog/admin/posts/$id/edit")({
  head: () => privateHead("Edit Blog Post"),
  component: BlogAdminPostEditor,
});
