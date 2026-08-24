import { createFileRoute } from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import EditProfile from "@/pages/EditProfile";

export const Route = createFileRoute("/profile/edit")({
  head: () => privateHead("Edit Profile"),
  component: EditProfile,
});
