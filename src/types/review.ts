// Types for artifact reviews. The four review tables (prompt_reviews,
// skill_reviews, workflow_reviews, prompt_kit_reviews) share every column
// except the foreign key to the reviewed artifact, so the shared shape keeps
// each key optional and the prompt one narrows it.
export interface ArtifactReview {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  prompt_id?: string;
  skill_id?: string;
  workflow_id?: string;
  prompt_kit_id?: string;
}

export interface PromptReview extends ArtifactReview {
  prompt_id: string;
}

export interface ReviewWithUser extends ArtifactReview {
  user?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
