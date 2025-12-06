export interface Prompt {
    id: string;
    title: string;
    description: string;
    content: string;
    rating_avg: number;
    rating_count: number;
    category: string;
    tags: string[];
    created_at: string;
    is_trending?: boolean; // Mock property for UI sorting
}
