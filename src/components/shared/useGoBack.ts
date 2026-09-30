import { useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { useNavigate } from "@/lib/router-compat";

/**
 * A "Back" button that always goes somewhere. navigate(-1) did nothing on a
 * link opened in a new tab and left the site for someone who came from a
 * search engine; when the site itself has no earlier page, this goes to
 * `fallback` instead.
 */
export function useGoBack(fallback: string) {
  const router = useRouter();
  const navigate = useNavigate();
  return useCallback(() => {
    if (router.history.canGoBack()) router.history.back();
    else navigate(fallback);
  }, [router, navigate, fallback]);
}
