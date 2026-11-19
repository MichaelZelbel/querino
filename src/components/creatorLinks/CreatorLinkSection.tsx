import { ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatCount } from "@/components/shared/formatDate";
import { useOwnCreatorLink } from "@/hooks/useCreatorLink";
import {
  creatorLinkDomain,
  creatorLinkStatusText,
  USER_LINK_REL,
  type CreatorLinkItemType,
  type PublicCreatorLink,
} from "@/lib/creatorLink";

interface CreatorLinkSectionProps {
  itemType: CreatorLinkItemType;
  itemId: string;
  /** From the route loader: only ever an approved link on a public item. */
  link: PublicCreatorLink | null | undefined;
  isAuthor: boolean;
  editPath: string;
}

/**
 * "From the creator" under an item. Visitors see the box only for an approved
 * link; the author also sees their own link's status and clicks, which nobody
 * else does.
 */
export function CreatorLinkSection({
  itemType,
  itemId,
  link,
  isAuthor,
  editPath,
}: CreatorLinkSectionProps) {
  const { data: own } = useOwnCreatorLink(itemType, itemId, isAuthor);

  if (!link && !own) return null;

  return (
    <div className="mb-8 space-y-2">
      {link && <CreatorLinkBox itemId={itemId} link={link} />}
      {isAuthor && own && (
        <p className="text-sm text-muted-foreground">
          Your link: {own.label || creatorLinkDomain(own.url)} ·{" "}
          {creatorLinkStatusText(own)} · {formatCount(own.click_count)}{" "}
          {own.click_count === 1 ? "click" : "clicks"} ·{" "}
          <Link
            to={editPath}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Change
          </Link>
        </p>
      )}
    </div>
  );
}

function CreatorLinkBox({
  itemId,
  link,
}: {
  itemId: string;
  link: PublicCreatorLink;
}) {
  const domain = creatorLinkDomain(link.url);
  return (
    <aside
      aria-label="From the creator"
      className="rounded-xl border border-border bg-card p-4"
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        From the creator
      </p>
      {/* /go is a server route that counts the click, so a plain anchor, not the router's Link. */}
      <a
        href={`/go/${itemId}`}
        rel={USER_LINK_REL}
        target="_blank"
        className="group inline-flex items-center gap-2 text-foreground hover:text-primary"
      >
        <span className="font-semibold">{link.label || domain}</span>
        <span className="text-sm text-muted-foreground">{domain}</span>
        <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </a>
    </aside>
  );
}
