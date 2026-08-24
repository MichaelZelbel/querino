import { createFileRoute } from "@tanstack/react-router";
import CollectionEdit from "@/pages/CollectionEdit";

export const Route = createFileRoute("/collections/$id/edit")({
  component: CollectionEdit,
});
