import {
  createFileRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import PromptKitDetail, {
  PromptKitDetailSkeleton,
  PromptKitNotFound,
  type KitWithAuthor,
} from "@/pages/PromptKitDetail";
import { loadPromptKit } from "@/lib/route-loaders";
import { creativeWorkJsonLd, pageHead, privateHead } from "@/lib/seo";
import {
  loadRememberingMiss,
  useSignedInRetry,
} from "@/hooks/useRouteLoaderData";
import { RouteErrorPage } from "@/components/layout/RouteErrorPage";

// The loader runs on the server for the first request, so the artefact is in the HTML
// and head() can build a real title from a real record. Before this, every route served
// the same site-wide title and no canonical link at all.
export const Route = createFileRoute("/prompt-kits/$slug/")({
  // Returns the row, or throws: a 301 for an old address, notFound() for a miss,
  // an error when the database fails (route-loaders.ts). A miss in the browser
  // with a session is noted, so the signed-in retry does not ask twice.
  loader: ({ params, route }) =>
    loadRememberingMiss(route.id, params.slug, () =>
      loadPromptKit(params.slug),
    ),

  head: ({ loaderData }) => {
    if (!loaderData) return privateHead("Not Found");
    const url = `/prompt-kits/${loaderData.slug ?? loaderData.id}`;
    const description =
      loaderData.summary ||
      loaderData.description ||
      `${loaderData.title}, a prompt kit on Querino`;
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
  pendingComponent: PromptKitDetailSkeleton,
});

function RouteComponent() {
  // The loader's row is the page's row; the page makes no fetch of its own.
  // The key remounts the page per slug, so a client-side move from one kit
  // to another starts with fresh page state (copied flags, open dialogs).
  const { slug } = Route.useParams();
  const kit = Route.useLoaderData() as unknown as KitWithAuthor;
  return <PromptKitDetail key={slug} kit={kit} />;
}

function NotFoundComponent() {
  const { slug } = Route.useParams();
  // A private or team kit is not found by the signed-out server, which
  // sends the not-found view; once a session turns up, the browser asks once
  // more and shows the skeleton meanwhile (useSignedInRetry).
  const mayStillLoad = useSignedInRetry(Route.id, slug);
  return mayStillLoad ? <PromptKitDetailSkeleton /> : <PromptKitNotFound />;
}

function ErrorComponent(props: ErrorComponentProps) {
  return <RouteErrorPage {...props} what="this prompt kit" />;
}
