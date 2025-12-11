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

export function useGlobalActivityFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ["global-activity-feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("activity_events")
        .select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `)
        .is("team_id", null)
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
  });
}

export function useUserActivityFeed(userId: string, isOwnProfile: boolean, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["user-activity-feed", userId, isOwnProfile],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("activity_events")
        .select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `)
        .eq("actor_id", userId)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + limit - 1);

      // If not viewing own profile, only show public events
      if (!isOwnProfile) {
        query = query.is("team_id", null);
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
    enabled: !!userId,
  });
}
