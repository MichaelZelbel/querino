export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  plan_type: 'free' | 'premium' | 'team';
  plan_source: 'internal' | 'stripe' | 'gifted' | 'test';
  github_repo: string | null;
  github_branch: string | null;
  github_folder: string | null;
  github_sync_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}
