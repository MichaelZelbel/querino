import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import CreateFromMenerio from "@/pages/CreateFromMenerio";

export const Route = createFileRoute("/create-from-menerio")({
  head: () => privateHead("Create from Menerio"),
  component: CreateFromMenerio,
});
