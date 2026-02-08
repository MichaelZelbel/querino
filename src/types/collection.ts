export interface Collection {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  item_type: 'prompt' | 'skill' | 'workflow' | 'claw';
  item_id: string;
  sort_order: number;
  created_at: string;
}

export interface CollectionWithOwner extends Collection {
  owner?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  item_count?: number;
}
