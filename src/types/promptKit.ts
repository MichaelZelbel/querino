// Types for prompt kits from Supabase
export interface PromptKit {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string; // Markdown with "## Prompt: <Title>" convention
  category: string | null;
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  team_id?: string | null;
  rating_avg?: number;
  rating_count?: number;
  language?: string;
  menerio_synced?: boolean;
  menerio_note_id?: string | null;
  menerio_synced_at?: string | null;
}

export interface PromptKitAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}
