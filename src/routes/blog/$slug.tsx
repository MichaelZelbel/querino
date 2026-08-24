import { createFileRoute } from "@tanstack/react-router";
import BlogPost from "@/pages/blog/BlogPost";
import { loadBlogPost } from "@/lib/route-loaders";
import { pageHead, privateHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => loadBlogPost(params.slug),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Post Not Found");
    return pageHead({
      title: loaderData.seo_title || loaderData.title,
      description: loaderData.seo_description || loaderData.excerpt,
      canonical: `/blog/${loaderData.slug}`,
      ogType: "article",
      ogImage: loaderData.og_image_url,
      publishedTime: loaderData.published_at,
      rss: true,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: loaderData.title,
        description:
          loaderData.seo_description || loaderData.excerpt || undefined,
        datePublished: loaderData.published_at || undefined,
        dateModified: loaderData.updated_at || undefined,
        publisher: { "@type": "Organization", name: "Querino" },
      },
    });
  },

  component: BlogPost,
});
