import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Terms from "@/pages/Terms";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      title: "Terms of Service",
      description: "The terms that govern your use of Querino.",
      canonical: "/terms",
    }),
  component: Terms,
});
