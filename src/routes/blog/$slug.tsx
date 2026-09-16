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
      // Same fallback as the page (BlogPost.tsx): until 2026-09-16 a post with
      // only a featured image shared without any image.
      ogImage: loaderData.og_image_url || loaderData.featured_image?.url,
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

  component: RouteComponent,
});

function RouteComponent() {
  // The loader's row seeds the page's query, so the first paint, the one a
  // crawler sees, is the article and not the skeleton.
  return <BlogPost initialPost={Route.useLoaderData()} />;
}
