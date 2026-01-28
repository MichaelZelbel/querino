import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Lightbulb, 
  Sparkles, 
  Workflow, 
  FolderOpen, 
  Users, 
  Search,
  Copy,
  Star,
  Download,
  Upload,
  Wand2
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Docs() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-muted/30 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">Documentation</Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
                Learn to use Querino
              </h1>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about creating, organizing, and sharing AI prompts, skills, and workflows.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 max-w-5xl mx-auto">
              {[
                { icon: BookOpen, label: "Getting Started", href: "#getting-started" },
                { icon: Lightbulb, label: "Prompts", href: "#prompts" },
                { icon: Sparkles, label: "Skills", href: "#skills" },
                { icon: Workflow, label: "Workflows", href: "#workflows" },
                { icon: FolderOpen, label: "Collections", href: "#collections" },
                { icon: Users, label: "Teams", href: "#teams" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-center"
                >
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-16">
          
          {/* Getting Started */}
          <section id="getting-started" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Getting Started</h2>
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Querino is a platform for discovering, creating, and sharing AI artifacts—prompts, skills, and workflows that help you get better results from AI tools.
              </p>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Start</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Explore the library</p>
                      <p className="text-sm text-muted-foreground">Browse public prompts, skills, and workflows on the <Link to="/discover" className="text-primary hover:underline">Discover</Link> page.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Create an account</p>
                      <p className="text-sm text-muted-foreground">Sign up to save favorites, create your own artifacts, and join teams.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Start creating</p>
                      <p className="text-sm text-muted-foreground">Use the "+ Create" menu to add your own prompts, skills, or workflows.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="text-lg font-semibold mt-8 mb-4">Key Features</h3>
              <div className="grid gap-3 md:grid-cols-2">
              {[
                { icon: Search, text: "Full-text search across all artifacts" },
                { icon: Copy, text: "One-click copy to clipboard" },
                { icon: Star, text: "Rate and review community content" },
                { icon: Download, text: "Export as Markdown files" },
                { icon: Upload, text: "Import from Markdown" },
                { icon: Wand2, text: "AI-powered prompt generation" },
              ].map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <feature.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Prompts */}
          <section id="prompts" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Prompts</h2>
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Prompts are instructions you give to AI models to get specific outputs. Well-crafted prompts produce better, more consistent results.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Creating a Prompt</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li><strong>Content:</strong> Write your prompt text. Be clear and specific about what you want the AI to do.</li>
                <li><strong>Title & Description:</strong> Add a descriptive title and brief description so others can find it.</li>
                <li><strong>Category:</strong> Choose a category (e.g., Writing, Coding, Analysis) to help with discovery.</li>
                <li><strong>Tags:</strong> Add relevant tags for better searchability.</li>
                <li><strong>Visibility:</strong> Keep it private or make it public to share with the community.</li>
              </ol>

              <h3 className="text-lg font-semibold mt-8 mb-4">AI Assistance</h3>
              <p className="text-muted-foreground">
                Use the <Link to="/prompts/wizard" className="text-primary hover:underline">Prompt Wizard</Link> to generate prompts from a brief description. You can also use the "Suggest with AI" button when editing to auto-fill title, description, and tags based on your prompt content.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Best Practices</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Be specific about the desired output format</li>
                <li>Include context and constraints</li>
                <li>Use examples when helpful</li>
                <li>Break complex tasks into steps</li>
                <li>Test with different AI models</li>
              </ul>
            </div>
          </section>

          {/* Skills */}
          <section id="skills" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Skills</h2>
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Skills are reusable prompt frameworks or system prompts that define how an AI should behave. Think of them as personality templates or specialized roles.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">When to Use Skills</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>System prompts:</strong> Define the AI's persona, tone, and capabilities</li>
                <li><strong>Frameworks:</strong> Reusable structures for specific tasks (e.g., code review, content editing)</li>
                <li><strong>Templates:</strong> Parameterized prompts with placeholders for customization</li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Examples</h3>
              <div className="grid gap-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-medium mb-1">Technical Writer</p>
                  <p className="text-sm text-muted-foreground">A skill that instructs the AI to write clear, concise documentation with proper formatting.</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-medium mb-1">Code Reviewer</p>
                  <p className="text-sm text-muted-foreground">A framework for analyzing code quality, suggesting improvements, and checking for bugs.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Workflows */}
          <section id="workflows" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Workflows</h2>
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Workflows are documented automation sequences written in Markdown format. They describe step-by-step processes, procedures, or automation recipes that can be followed or adapted.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Creating Workflows</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li><strong>Write your workflow:</strong> Document your process using Markdown formatting for clear structure.</li>
                <li><strong>Add steps:</strong> Break down the workflow into clear, actionable steps.</li>
                <li><strong>Add metadata:</strong> Include a title, description, and tags so others understand what it does.</li>
                <li><strong>Share:</strong> Publish to share with the community or keep private for personal use.</li>
              </ol>

              <h3 className="text-lg font-semibold mt-8 mb-4">Using Workflows</h3>
              <p className="text-muted-foreground">
                Browse workflows to find documented processes you can follow or adapt. Copy the content to use as a reference, or clone the workflow to customize it for your own needs.
              </p>
            </div>
          </section>

          {/* Collections */}
          <section id="collections" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Collections</h2>
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Collections let you organize related prompts, skills, and workflows into groups. Create themed collections to keep your library organized or to share curated sets with others.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Creating Collections</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li>Navigate to <Link to="/collections" className="text-primary hover:underline">Collections</Link> in your library</li>
                <li>Click "New Collection" and add a title and description</li>
                <li>Add items from your library or from public artifacts</li>
                <li>Optionally make the collection public to share</li>
              </ol>

              <h3 className="text-lg font-semibold mt-8 mb-4">Use Cases</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Group prompts by project or client</li>
                <li>Create "starter kits" for specific use cases</li>
                <li>Curate best-of lists for the community</li>
                <li>Organize team resources by topic</li>
              </ul>
            </div>
          </section>

          {/* Teams */}
          <section id="teams" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Teams</h2>
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Teams allow multiple users to collaborate on a shared library of prompts, skills, and workflows. Perfect for organizations that want to standardize AI usage.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Creating a Team</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li>Click the workspace picker in the header</li>
                <li>Select "Create Team" and give it a name</li>
                <li>Invite members via email or share an invite link</li>
                <li>Start creating team-owned artifacts</li>
              </ol>

              <h3 className="text-lg font-semibold mt-8 mb-4">Team Roles</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Owner:</strong> Full control, can delete team and manage all settings</li>
                <li><strong>Admin:</strong> Can manage members and team settings</li>
                <li><strong>Member:</strong> Can create, edit, and view team artifacts</li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Switching Workspaces</h3>
              <p className="text-muted-foreground">
                Use the workspace picker to switch between your personal library and team workspaces. Content you create will belong to the currently selected workspace.
              </p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
