import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityEventWithActor } from "@/types/activity";

interface UseActivityEventsOptions {
  teamId?: string;
  actorId?: string;
  itemId?: string;
  itemType?: string;
  limit?: number;
}

export function useActivityEvents(options: UseActivityEventsOptions = {}) {
  const { teamId, actorId, itemId, itemType, limit = 20 } = options;

  return useInfiniteQuery({
    queryKey: ["activity-events", teamId, actorId, itemId, itemType],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("activity_events")
        .select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + limit - 1);

      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      if (actorId) {
        query = query.eq("actor_id", actorId);
      }

      if (itemId) {
        query = query.eq("item_id", itemId);
      }

      if (itemType) {
        query = query.eq("item_type", itemType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ActivityEventWithActor[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
  });
}

// There is no public activity feed, and there never was one.
//
// This used to be useGlobalActivityFeed: it selected every event with
// team_id IS NULL and called them "public". Row-level security has never
// allowed that. The SELECT policy is "your own events, or your teams'", so the
// query returned exactly the caller's own rows and the page said "see what's
// happening across the Querino community" over the top of them.
//
// Making them genuinely public was the other option and it is the wrong one.
// Every event on this table today is ai_insights_generated or
// ai_insights_refreshed, carrying the item_id of the artifact it ran on, and
// those artifacts are mostly private. A public feed would publish which
// private prompts exist and who is working on them, to close a bug nobody had
// reported because the feed had never shown anyone anything.
//
// So the feed is what it always actually was: yours.
export function useOwnActivityFeed(userId: string | undefined, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["own-activity-feed", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("activity_events")
        .select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `)
        .eq("actor_id", userId!)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + limit - 1);

      if (error) throw error;
      return (data || []) as ActivityEventWithActor[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: !!userId,
  });
}

/**
 * One person's activity, which only that person can see.
 *
 * `isOwnProfile` used to switch to "only show public events" for a visitor,
 * which meant `team_id IS NULL` and therefore nothing at all, because RLS
 * refuses another user's rows whatever the filter says. Somebody else's
 * activity page was empty for everyone who looked at it, and the page told
 * them the person had done nothing.
 *
 * The query is not sent for a visitor now, so the page can say the true thing
 * instead: this is private.
 */
export function useUserActivityFeed(userId: string, isOwnProfile: boolean, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["user-activity-feed", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("activity_events")
        .select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `)
        .eq("actor_id", userId)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + limit - 1);

      if (error) throw error;
      return (data || []) as ActivityEventWithActor[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
    enabled: !!userId && isOwnProfile,
  });
}
