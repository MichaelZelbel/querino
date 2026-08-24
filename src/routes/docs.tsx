import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Docs from "@/pages/Docs";

export const Route = createFileRoute("/docs")({
  head: () =>
    pageHead({
      title: "Documentation — Querino",
      description:
        "Learn how to create, organize, and share AI prompts, prompt kits, skills, and workflows with Querino.",
      canonical: "/docs",
    }),
  component: Docs,
});
