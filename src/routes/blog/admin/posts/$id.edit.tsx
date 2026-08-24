import { createFileRoute } from "@tanstack/react-router";
import BlogAdminPostEditor from "@/pages/blog/admin/BlogAdminPostEditor";

export const Route = createFileRoute("/blog/admin/posts/$id/edit")({
  component: BlogAdminPostEditor,
});
