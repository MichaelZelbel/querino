// Types for Clawbot claws - callable capabilities

// Skill source type enum
export type SkillSourceType = 'inline' | 'github' | 'clawhub';

export interface Claw {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null; // Legacy: Markdown content for Claw definition
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
  
  // Skill source fields
  skill_source_type: SkillSourceType;
  skill_source_ref: string | null; // GitHub URL or ClawHub identifier
  skill_source_path: string | null; // Folder path inside repo (GitHub)
  skill_source_version: string | null; // 'latest', tag, or commit SHA
  skill_md_content: string | null; // Editable SKILL.md (inline or imported)
  skill_md_cached: string | null; // Read-only cache for remote skills
}

// Author info for display
export interface ClawAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}
