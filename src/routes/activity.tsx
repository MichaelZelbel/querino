import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import Activity from "@/pages/Activity";

export const Route = createFileRoute("/activity")({
  head: () => privateHead("Activity"),
  component: Activity,
});
