import { createFileRoute } from "@tanstack/react-router";
import ArtifactIndex from "@/pages/ArtifactIndex";
import { loadSkillIndex } from "@/lib/route-loaders";
import { pageHead } from "@/lib/seo";

// Server-loaded on the first request, so the links are in the HTML itself.
export const Route = createFileRoute("/skills/")({
  loader: () => loadSkillIndex(),
  head: () =>
    pageHead({
      title: "All Public Skills",
      description:
        "Every skill shared publicly on Querino, in alphabetical order.",
      canonical: "/skills",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ArtifactIndex
      heading="All Public Skills"
      intro="Every skill shared publicly on Querino, in alphabetical order."
      basePath="/skills"
      entries={Route.useLoaderData()}
    />
  );
}
