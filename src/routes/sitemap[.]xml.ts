import { createFileRoute } from "@tanstack/react-router";
import { buildSitemap, FEED_CACHE_CONTROL } from "@/lib/feeds";

// The brackets in the filename escape the dot, which the file router would otherwise
// read as a path separator: sitemap.xml.ts would serve /sitemap/xml.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await buildSitemap(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": FEED_CACHE_CONTROL,
          },
        }),
    },
  },
});
