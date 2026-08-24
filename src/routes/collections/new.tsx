import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import CollectionNew from "@/pages/CollectionNew";

export const Route = createFileRoute("/collections/new")({
  head: () => privateHead("New Collection"),
  component: CollectionNew,
});
