import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import Impressum from "@/pages/Impressum";

export const Route = createFileRoute("/impressum")({
  head: () =>
    pageHead({
      title: "Impressum",
      description:
        "Legal notice and company information for Querino, operated by Zelbel Ltd.",
      canonical: "/impressum",
    }),
  component: Impressum,
});
