// Types for Antigravity-style markdown workflows from Supabase
export interface Workflow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string; // Markdown content for Antigravity workflows
  category: string | null;
  filename: string | null; // e.g., "my-workflow.md" - legacy, kept for backwards compatibility
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  team_id?: string | null;
  rating_avg?: number;
  rating_count?: number;
  // Legacy field - may still exist in DB but not used in new workflows
  json?: Record<string, unknown>;
}

// Author info for display
export interface WorkflowAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}
