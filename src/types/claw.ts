// Types for Clawbot claws - callable capabilities
export interface Claw {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null; // Markdown content for Claw definition
  category: string | null;
  tags: string[] | null;
  source: string | null; // 'clawbot', 'antigravity', 'generic'
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  team_id?: string | null;
  rating_avg?: number;
  rating_count?: number;
}

// Author info for display
export interface ClawAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}
