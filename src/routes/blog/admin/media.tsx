import { createFileRoute } from "@tanstack/react-router";
import BlogAdminMedia from "@/pages/blog/admin/BlogAdminMedia";

export const Route = createFileRoute("/blog/admin/media")({
  component: BlogAdminMedia,
});
