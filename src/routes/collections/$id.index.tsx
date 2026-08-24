import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import CollectionDetail from "@/pages/CollectionDetail";

export const Route = createFileRoute("/collections/$id/")({
  head: () => privateHead("Collection"),
  component: CollectionDetail,
});
