import { createFileRoute } from "@tanstack/react-router";
import CreateFromMenerio from "@/pages/CreateFromMenerio";

export const Route = createFileRoute("/create-from-menerio")({
  component: CreateFromMenerio,
});
