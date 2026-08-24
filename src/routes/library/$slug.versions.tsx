import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import VersionHistory from "@/pages/VersionHistory";

export const Route = createFileRoute("/library/$slug/versions")({
  head: () => privateHead("Version History"),
  component: VersionHistory,
});
