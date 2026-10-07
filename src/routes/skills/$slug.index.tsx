import {
  createFileRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import SkillDetail, {
  SkillDetailSkeleton,
  SkillNotFound,
  type SkillWithAuthor,
} from "@/pages/SkillDetail";
import { loadSkill } from "@/lib/route-loaders";
import { creativeWorkJsonLd, pageHead, privateHead } from "@/lib/seo";
import {
  loadRememberingMiss,
  useSignedInRetry,
} from "@/hooks/useRouteLoaderData";
import { RouteErrorPage } from "@/components/layout/RouteErrorPage";

// The loader runs on the server for the first request, so the artefact is in the HTML
// and head() can build a real title from a real record. Before this, every route served
// the same site-wide title and no canonical link at all.
export const Route = createFileRoute("/skills/$slug/")({
  // Returns the row, or throws: a 301 for an old address, notFound() for a miss,
  // an error when the database fails (route-loaders.ts). A miss in the browser
  // with a session is noted, so the signed-in retry does not ask twice.
  loader: ({ params, route }) =>
    loadRememberingMiss(route.id, params.slug, () => loadSkill(params.slug)),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Not Found");
    const url = `/skills/${loaderData.slug ?? loaderData.id}`;
    const description =
      loaderData.summary ||
      loaderData.description ||
      `${loaderData.title}, an AI skill on Querino`;
    return pageHead({
      title: loaderData.title,
      description,
      canonical: url,
      jsonLd: creativeWorkJsonLd({
        name: loaderData.title,
        description,
        url,
        author: loaderData.author?.display_name ?? null,
        datePublished: loaderData.published_at ?? loaderData.created_at ?? null,
        dateModified: loaderData.updated_at ?? null,
        genre: (loaderData.category as string | undefined) ?? null,
        inLanguage: (loaderData.language as string | undefined) ?? null,
      }),
    });
  },

  component: RouteComponent,
  notFoundComponent: NotFoundComponent,
  // A database error: the same page on the server and in the browser, inside
  // the site layout, with a "Try again" that runs the loader again.
  errorComponent: ErrorComponent,
  // Shown while the loader runs again: a client-side visit that takes long, and
  // the signed-in second run of a not-found page.
  pendingComponent: SkillDetailSkeleton,
});

function RouteComponent() {
  // The loader's row is the page's row; the page makes no fetch of its own.
  // The key remounts the page per slug, so a client-side move from one skill
  // to another starts with fresh page state (copied flags, open dialogs).
  const { slug } = Route.useParams();
  const skill = Route.useLoaderData() as unknown as SkillWithAuthor;
  return <SkillDetail key={slug} skill={skill} />;
}

function NotFoundComponent() {
  const { slug } = Route.useParams();
  // A private or team skill is not found by the signed-out server, which
  // sends the not-found view; once a session turns up, the browser asks once
  // more and shows the skeleton meanwhile (useSignedInRetry).
  const mayStillLoad = useSignedInRetry(Route.id, slug);
  return mayStillLoad ? <SkillDetailSkeleton /> : <SkillNotFound />;
}

function ErrorComponent(props: ErrorComponentProps) {
  return <RouteErrorPage {...props} what="this skill" />;
}
