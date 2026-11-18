import { createFileRoute } from "@tanstack/react-router";
import ArtifactIndex from "@/pages/ArtifactIndex";
import { loadPromptKitIndex } from "@/lib/route-loaders";
import { pageHead } from "@/lib/seo";

// Server-loaded on the first request, so the links are in the HTML itself.
export const Route = createFileRoute("/prompt-kits/")({
  loader: () => loadPromptKitIndex(),
  head: () =>
    pageHead({
      title: "All Public Prompt Kits",
      description:
        "Every prompt kit shared publicly on Querino, in alphabetical order.",
      canonical: "/prompt-kits",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ArtifactIndex
      heading="All Public Prompt Kits"
      intro="Every prompt kit shared publicly on Querino, in alphabetical order."
      basePath="/prompt-kits"
      entries={Route.useLoaderData()}
    />
  );
}
