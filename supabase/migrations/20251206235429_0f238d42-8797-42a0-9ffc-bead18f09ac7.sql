-- Create prompts table for the AI prompt library
CREATE TABLE public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('writing', 'coding', 'business', 'creative', 'research', 'education')),
    tags TEXT[] DEFAULT '{}',
    rating_avg NUMERIC DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    copies_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Public prompts are readable by everyone (no auth required)
CREATE POLICY "Public prompts are viewable by everyone"
ON public.prompts
FOR SELECT
USING (is_public = true);

-- Create index for efficient filtering and sorting
CREATE INDEX idx_prompts_category ON public.prompts(category);
CREATE INDEX idx_prompts_is_public ON public.prompts(is_public);
CREATE INDEX idx_prompts_rating ON public.prompts(rating_avg DESC, rating_count DESC, created_at DESC);

-- Seed with sample prompts
INSERT INTO public.prompts (title, short_description, content, category, tags, rating_avg, rating_count, copies_count) VALUES
('Professional Email Writer', 'Craft polished, professional emails for any business context with the right tone and structure.', 'You are an expert business communication specialist. Help me write a professional email for the following context: [CONTEXT]. The email should be: - Clear and concise - Professional in tone - Well-structured with proper greeting and closing - Action-oriented when appropriate', 'writing', ARRAY['email', 'business', 'communication'], 4.9, 1250, 3420),
('Code Review Assistant', 'Get detailed, constructive code reviews with suggestions for improvement and best practices.', 'Act as a senior software engineer conducting a code review. Analyze the following code for: 1. Code quality and readability 2. Potential bugs or edge cases 3. Performance optimizations 4. Security concerns 5. Best practices and design patterns. Provide constructive feedback with specific suggestions. Code: [CODE]', 'coding', ARRAY['code-review', 'debugging', 'best-practices'], 4.8, 890, 2150),
('Business Plan Generator', 'Create comprehensive business plans with market analysis, financial projections, and strategy.', 'You are a business strategist and consultant. Help me create a detailed business plan for [BUSINESS IDEA]. Include: 1. Executive Summary 2. Market Analysis 3. Competitive Landscape 4. Business Model 5. Marketing Strategy 6. Financial Projections 7. Risk Assessment', 'business', ARRAY['strategy', 'planning', 'startup'], 4.7, 650, 1890),
('Creative Story Starter', 'Generate unique story premises, character concepts, and plot hooks for creative writing.', 'You are a creative writing mentor with expertise in storytelling. Generate a compelling story starter based on: Genre: [GENRE], Theme: [THEME], Setting: [SETTING]. Include: - A hook that grabs attention - Main character introduction - Initial conflict or mystery - Atmospheric description', 'creative', ARRAY['storytelling', 'fiction', 'writing'], 4.8, 720, 2340),
('Research Paper Analyzer', 'Break down complex research papers into digestible summaries with key findings and implications.', 'Act as an academic research assistant. Analyze the following research paper/abstract and provide: 1. Main thesis and research question 2. Methodology summary 3. Key findings 4. Limitations 5. Practical implications 6. Questions for further research. Paper: [PAPER_CONTENT]', 'research', ARRAY['academic', 'analysis', 'summary'], 4.6, 480, 1120),
('Python Debugging Helper', 'Identify and fix Python bugs with detailed explanations of what went wrong and why.', 'You are a Python debugging expert. Analyze this Python code that has a bug: [CODE]. Error message (if any): [ERROR]. Please: 1. Identify the bug 2. Explain why it occurs 3. Provide the corrected code 4. Suggest preventive measures for similar issues', 'coding', ARRAY['python', 'debugging', 'troubleshooting'], 4.9, 1100, 2890),
('Marketing Copy Generator', 'Create compelling marketing copy for products, services, and campaigns that converts.', 'You are a senior copywriter at a top marketing agency. Create compelling marketing copy for: Product/Service: [PRODUCT], Target Audience: [AUDIENCE], Goal: [GOAL]. Include: - Attention-grabbing headline - Value proposition - Emotional hooks - Call to action - Multiple variations to A/B test', 'business', ARRAY['marketing', 'copywriting', 'advertising'], 4.7, 560, 1650),
('Learning Path Creator', 'Design personalized learning paths for any subject with resources and milestones.', 'You are an educational curriculum designer. Create a structured learning path for: Subject: [SUBJECT], Current Level: [LEVEL], Goal: [GOAL], Time Available: [TIME]. Include: 1. Prerequisites 2. Core concepts to master 3. Recommended resources 4. Practice exercises 5. Milestones and checkpoints 6. Assessment methods', 'education', ARRAY['learning', 'curriculum', 'self-study'], 4.8, 820, 2100),
('API Documentation Writer', 'Generate clear, comprehensive API documentation with examples and usage guidelines.', 'Act as a technical writer specializing in API documentation. Document the following API endpoint: [ENDPOINT_DETAILS]. Include: - Endpoint description - Request parameters - Response format - Authentication requirements - Example requests and responses - Error handling - Rate limits', 'coding', ARRAY['api', 'documentation', 'technical-writing'], 4.6, 340, 890),
('Brand Voice Guide', 'Develop a consistent brand voice and tone guide for all communications.', 'You are a brand strategist. Help me develop a comprehensive brand voice guide for [BRAND_NAME]. Include: 1. Brand personality traits 2. Tone of voice guidelines 3. Do''s and don''ts 4. Example phrases and language patterns 5. Adaptation for different channels 6. Common scenarios and responses', 'creative', ARRAY['branding', 'voice', 'guidelines'], 4.5, 290, 780);