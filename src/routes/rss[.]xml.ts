import { createFileRoute } from "@tanstack/react-router";
import { buildRss, FEED_CACHE_CONTROL } from "@/lib/feeds";

// The brackets in the filename escape the dot; see sitemap[.]xml.ts.
export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await buildRss(), {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": FEED_CACHE_CONTROL,
          },
        }),
    },
  },
});
