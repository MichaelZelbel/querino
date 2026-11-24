import { createFileRoute } from "@tanstack/react-router";
import { answerCreatorLink } from "@/lib/creatorLinkRedirect";
import {
  followCreatorLinkRpc,
  peekCreatorLinkRpc,
} from "@/hooks/useCreatorLink";

// A creator's link under an item points here, so a click is counted and the
// visitor goes to the address stored for the item, never one from the request.
// HEAD has its own handler: without one the server answers it through GET and
// every link unfurler or uptime checker was counted as a click (#58).
const lookups = { follow: followCreatorLinkRpc, peek: peekCreatorLinkRpc };

export const Route = createFileRoute("/go/$id")({
  server: {
    handlers: {
      GET: ({ params }) => answerCreatorLink("GET", params.id, lookups),
      HEAD: ({ params }) => answerCreatorLink("HEAD", params.id, lookups),
    },
  },
});
