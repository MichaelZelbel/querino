import { createFileRoute } from "@tanstack/react-router";
import VersionHistory from "@/pages/VersionHistory";

export const Route = createFileRoute("/library/$slug/versions")({
  component: VersionHistory,
});
