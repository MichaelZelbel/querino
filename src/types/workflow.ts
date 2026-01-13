// Types for Antigravity-style markdown workflows from Supabase
export interface Workflow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string; // Markdown content for Antigravity workflows
  filename: string | null; // e.g., "my-workflow.md"
  scope: 'workspace' | 'global'; // Workflow scope
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  team_id?: string | null;
  // Legacy field - may still exist in DB but not used in new workflows
  json?: Record<string, unknown>;
}

// Author info for display
export interface WorkflowAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Scope options for the UI
export const WORKFLOW_SCOPES = [
  { value: 'workspace', label: 'Workspace', description: 'Stored in your-workspace/.agent/workflows/' },
  { value: 'global', label: 'Global', description: 'Stored in ~/.gemini/antigravity/global_workflows/' },
] as const;

export type WorkflowScope = 'workspace' | 'global';
