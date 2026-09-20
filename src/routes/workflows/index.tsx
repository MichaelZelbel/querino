import { createFileRoute } from "@tanstack/react-router";
import ArtifactIndex from "@/pages/ArtifactIndex";
import { loadWorkflowIndex } from "@/lib/route-loaders";
import { pageHead } from "@/lib/seo";

// Server-loaded on the first request, so the links are in the HTML itself.
export const Route = createFileRoute("/workflows/")({
  loader: () => loadWorkflowIndex(),
  head: () =>
    pageHead({
      title: "All Public Workflows",
      description:
        "Every workflow shared publicly on Querino, in alphabetical order.",
      canonical: "/workflows",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ArtifactIndex
      heading="All Public Workflows"
      intro="Every workflow shared publicly on Querino, in alphabetical order."
      basePath="/workflows"
      entries={Route.useLoaderData()}
    />
  );
}
