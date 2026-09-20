import { createFileRoute } from "@tanstack/react-router";
import ArtifactIndex from "@/pages/ArtifactIndex";
import { loadPromptIndex } from "@/lib/route-loaders";
import { pageHead } from "@/lib/seo";

// Server-loaded on the first request, so the links are in the HTML itself.
export const Route = createFileRoute("/prompts/")({
  loader: () => loadPromptIndex(),
  head: () =>
    pageHead({
      title: "All Public Prompts",
      description:
        "Every prompt shared publicly on Querino, in alphabetical order.",
      canonical: "/prompts",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ArtifactIndex
      heading="All Public Prompts"
      intro="Every prompt shared publicly on Querino, in alphabetical order."
      basePath="/prompts"
      entries={Route.useLoaderData()}
    />
  );
}
