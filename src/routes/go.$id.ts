import { createFileRoute } from "@tanstack/react-router";
import { followCreatorLink } from "@/lib/creatorLinkRedirect";
import { followCreatorLinkRpc } from "@/hooks/useCreatorLink";

// A creator's link under an item points here, so a click is counted and the
// visitor goes to the address stored for the item, never one from the request.
export const Route = createFileRoute("/go/$id")({
  server: {
    handlers: {
      GET: ({ params }) => followCreatorLink(params.id, followCreatorLinkRpc),
    },
  },
});
