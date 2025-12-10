export interface Team {
  id: string;
  name: string;
  owner_id: string;
  github_repo: string | null;
  github_branch: string | null;
  github_folder: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface TeamMemberWithProfile extends TeamMember {
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeamWithRole extends Team {
  role: 'owner' | 'admin' | 'member';
}
