import {
  createFileRoute,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { privateHead } from "@/lib/seo";
import CollectionDetail, {
  CollectionDetailSkeleton,
  CollectionNotFound,
} from "@/pages/CollectionDetail";
import { loadCollection } from "@/lib/route-loaders";
import {
  loadRememberingMiss,
  useSignedInRetry,
} from "@/hooks/useRouteLoaderData";
import { RouteErrorPage } from "@/components/layout/RouteErrorPage";

export const Route = createFileRoute("/collections/$id/")({
  // The collection, or notFound() for an unknown or malformed id (HTTP 404),
  // or an error when the database fails (route-loaders.ts). It used to answer
  // every address with 200 and a "Collection not found" text.
  loader: ({ params, route }) =>
    loadRememberingMiss(route.id, params.id, () => loadCollection(params.id)),

  head: ({ loaderData }) =>
    privateHead(loaderData ? loaderData.title : "Collection Not Found"),

  component: RouteComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  pendingComponent: CollectionDetailSkeleton,
});

function RouteComponent() {
  // Keyed by id, so moving from one collection to another starts afresh.
  const { id } = Route.useParams();
  const collection = Route.useLoaderData();
  return <CollectionDetail key={id} initial={collection} />;
}

function NotFoundComponent() {
  const { id } = Route.useParams();
  // A private collection is not found by the signed-out server; once a
  // session turns up, the browser asks once more (useSignedInRetry).
  const mayStillLoad = useSignedInRetry(Route.id, id);
  return mayStillLoad ? <CollectionDetailSkeleton /> : <CollectionNotFound />;
}

function ErrorComponent(props: ErrorComponentProps) {
  return <RouteErrorPage {...props} what="this collection" />;
}
