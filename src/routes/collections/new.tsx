import { createFileRoute } from "@tanstack/react-router";
import CollectionNew from "@/pages/CollectionNew";

export const Route = createFileRoute("/collections/new")({
  component: CollectionNew,
});
