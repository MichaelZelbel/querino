import { PromptGallery } from "@/components/prompts/PromptGallery";
import { Prompt } from "@/types/prompt";

// Mock Data (Temporary, will be replaced by API in future cycles)
const MOCK_PROMPTS: Prompt[] = [
  {
    id: "1",
    title: "SEO Blog Post Generator",
    description: "Create high-ranking SEO blog posts with this comprehensive prompt. Includes keyword integration and meta descriptions.",
    content: "Act as an SEO expert. Write a blog post about...",
    rating_avg: 4.8,
    rating_count: 124,
    category: "Marketing",
    tags: ["SEO", "Writing", "Blog"],
    created_at: "2023-11-01T12:00:00Z",
    is_trending: true
  },
  {
    id: "2",
    title: "Python Code Refactorer",
    description: "Clean up your spaghetti code. This prompt helps you refactor Python scripts for better readability and performance.",
    content: "Refactor the following Python code...",
    rating_avg: 4.9,
    rating_count: 89,
    category: "Coding",
    tags: ["Python", "Refactoring", "Clean Code"],
    created_at: "2023-10-15T10:00:00Z",
    is_trending: false
  },
  {
    id: "3",
    title: "Midjourney Photorealism",
    description: "Generate stunningly realistic images with Midjourney v6 using this detailed prompt structure.",
    content: "/imagine prompt: A cinematic shot of...",
    rating_avg: 4.5,
    rating_count: 342,
    category: "Art",
    tags: ["Midjourney", "Image Gen", "Art"],
    created_at: "2023-12-01T09:00:00Z",
    is_trending: true
  },
  {
    id: "4",
    title: "Cold Email Outreach",
    description: "Get more replies with this cold email template that focuses on value proposition and personalization.",
    content: "Write a cold email to...",
    rating_avg: 4.2,
    rating_count: 56,
    category: "Sales",
    tags: ["Email", "Sales", "Outreach"],
    created_at: "2023-09-20T14:00:00Z",
    is_trending: false
  },
  {
    id: "5",
    title: "React Component Generator",
    description: "Quickly scaffold React components with Tailwind CSS using this efficient prompt.",
    content: "Create a React component using Tailwind CSS...",
    rating_avg: 4.7,
    rating_count: 210,
    category: "Coding",
    tags: ["React", "Tailwind", "Frontend"],
    created_at: "2023-12-05T16:00:00Z", // Newest
    is_trending: true
  }
];

export default function PublicPromptDiscovery() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Discover Top Prompts</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse the best AI prompts curated by the community.
          Use filters to find exactly what you need for your next project.
        </p>
      </div>

      <PromptGallery prompts={MOCK_PROMPTS} />
    </div>
  );
}
