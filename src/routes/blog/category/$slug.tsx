import { createFileRoute } from "@tanstack/react-router";
import BlogCategory from "@/pages/blog/BlogCategory";
import { loadBlogCategory } from "@/lib/route-loaders";
import { pageHead, privateHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/category/$slug")({
  loader: ({ params }) => loadBlogCategory(params.slug),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Category Not Found");
    return pageHead({
      title: `${loaderData.name} - Blog`,
      description:
        loaderData.description || `Posts in the ${loaderData.name} category`,
      canonical: `/blog/category/${loaderData.slug}`,
      rss: true,
    });
  },

  component: BlogCategory,
});
