import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import UserActivity from "@/pages/UserActivity";

export const Route = createFileRoute("/u/$username/activity")({
  head: () => privateHead("Activity"),
  component: UserActivity,
});
