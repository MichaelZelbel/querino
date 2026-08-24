import { createFileRoute } from "@tanstack/react-router";
import BlogAdminTags from "@/pages/blog/admin/BlogAdminTags";

export const Route = createFileRoute("/blog/admin/tags")({
  component: BlogAdminTags,
});
