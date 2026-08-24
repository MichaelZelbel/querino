import { createFileRoute } from "@tanstack/react-router";
import UserProfile from "@/pages/UserProfile";
import { loadProfile } from "@/lib/route-loaders";
import { pageHead, privateHead } from "@/lib/seo";

export const Route = createFileRoute("/u/$username/")({
  loader: ({ params }) => loadProfile(params.username),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Profile Not Found");
    const name = loaderData.display_name ?? "Querino member";
    return pageHead({
      title: name,
      description: loaderData.bio || `Prompts, skills and workflows published by ${name} on Querino.`,
      canonical: `/u/${encodeURIComponent(loaderData.display_name ?? "")}`,
      ogImage: loaderData.avatar_url,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: { "@type": "Person", name, description: loaderData.bio || undefined },
      },
    });
  },

  component: UserProfile,
});
