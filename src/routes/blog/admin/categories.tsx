import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import BlogAdminCategories from "@/pages/blog/admin/BlogAdminCategories";

export const Route = createFileRoute("/blog/admin/categories")({
  head: () => privateHead("Blog Categories"),
  component: BlogAdminCategories,
});
