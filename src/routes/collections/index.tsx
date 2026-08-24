import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import Collections from "@/pages/Collections";

export const Route = createFileRoute("/collections/")({
  head: () => privateHead("Collections"),
  component: Collections,
});
