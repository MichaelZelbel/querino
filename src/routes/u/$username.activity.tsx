import { createFileRoute } from "@tanstack/react-router";
import UserActivity from "@/pages/UserActivity";

export const Route = createFileRoute("/u/$username/activity")({
  component: UserActivity,
});
