import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Cookies from "@/pages/Cookies";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageHead({
      title: "Cookies Policy",
      description: "Which cookies Querino sets, what they are for, and how to control them.",
      canonical: "/cookies",
    }),
  component: Cookies,
});
