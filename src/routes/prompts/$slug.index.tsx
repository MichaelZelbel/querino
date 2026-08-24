import { createFileRoute } from "@tanstack/react-router";
import PromptDetail from "@/pages/PromptDetail";
import { loadPrompt } from "@/lib/route-loaders";
import { creativeWorkJsonLd, pageHead, privateHead } from "@/lib/seo";

// The loader runs on the server for the first request, so the artefact is in the HTML
// and head() can build a real title from a real record. Before this, every route served
// the same site-wide title and no canonical link at all.
export const Route = createFileRoute("/prompts/$slug/")({
  loader: ({ params }) => loadPrompt(params.slug),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Not Found");
    const url = `/prompts/${loaderData.slug ?? loaderData.id}`;
    const description =
      loaderData.summary ||
      loaderData.description ||
      `${loaderData.title} — AI prompt on Querino`;
    return pageHead({
      title: loaderData.title,
      description,
      canonical: url,
      jsonLd: creativeWorkJsonLd({
        name: loaderData.title,
        description,
        url,
        author: loaderData.author?.display_name ?? null,
        datePublished: loaderData.published_at ?? loaderData.created_at ?? null,
        dateModified: loaderData.updated_at ?? null,
        genre: (loaderData.category as string | undefined) ?? null,
        inLanguage: (loaderData.language as string | undefined) ?? null,
      }),
    });
  },

  component: RouteComponent,
});

function RouteComponent() {
  // Handed to the page so its first render already has the record. The page keeps its
  // own fetch for slug changes and for staying current; this only removes the empty
  // first paint, which is the paint a crawler sees.
  return <PromptDetail initialPrompt={Route.useLoaderData()} />;
}
