import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import BlogList from "@/pages/blog/BlogList";

export const Route = createFileRoute("/blog/")({
  head: () =>
    pageHead({
      title: "Blog",
      description: "Explore articles about AI prompts, workflows, and productivity tips.",
      canonical: "/blog",
      rss: true,
    }),
  component: BlogList,
});
