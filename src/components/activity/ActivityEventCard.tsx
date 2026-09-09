import { Link } from "@/lib/router-compat";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ActivityIcon,
  ItemTypeIcon,
  getActionLabel,
  getActionColor,
} from "./ActivityIcon";
import type { ActivityEventWithActor } from "@/types/activity";

interface ActivityEventCardProps {
  event: ActivityEventWithActor;
  showItemLink?: boolean;
}

export function ActivityEventCard({
  event,
  showItemLink = true,
}: ActivityEventCardProps) {
  const actorName = event.actor?.display_name || "Unknown user";
  const actorInitial = actorName.charAt(0).toUpperCase();
  const actionLabel = getActionLabel(event.action, event.item_type);
  const actionColor = getActionColor(event.action);

  const getItemLink = () => {
    if (!event.item_type || !event.item_id) return null;

    const routes: Record<string, string> = {
      prompt: `/prompts/${event.item_id}`,
      skill: `/skills/${event.item_id}`,
      workflow: `/workflows/${event.item_id}`,
      collection: `/collections/${event.item_id}`,
      profile: `/u/${event.metadata?.username || event.item_id}`,
      team: `/team/${event.item_id}/settings`,
      // The sidebar emits prompt_kit events, so without this entry those rows
      // rendered with no link at all. The detail route takes the slug and
      // redirects a legacy id.
      prompt_kit: `/prompt-kits/${event.metadata?.slug || event.item_id}`,
    };

    return routes[event.item_type] || null;
  };

  const itemLink = getItemLink();
  const itemTitle = event.metadata?.title || event.metadata?.name || "Untitled";
  const changedFields = event.metadata?.changedFields as string[] | undefined;

  // The profile route keys off the display name, so an actor without one has no
  // page to link to. /u/<uuid> is not a route and only ever produced a dead link.
  const actorProfileLink = event.actor?.display_name
    ? `/u/${event.actor.display_name}`
    : null;

  return (
    <div className="flex gap-3 p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      {/* Actor Avatar */}
      {actorProfileLink ? (
        <Link to={actorProfileLink}>
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage
              src={event.actor?.avatar_url || undefined}
              alt={actorName}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {actorInitial}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage
            src={event.actor?.avatar_url || undefined}
            alt={actorName}
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {actorInitial}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Event Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          {/* Actor Name */}
          {actorProfileLink ? (
            <Link
              to={actorProfileLink}
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              {actorName}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{actorName}</span>
          )}

          {/* Action with Icon */}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ActivityIcon
              action={event.action}
              className={`h-3.5 w-3.5 ${actionColor}`}
            />
            <span>{actionLabel}</span>
          </span>
        </div>

        {/* Item Title/Link */}
        {showItemLink && itemLink && event.item_type && (
          <div className="flex items-center gap-2 mt-1">
            <ItemTypeIcon
              itemType={event.item_type}
              className="h-4 w-4 text-muted-foreground"
            />
            <Link
              to={itemLink}
              className="text-primary hover:underline font-medium truncate"
            >
              {itemTitle}
            </Link>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {changedFields && changedFields.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {changedFields.length} field{changedFields.length > 1 ? "s" : ""}{" "}
              changed
            </Badge>
          )}

          {event.metadata?.versionNumber && (
            <Badge variant="outline" className="text-xs">
              v{event.metadata.versionNumber}
            </Badge>
          )}

          {event.metadata?.rating && (
            <Badge variant="secondary" className="text-xs">
              ⭐ {event.metadata.rating}
            </Badge>
          )}

          {event.metadata?.memberName && (
            <Badge variant="secondary" className="text-xs">
              {event.metadata.memberName}
            </Badge>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
