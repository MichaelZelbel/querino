// Types for prompt reviews
export interface PromptReview {
  id: string;
  prompt_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithUser extends PromptReview {
  user?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
