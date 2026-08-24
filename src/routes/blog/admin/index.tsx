import { createFileRoute } from "@tanstack/react-router";
import BlogAdminDashboard from "@/pages/blog/admin/BlogAdminDashboard";

export const Route = createFileRoute("/blog/admin/")({
  component: BlogAdminDashboard,
});
