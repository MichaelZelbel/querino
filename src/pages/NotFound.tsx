import { Link, useLocation } from "@/lib/router-compat";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Compass, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <>
      {/* The title and noindex come from the root route's head() (withNotFoundHead in
          src/routes/__root.tsx), so they are in the server HTML next to the real 404. */}
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-muted/30 py-20">
          <div className="text-center">
            <p className="mb-2 text-6xl font-bold text-foreground">404</p>
            <h1 className="mb-4 text-2xl font-semibold text-foreground">
              Page not found
            </h1>
            <p className="mb-6 text-muted-foreground">
              The address may be mistyped, or the page was moved or deleted.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Return to Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/discover">
                  <Compass className="h-4 w-4" />
                  Go to Discover
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NotFound;
