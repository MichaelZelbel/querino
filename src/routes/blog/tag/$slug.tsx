import { createFileRoute } from "@tanstack/react-router";
import BlogTag from "@/pages/blog/BlogTag";

export const Route = createFileRoute("/blog/tag/$slug")({
  component: BlogTag,
});
