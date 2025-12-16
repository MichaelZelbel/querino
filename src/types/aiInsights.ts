export interface AIQuality {
  strengths: string[];
  weaknesses: string[];
  readability: 'A' | 'B' | 'C' | 'D';
  complexity: 'Beginner' | 'Intermediate' | 'Expert';
  llmComplexity?: 'Low' | 'Medium' | 'High';
}

export interface AIInsights {
  id: string;
  item_type: 'prompt' | 'skill' | 'workflow';
  item_id: string;
  summary: string | null;
  tags: string[];
  recommendations: string[];
  quality: AIQuality | null;
  created_at: string;
  updated_at: string;
}
