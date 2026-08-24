import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import Admin from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  head: () => privateHead("Admin"),
  component: Admin,
});
