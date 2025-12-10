// Types for workflows from Supabase
export interface Workflow {
  id: string;
  title: string;
  description: string | null;
  json: Record<string, unknown>;
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
}

// Author info for display
export interface WorkflowAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}
