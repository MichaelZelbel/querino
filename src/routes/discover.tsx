import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Discover from "@/pages/Discover";

export const Route = createFileRoute("/discover")({
  head: () =>
    pageHead({
      title: "Discover AI Prompts, Skills and Workflows",
      description:
        "Browse curated AI prompts, prompt kits, skills and workflows shared by the Querino community.",
      canonical: "/discover",
    }),
  component: Discover,
});
