import { createFileRoute } from "@tanstack/react-router";
import CommunityGuidelines from "@/pages/CommunityGuidelines";

export const Route = createFileRoute("/community-guidelines")({
  component: CommunityGuidelines,
});
