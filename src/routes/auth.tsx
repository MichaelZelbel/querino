import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => privateHead("Sign In"),
  component: Auth,
});
