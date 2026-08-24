import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import BlogAdminTags from "@/pages/blog/admin/BlogAdminTags";

export const Route = createFileRoute("/blog/admin/tags")({
  head: () => privateHead("Blog Tags"),
  component: BlogAdminTags,
});
