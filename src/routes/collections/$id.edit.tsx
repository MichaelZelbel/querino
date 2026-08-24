import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import CollectionEdit from "@/pages/CollectionEdit";

export const Route = createFileRoute("/collections/$id/edit")({
  head: () => privateHead("Edit Collection"),
  component: CollectionEdit,
});
