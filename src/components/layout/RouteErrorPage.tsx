import { useEffect } from "react";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/**
 * The page a route shows when its loader or its component fails, inside the
 * site's header and footer (2026-10-07).
 *
 * The detail loaders throw on a database error since today, so a crawler gets
 * HTTP 500 and retries instead of indexing a "Not Found" (route-loaders.ts).
 * No route below the root had an error component, and TanStack then picks
 * differently on each side: the server rendered its built-in fallback, an
 * unstyled box whose "Show Error" button revealed the raw database message,
 * while the browser let the error climb to the root's RootErrorComponent. Two
 * different pages for one response is a hydration error, and the in-page
 * "Couldn't load this prompt / Try again" with the site header was gone.
 *
 * This is the router's defaultErrorComponent, so every route below the root
 * renders the same markup on both sides; the detail routes wrap it to name
 * what failed ("this prompt"). The raw message only goes to the console and
 * the error reporter, never onto the page.
 */
export function RouteErrorPage({
  error,
  reset,
  what = "this page",
}: ErrorComponentProps & { what?: string }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_route_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-4 text-display-md font-bold text-foreground">
            Couldn't load {what}
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Something went wrong on our end while loading it. Please try again
            in a moment.
          </p>
          <Button
            className="gap-2"
            onClick={() => {
              // Runs the failed loader again; the route shows its loading
              // view meanwhile. On the server render `reset` is undefined,
              // and by the time anyone can click, the browser's boundary has
              // handed in its own.
              void router.invalidate();
              reset?.();
            }}
          >
            Try again
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
