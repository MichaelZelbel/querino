import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Wand2, 
  MessageSquare, 
  Bug, 
  Expand, 
  Minimize, 
  ArrowLeft,
  ArrowRight,
  History,
  Copy,
  Check,
  Loader2,
  Zap,
  Lock
} from "lucide-react";
import { toast } from "sonner";

const refinementTools = [
  {
    id: "improve",
    name: "Improve Clarity",
    description: "Make your prompt clearer and more effective",
    icon: Wand2,
  },
  {
    id: "expand",
    name: "Expand Options",
    description: "Add more detail and context",
    icon: Expand,
  },
  {
    id: "simplify",
    name: "Simplify",
    description: "Make your prompt more concise",
    icon: Minimize,
  },
  {
    id: "debug",
    name: "Debug",
    description: "Identify potential issues",
    icon: Bug,
  },
];

const sampleVersions = [
  { id: 1, label: "v1.0", date: "2 hours ago", preview: "Original version" },
  { id: 2, label: "v1.1", date: "1 hour ago", preview: "Improved clarity" },
  { id: 3, label: "v1.2", date: "30 min ago", preview: "Added examples" },
];

export default function PromptRefinement() {
  const [originalPrompt, setOriginalPrompt] = useState(
    "Write a blog post about AI technology and its impact on businesses."
  );
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRefine = (toolId: string) => {
    setSelectedTool(toolId);
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const refinements: Record<string, string> = {
        improve: `You are an expert content writer specializing in technology and business topics. Write a comprehensive, engaging blog post about AI technology and its transformative impact on modern businesses.

Requirements:
- Target audience: Business professionals and decision-makers
- Tone: Professional yet accessible
- Length: 1500-2000 words
- Include real-world examples and case studies
- Add actionable insights for readers

Structure:
1. Compelling introduction with a hook
2. Current state of AI in business
3. Key benefits and use cases
4. Challenges and considerations
5. Future outlook
6. Conclusion with call-to-action`,
        expand: `${originalPrompt}

Additional context to include:
- Current AI trends in 2024
- Specific industry applications (healthcare, finance, retail, manufacturing)
- ROI and cost-benefit analysis
- Implementation strategies
- Common pitfalls to avoid
- Expert quotes and statistics
- Visual suggestions (infographics, charts)`,
        simplify: `Write a concise blog post about how AI helps businesses. Focus on 3 key benefits with brief examples. Keep it under 800 words.`,
        debug: `Potential issues identified in your prompt:

1. ⚠️ Vague scope - "AI technology" is broad. Consider specifying:
   - Generative AI, ML, or specific tools
   - Industry focus

2. ⚠️ Missing audience - Add who the blog is for

3. ⚠️ No format guidance - Specify:
   - Desired length
   - Tone (formal/casual)
   - Structure requirements

4. ✓ Topic is relevant and timely

Suggested improved version:
"Write a 1500-word blog post for small business owners explaining how generative AI tools can improve customer service and marketing efficiency. Include 2-3 practical examples."`,
      };
      
      setRefinedPrompt(refinements[toolId] || originalPrompt);
      setIsProcessing(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(refinedPrompt || originalPrompt);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    setOriginalPrompt(refinedPrompt);
    setRefinedPrompt("");
    setSelectedTool(null);
    toast.success("Changes applied!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-display-md text-foreground">Prompt Refinement</h1>
              <Badge className="bg-primary/10 text-primary border-0">
                <Zap className="mr-1 h-3 w-3" />
                Premium
              </Badge>
            </div>
            <p className="text-muted-foreground">Use AI-powered tools to improve and optimize your prompts.</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Original Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Your Prompt</CardTitle>
                <CardDescription>Enter or paste the prompt you want to refine</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={originalPrompt}
                  onChange={(e) => setOriginalPrompt(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="Paste your prompt here..."
                />
              </CardContent>
            </Card>

            {/* AI Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Refinement Tools
                </CardTitle>
                <CardDescription>Select a tool to enhance your prompt</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {refinementTools.map((tool) => (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "outline"}
                      className="h-auto py-4 flex-col items-start text-left gap-1"
                      onClick={() => handleRefine(tool.id)}
                      disabled={isProcessing}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <tool.icon className="h-4 w-4" />
                        <span className="font-medium">{tool.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-normal">
                        {tool.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Refined Output */}
            {(refinedPrompt || isProcessing) && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Refined Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isProcessing ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-3 text-muted-foreground">Analyzing and refining...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-muted rounded-lg mb-4">
                        <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">
                          {refinedPrompt}
                        </pre>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleApply} className="gap-2">
                          <Check className="h-4 w-4" />
                          Apply Changes
                        </Button>
                        <Button variant="outline" onClick={handleCopy} className="gap-2">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Chat Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>Ask questions about your prompt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Hi! I can help you understand and improve your prompts. Ask me anything!
                  </p>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask a question..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button className="w-full" size="sm">
                  Send
                </Button>
              </CardContent>
            </Card>

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleVersions.map((version) => (
                    <button
                      key={version.id}
                      className="w-full p-3 text-left bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">{version.label}</Badge>
                        <span className="text-xs text-muted-foreground">{version.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{version.preview}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">Want more?</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock advanced AI tools, unlimited refinements, and version control with Premium.
                </p>
                <Link to="/premium-feature-upgrade">
                  <Button size="sm" className="w-full">
                    Upgrade to Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
