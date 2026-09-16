import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { installAICreditsRefresh } from "@/lib/aiCredits";

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
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
