import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import CommunityGuidelines from "@/pages/CommunityGuidelines";

export const Route = createFileRoute("/community-guidelines")({
  head: () =>
    pageHead({
      title: "Community Guidelines — Querino",
      description: "Querino's community guidelines for publishing AI artifacts. Learn what content is allowed and how we keep the platform safe.",
      canonical: "/community-guidelines",
    }),
  component: CommunityGuidelines,
});
