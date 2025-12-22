// Types for prompts from Supabase
export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[] | null;
  rating_avg: number;
  rating_count: number;
  copies_count: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  author_id: string | null;
  published_at?: string | null;
  summary?: string | null;
  example_output?: string | null;
}

// Author info for display
export interface PromptAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const categories = [
  { id: "all", label: "All Prompts", icon: "Sparkles" },
  { id: "writing", label: "Writing", icon: "PenTool" },
  { id: "coding", label: "Coding", icon: "Code" },
  { id: "business", label: "Business", icon: "Briefcase" },
  { id: "creative", label: "Creative", icon: "Palette" },
  { id: "research", label: "Research", icon: "Search" },
  { id: "education", label: "Education", icon: "GraduationCap" },
] as const;

export const categoryOptions = categories.filter(c => c.id !== "all");