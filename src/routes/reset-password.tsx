import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  head: () => privateHead("Reset Password"),
  component: ResetPassword,
});
