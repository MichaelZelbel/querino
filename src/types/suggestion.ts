export type SuggestionStatus = 'open' | 'accepted' | 'rejected';
export type SuggestionItemType = 'prompt' | 'skill' | 'workflow';

export interface Suggestion {
  id: string;
  item_type: SuggestionItemType;
  item_id: string;
  author_id: string;
  title: string | null;
  description: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  status: SuggestionStatus;
  reviewer_id: string | null;
  review_comment: string | null;
}

export interface SuggestionWithAuthor extends Suggestion {
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  reviewer?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
