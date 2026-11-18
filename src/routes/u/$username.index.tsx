import {
  createFileRoute,
  useLocation,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import UserProfile, {
  UserProfileNotFound,
  UserProfileSkeleton,
} from "@/pages/UserProfile";
import { RouteErrorPage } from "@/components/layout/RouteErrorPage";
import {
  loadRememberingMiss,
  useSignedInRetry,
} from "@/hooks/useRouteLoaderData";
import { loadProfile } from "@/lib/route-loaders";
import { profileNameFromPath } from "@/lib/profileLists";
import { pageHead, privateHead } from "@/lib/seo";

export const Route = createFileRoute("/u/$username/")({
  // The profile and the first page of each list; notFound() (HTTP 404) for a
  // name no profile has, an error when the database fails (route-loaders.ts).
  // Anon reads only the profiles of people with public work, so a signed-in
  // visitor's browser asks once more with its session (useSignedInRetry).
  loader: ({ params, route }) =>
    loadRememberingMiss(route.id, params.username, () =>
      loadProfile(params.username),
    ),

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
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
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
  // The router loads the next profile inside a React transition, and React
  // keeps the old screen during a transition instead of showing the pending
  // component: moving from /u/a to /u/b showed a's name and work under b's
  // address for as long as b loaded (measured 2026-11-18, about 30 frames).
  // The address itself reaches this component at once, so while it names
  // another profile than the one this data is for, show the skeleton.
  const addressName = useLocation({
    select: (location) => profileNameFromPath(location.pathname),
  });
  if (addressName !== null && addressName !== username) {
    return <UserProfileSkeleton />;
  }
  return <UserProfile key={username} username={username} data={data} />;
}

function NotFoundComponent() {
  const { username } = Route.useParams();
  const mayStillLoad = useSignedInRetry(Route.id, username);
  return mayStillLoad ? <UserProfileSkeleton /> : <UserProfileNotFound />;
}

function ErrorComponent(props: ErrorComponentProps) {
  return <RouteErrorPage {...props} what="this profile" />;
}
