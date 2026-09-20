import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { PublicIndexEntry } from "@/lib/route-loaders";

interface ArtifactIndexProps {
  heading: string;
  intro: string;
  /** URL prefix of the detail pages, for example "/prompts". */
  basePath: string;
  entries: PublicIndexEntry[];
}

/**
 * A plain list of every public artefact of one type.
 *
 * Deliberately ordinary <a href> elements and nothing interactive: this page exists so
 * that a reader which does not run scripts, a search engine above all, can walk from the
 * footer of any page to every public detail page. Browsing, search and filters live on
 * /discover and stay there.
 */
export default function ArtifactIndex({
  heading,
  intro,
  basePath,
  entries,
}: ArtifactIndexProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 pt-28 pb-20">
        <h1 className="mb-3 font-display text-3xl font-bold">{heading}</h1>
        <p className="mb-8 text-muted-foreground">
          {intro} To search and filter, use{" "}
          <a href="/discover" className="text-primary hover:underline">
            Discover
          </a>
          .
        </p>
        {entries.length === 0 ? (
          <p className="text-muted-foreground">Nothing public here yet.</p>
        ) : (
          <ul className="space-y-4">
            {entries.map((entry) => (
              <li key={entry.slug}>
                <a
                  href={`${basePath}/${entry.slug}`}
                  className="font-medium text-primary hover:underline"
                >
                  {entry.title}
                </a>
                {entry.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
