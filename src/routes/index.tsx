import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: "Querino - AI Prompt Library for Creators",
      description:
        "Thousands of curated prompts, your personal library, and a tiny mascot who genuinely cares whether your prompts are good.",
      canonical: "/",
    }),
  component: Index,
});
