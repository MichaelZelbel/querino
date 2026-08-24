import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import BlogAdminDashboard from "@/pages/blog/admin/BlogAdminDashboard";

export const Route = createFileRoute("/blog/admin/")({
  head: () => privateHead("Blog Admin"),
  component: BlogAdminDashboard,
});
