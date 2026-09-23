import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { installAICreditsRefresh } from "@/lib/aiCredits";

// Plain query strings, the way the pages were written for (react-router, via
// router-compat, where every value is a string). TanStack's default serializer
// JSON-encodes values: {page: "2"} became ?page=%222%22, which broke blog
// pagination and put quotes around Discover and Library filters. No route uses
// validateSearch or typed search, so strings in and strings out is the whole
// contract.
function parseSearch(searchStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  new URLSearchParams(
    searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
  ).forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search ?? {})) {
    if (value === undefined || value === null) continue;
    params.set(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const getRouter = () => {
  // Ported from the pre-migration App.tsx QueryClient config.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Avoid noisy refetches on every tab focus / remount.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  // The header's credit pill refetches after any charging AI call, wherever in
  // the app the call is made. Nothing else invalidates that query, so without
  // this line the balance sat stale for five minutes after every AI feature.
  installAICreditsRefresh(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    parseSearch,
    stringifySearch,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
