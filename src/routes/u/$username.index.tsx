import { createFileRoute } from "@tanstack/react-router";
import UserProfile, { UserProfileSkeleton } from "@/pages/UserProfile";
import { loadProfile } from "@/lib/route-loaders";
import { pageHead, privateHead } from "@/lib/seo";

export const Route = createFileRoute("/u/$username/")({
  loader: ({ params }) => loadProfile(params.username),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Profile Not Found");
    const { profile } = loaderData;
    const name = profile.display_name ?? "Querino member";
    return pageHead({
      title: name,
      description:
        profile.bio ||
        `Prompts, skills, workflows and prompt kits published by ${name} on Querino.`,
      canonical: `/u/${encodeURIComponent(profile.display_name ?? "")}`,
      ogImage: profile.avatar_url,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          name,
          description: profile.bio || undefined,
        },
      },
    });
  },

  component: RouteComponent,
  // The router changes the address before it loads the new match and keeps
  // the old page on screen until the loader is done or pendingMs (1 s by
  // default) has passed. Moving from one profile to another, that put the
  // previous person's name and work under the new person's address.
  pendingMs: 0,
  pendingComponent: UserProfileSkeleton,
});

function RouteComponent() {
  // The loader's data is the page's data; the page makes no fetch of its own.
  // The key remounts the page per person, so the open tab does not carry over.
  const { username } = Route.useParams();
  const data = Route.useLoaderData();
  return <UserProfile key={username} username={username} data={data} />;
}
