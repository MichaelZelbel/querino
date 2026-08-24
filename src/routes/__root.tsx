import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import NotFound from "@/pages/NotFound";
import appCss from "../styles.css?url";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

const ORGANIZATION_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Querino",
  url: "https://querino.ai",
  logo: "https://querino.ai/favicon.png",
  sameAs: ["https://github.com/querino-ai"],
});

const WEBSITE_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Querino",
  url: "https://querino.ai",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://querino.ai/discover?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { title: "Querino - AI Prompt Library for Creators" },
        {
          name: "description",
          content:
            "Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.",
        },
        { name: "author", content: "Querino" },
        {
          name: "keywords",
          content:
            "AI prompts, prompt engineering, ChatGPT, Claude, AI tools, prompt library",
        },
        {
          property: "og:title",
          content: "Querino - AI Prompt Library for Creators",
        },
        {
          property: "og:description",
          content:
            "Discover, create, and master AI prompts with Querino's curated library and intelligent refinement tools.",
        },
        { property: "og:type", content: "website" },
        {
          property: "og:image",
          content: "https://lovable.dev/opengraph-image-p98pqg.png",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@Querino" },
        {
          name: "twitter:image",
          content: "https://lovable.dev/opengraph-image-p98pqg.png",
        },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        { rel: "stylesheet", href: FONTS_HREF },
      ],
      scripts: [
        { type: "application/ld+json", children: ORGANIZATION_JSONLD },
        { type: "application/ld+json", children: WEBSITE_JSONLD },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: () => <NotFound />,
    errorComponent: RootErrorComponent,
  },
);

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <WorkspaceProvider>
              <Outlet />
              <CookieBanner />
            </WorkspaceProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function RootErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-md">
        <h1 className="mb-2 font-display text-xl font-semibold">
          This page didn't load
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            href="/"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
