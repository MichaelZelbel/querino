export type ItemType = 'prompt' | 'skill' | 'workflow' | 'collection' | 'suggestion';

export interface Comment {
  id: string;
  user_id: string;
  item_type: ItemType;
  item_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  edited: boolean;
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}
