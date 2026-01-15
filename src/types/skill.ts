// Types for skills from Supabase
export interface Skill {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  category: string | null;
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  rating_avg?: number;
  rating_count?: number;
}

// Author info for display
export interface SkillAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}
