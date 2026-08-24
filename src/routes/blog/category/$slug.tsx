import { createFileRoute } from "@tanstack/react-router";
import BlogCategory from "@/pages/blog/BlogCategory";

export const Route = createFileRoute("/blog/category/$slug")({
  component: BlogCategory,
});
