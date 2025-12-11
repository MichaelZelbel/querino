export type ActivityItemType = 'prompt' | 'skill' | 'workflow' | 'collection' | 'profile' | 'team';

export type ActivityAction = 
  | 'create'
  | 'update'
  | 'autosave'
  | 'publish'
  | 'unpublish'
  | 'clone'
  | 'delete'
  | 'restore'
  | 'review'
  | 'version'
  | 'team_create'
  | 'team_add_member'
  | 'team_remove_member'
  | 'team_promote_member'
  | 'github_sync_triggered';

export interface ActivityEvent {
  id: string;
  actor_id: string | null;
  team_id: string | null;
  item_type: ActivityItemType | null;
  item_id: string | null;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityEventWithActor extends ActivityEvent {
  actor?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
