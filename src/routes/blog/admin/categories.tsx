import { createFileRoute } from "@tanstack/react-router";
import BlogAdminCategories from "@/pages/blog/admin/BlogAdminCategories";

export const Route = createFileRoute("/blog/admin/categories")({
  component: BlogAdminCategories,
});
