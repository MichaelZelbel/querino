import { createFileRoute } from "@tanstack/react-router";
import BlogTag from "@/pages/blog/BlogTag";
import { loadBlogTag } from "@/lib/route-loaders";
import { pageHead, privateHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/tag/$slug")({
  loader: ({ params }) => loadBlogTag(params.slug),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Tag Not Found");
    return pageHead({
      title: `#${loaderData.name} - Blog`,
      description: `Posts tagged with ${loaderData.name}`,
      canonical: `/blog/tag/${loaderData.slug}`,
      rss: true,
    });
  },

  component: BlogTag,
});
