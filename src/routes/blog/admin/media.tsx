import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import BlogAdminMedia from "@/pages/blog/admin/BlogAdminMedia";

export const Route = createFileRoute("/blog/admin/media")({
  head: () => privateHead("Blog Media"),
  component: BlogAdminMedia,
});
