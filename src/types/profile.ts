export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  role: 'user' | 'admin';
  plan_type: 'free' | 'premium';
  plan_source: 'internal' | 'stripe' | 'gifted' | 'test';
  github_repo: string | null;
  github_branch: string | null;
  github_folder: string | null;
  github_sync_enabled: boolean | null;
  github_last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}
