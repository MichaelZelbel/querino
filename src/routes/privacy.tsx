import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Privacy from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy Policy",
      description: "How Querino collects, uses and protects your data.",
      canonical: "/privacy",
    }),
  component: Privacy,
});
