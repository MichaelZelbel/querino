import { Button } from "@/components/ui/button";

interface LoadMoreRowProps {
  /** Plural noun for the button and the message, e.g. "prompt kits". */
  what: string;
  hasNext: boolean;
  fetching: boolean;
  /** The list's query failed while it still has rows on screen. */
  failed: boolean;
  onLoadMore: () => void;
  /** Fetch the rows on screen again, for a failure with nothing left to load. */
  onRetry: () => void;
}

/**
 * The row under a paged Discover list: "Load more", and the place a failure
 * is reported while cards are on screen.
 *
 * An infinite query whose "Load more" fails keeps the pages it has and says
 * isError, and the tabs checked isError before the rows, so one failed page
 * replaced every card already shown with "Failed to load ..." (2026-10-07).
 * The full error screen is now only for a list with nothing to show; with rows
 * on screen the failure is said here, and the button retries it: the next
 * page when there is one, otherwise the rows already shown.
 */
export function LoadMoreRow({
  what,
  hasNext,
  fetching,
  failed,
  onLoadMore,
  onRetry,
}: LoadMoreRowProps) {
  if (!hasNext && !failed) return null;
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      {failed && !fetching && (
        <p role="alert" className="text-sm text-destructive">
          {hasNext
            ? `Couldn't load more ${what}.`
            : `Couldn't refresh the ${what}.`}
        </p>
      )}
      <Button
        variant="outline"
        onClick={hasNext ? onLoadMore : onRetry}
        disabled={fetching}
        className="gap-2"
      >
        {fetching ? "Loading…" : failed ? "Try again" : `Load more ${what}`}
      </Button>
    </div>
  );
}
