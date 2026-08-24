import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import Library from "@/pages/Library";

export const Route = createFileRoute("/library/")({
  head: () => privateHead("My Library"),
  component: Library,
});
