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
  Wand2,
  
  Cloud,
  History,
  MessageSquare,
  Globe,
  Shield,
  GitBranch,
  Settings,
  ArrowRight,
  Zap,
  RefreshCw,
  FileText,
  PenLine,
  Crown,
  Package,
  Terminal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";

function SectionHeader({ icon: Icon, title, id, iconClassName }: { icon: any; title: string; id: string; iconClassName?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6" id={id}>
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className={iconClassName || "h-6 w-6 text-primary"} />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mt-4 mb-6">
      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <span>{children}</span>
      </p>
    </div>
  );
}

export default function Docs() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Documentation — Querino"
        description="Learn how to create, organize, and share AI prompts, prompt kits, skills, and workflows with Querino."
      />
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
                A friendly guide to everything Querino can do for you — from creating your first prompt or prompt kit to building a team library and connecting external AI assistants over MCP.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 max-w-5xl mx-auto">
              {[
                { icon: BookOpen, label: "Getting Started", href: "#getting-started" },
                { icon: Lightbulb, label: "Prompts", href: "#prompts" },
                { icon: Package, label: "Prompt Kits", href: "#prompt-kits" },
                { icon: Sparkles, label: "Skills", href: "#skills" },
                { icon: Workflow, label: "Workflows", href: "#workflows" },
                
                { icon: FolderOpen, label: "Collections", href: "#collections" },
                { icon: Users, label: "Teams", href: "#teams" },
                { icon: Wand2, label: "AI Tools", href: "#ai-tools" },
                { icon: History, label: "Versioning", href: "#versioning" },
                { icon: FileText, label: "Import & Export", href: "#import-export" },
                { icon: Terminal, label: "MCP Server", href: "#mcp" },
                { icon: Cloud, label: "Menerio", href: "#menerio" },
                { icon: Crown, label: "Premium", href: "#premium" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-center"
                >
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-20">
          
          {/* ── Getting Started ─────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={BookOpen} title="Getting Started" id="getting-started" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Querino is your home for AI artifacts — prompts, prompt kits, skills, and workflows. Whether you want to find a great prompt someone else created, build a personal library, or share knowledge with your team, this is the place.
              </p>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Your first steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Browse the Discover page</p>
                      <p className="text-sm text-muted-foreground">Head to <Link to="/discover" className="text-primary hover:underline">Discover</Link> and explore what the community has published. You can filter by type, category, or just search for a topic.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Create an account</p>
                      <p className="text-sm text-muted-foreground">Sign up with your email to unlock saving, creating, and rating artifacts. It only takes a moment.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Create your first artifact</p>
                      <p className="text-sm text-muted-foreground">Use the <strong>"+ Create"</strong> button in the header to write a prompt, prompt kit, skill, or workflow. Not sure what to write? Try the <Link to="/prompts/wizard" className="text-primary hover:underline">Kickstart Template</Link> — it generates a prompt from a short description.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <p className="font-medium">Build your library</p>
                      <p className="text-sm text-muted-foreground">Your <Link to="/library" className="text-primary hover:underline">Library</Link> shows everything you've created. Pin your favorites, organize with collections, and iterate over time.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="text-lg font-semibold mt-8 mb-4">What can you do here?</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { icon: Search, text: "Search across all artifact types" },
                  { icon: Copy, text: "One-click copy any content to clipboard" },
                  { icon: Star, text: "Rate and review community artifacts" },
                  { icon: Download, text: "Export artifacts as Markdown files" },
                  { icon: Upload, text: "Import prompts from Markdown" },
                  { icon: Wand2, text: "Generate and refine prompts with AI" },
                  { icon: History, text: "Track changes with version history" },
                  { icon: Globe, text: "Translate artifacts between languages" },
                  { icon: Users, text: "Collaborate in team workspaces" },
                  { icon: Cloud, text: "Sync to Menerio for a second brain" },
                ].map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <feature.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Prompts ─────────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Lightbulb} title="Prompts" id="prompts" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Prompts are the heart of Querino. A prompt is a set of instructions you give to an AI model — the clearer your prompt, the better the output. Querino helps you write, store, refine, and share them.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Creating a prompt</h3>
              <p className="text-muted-foreground mb-4">Click <strong>"+ Create" → "Prompt"</strong> in the header. The editor gives you a comfortable writing area with line numbers. Fill in:</p>
              <ol className="space-y-3 text-muted-foreground">
                <li><strong>Content</strong> — The actual prompt text. Be specific about what you want the AI to do, include context, and describe the expected output format.</li>
                <li><strong>Title & Description</strong> — A clear name and a one-liner so you (and others) can find it later.</li>
                <li><strong>Category</strong> — Choose from Writing, Coding, Business, Creative, Research, or Education.</li>
                <li><strong>Language</strong> — Indicate the language the prompt is written in.</li>
                <li><strong>Tags</strong> — Add a few keywords to make searching easier.</li>
              </ol>

              <Tip>
                Not sure how to fill in the metadata? Click <strong>"Suggest with AI"</strong> while editing — Querino's AI reads your prompt content and proposes a title, description, category, and tags for you.
              </Tip>

              <h3 className="text-lg font-semibold mt-8 mb-4">Visibility: private vs. public</h3>
              <p className="text-muted-foreground mb-4">
                Every new artifact starts out <strong>private</strong> — only you can see it. When you're happy with it, toggle it to <strong>public</strong> on the detail page. Public prompts appear on the Discover page for the whole community to find, rate, and clone.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">What you can do with a prompt</h3>
              <div className="grid gap-3 md:grid-cols-2 mb-6">
                {[
                  { icon: Copy, label: "Copy", desc: "Copy the content to your clipboard with one click." },
                  { icon: PenLine, label: "Edit", desc: "Update content, metadata, and tags at any time." },
                  { icon: History, label: "Versions", desc: "Browse and compare previous versions." },
                  { icon: Star, label: "Rate & Review", desc: "Leave a rating and comment on public prompts." },
                  { icon: MessageSquare, label: "Comment", desc: "Discuss a prompt with the community." },
                  { icon: Copy, label: "Clone", desc: "Duplicate a prompt into your own library." },
                  { icon: Globe, label: "Translate", desc: "Translate a prompt to another language using AI." },
                  { icon: Cloud, label: "Sync to Menerio", desc: "Mirror the prompt as a note in your Menerio." },
                ].map((a) => (
                  <div key={a.label} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                    <a.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold mt-8 mb-4">Tips for writing great prompts</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Be specific about the output format (e.g. "return a JSON object with…")</li>
                <li>Provide context and constraints — who is the audience? What length?</li>
                <li>Include examples of desired output when helpful</li>
                <li>Break complex tasks into numbered steps</li>
                <li>Test with multiple AI models to see which works best</li>
              </ul>
            </div>
          </section>

          {/* ── Prompt Kits ─────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Package} title="Prompt Kits" id="prompt-kits" />

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                A <strong>Prompt Kit</strong> is a curated bundle of related prompts — a single Markdown article with multiple prompts grouped under one topic. Use kits when several prompts belong together: an onboarding kit, a content production playbook, a research toolkit, etc.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">How a kit is structured</h3>
              <p className="text-muted-foreground mb-4">
                Kits use a rich Markdown editor with a familiar toolbar (headings, lists, links, code, quotes, …). Between your prose, you insert dedicated <strong>prompt blocks</strong>. On the storage side this is a single Markdown document where each prompt is introduced by a <code>## Prompt: &lt;title&gt;</code> heading, so kits import and export cleanly as plain Markdown.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Creating a kit</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li>Click <strong>"+ Create" → "Prompt Kit"</strong> in the header.</li>
                <li>Write an intro that explains what the kit is for and how to use it.</li>
                <li>Click <strong>"Insert prompt"</strong> in the toolbar to add a prompt block, give it a title, and write the prompt body.</li>
                <li>Repeat for as many prompts as you need, with explanatory text in between.</li>
                <li>Fill in title, description, category, language, and tags — or use <strong>"Suggest with AI"</strong>.</li>
              </ol>

              <Tip>
                Markdown shortcuts work in the editor: type <code>#</code> + space for H1, <code>##</code> for H2, <code>-</code> for a list, <code>&gt;</code> for a quote, and so on.
              </Tip>

              <h3 className="text-lg font-semibold mt-8 mb-4">Reading a kit</h3>
              <p className="text-muted-foreground mb-4">
                On the detail page a kit renders as an article: your prose flows naturally and each prompt block appears as a card with a one-click <strong>Copy</strong> button — readers can grab any individual prompt without losing the surrounding context.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">When to use a kit instead of a prompt</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>You have <strong>multiple prompts</strong> that only make sense together.</li>
                <li>You want to share <strong>guidance and context</strong> alongside the prompts themselves.</li>
                <li>You're publishing a <strong>playbook, workshop, or template pack</strong> rather than a single instruction.</li>
              </ul>

              <p className="text-muted-foreground mt-4">
                Kits support all the same actions as prompts: versioning, ratings and reviews, comments, suggestions, cloning, AI Coach and Insights, translation, Markdown import/export, GitHub Sync, Menerio sync, and team sharing.
              </p>
            </div>
          </section>

          <section className="scroll-mt-24">
            <SectionHeader icon={Sparkles} title="Skills" id="skills" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                A skill is a reusable prompt framework — think of it as a "personality" or "role" you can assign to an AI. Skills are great for system prompts, personas, or structured templates you use over and over.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">When should you create a skill?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>System prompts</strong> — Define an AI's personality, tone, rules, and capabilities. For example: "You are a senior code reviewer. Always explain your reasoning."</li>
                <li><strong>Reusable frameworks</strong> — A structured template for recurring tasks like code reviews, blog post outlines, or meeting summaries.</li>
                <li><strong>Parameterized templates</strong> — Skills with placeholder variables that get filled in for each use.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Skills vs. Prompts</h3>
              <p className="text-muted-foreground mb-4">
                A <strong>prompt</strong> is a specific instruction for a single task ("Write me a blog post about…"). A <strong>skill</strong> is a broader definition of how the AI should behave across many tasks. You might use a "Technical Writer" skill as the system prompt, and then send individual prompts within that conversation.
              </p>

              <Tip>
                Skills support Markdown formatting, so you can structure them with headings, bullet points, and code blocks for clarity.
              </Tip>

              <h3 className="text-lg font-semibold mt-8 mb-4">Examples</h3>
              <div className="grid gap-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-medium mb-1">Technical Writer</p>
                  <p className="text-sm text-muted-foreground">Instructs the AI to write clear, concise documentation. Defines tone, formatting rules, and audience expectations.</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-medium mb-1">Code Reviewer</p>
                  <p className="text-sm text-muted-foreground">A structured framework for analyzing code: security checks, performance, readability, and actionable improvement suggestions.</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-medium mb-1">Friendly Customer Support</p>
                  <p className="text-sm text-muted-foreground">Sets the AI's personality to be warm, empathetic, and solution-oriented when handling customer queries.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Workflows ───────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Workflow} title="Workflows" id="workflows" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Workflows are step-by-step processes documented in Markdown. They describe how to achieve something — an automation recipe, a standard operating procedure, or a multi-step AI pipeline.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">What goes into a workflow?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>A clear description of the goal</li>
                <li>Step-by-step instructions, broken into logical phases</li>
                <li>Tools, prompts, or skills referenced along the way</li>
                <li>Expected inputs and outputs at each step</li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Example use cases</h3>
              <div className="grid gap-3">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-medium mb-1">Content Creation Pipeline</p>
                  <p className="text-sm text-muted-foreground">1. Research topic → 2. Generate outline → 3. Write draft → 4. Review & edit → 5. Format for publication</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-medium mb-1">Bug Report Triage</p>
                  <p className="text-sm text-muted-foreground">Reproduce → Classify severity → Identify root cause → Write fix plan → Assign</p>
                </div>
              </div>

            </div>
          </section>

          <section className="scroll-mt-24">
            <SectionHeader icon={FolderOpen} title="Collections" id="collections" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Collections let you group related artifacts together — like playlists, but for prompts, skills, and workflows.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">How to use collections</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li>Go to <Link to="/collections" className="text-primary hover:underline">Collections</Link> and click "Create Collection."</li>
                <li>Give it a name and description (e.g. "Marketing prompts" or "Onboarding kit for new devs").</li>
                <li>Add artifacts from your library or from public content. You can mix all artifact types.</li>
                <li>Optionally make the collection public so others can discover your curated set.</li>
              </ol>

              <h3 className="text-lg font-semibold mt-8 mb-4">Ideas for collections</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Group prompts by project or client</li>
                <li>Create "starter kits" for specific roles or tasks</li>
                <li>Curate a "best of" list for the community</li>
                <li>Organize team resources by topic or department</li>
              </ul>
            </div>
          </section>

          {/* ── Teams ───────────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Users} title="Teams" id="teams" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Teams let multiple people work in a shared library. Everyone on the team can create, edit, and browse the same set of artifacts — perfect for organizations that want to standardize how they use AI.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Setting up a team</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li>Click the <strong>workspace picker</strong> in the header (it shows "Personal" by default).</li>
                <li>Select <strong>"Create Team"</strong> and give it a name.</li>
                <li>Open <strong>Team Settings</strong> to find the Team ID.</li>
                <li>Share the Team ID with your colleagues — they enter it in their <Link to="/settings" className="text-primary hover:underline">Settings</Link> to join.</li>
              </ol>

              <h3 className="text-lg font-semibold mt-8 mb-4">Team roles</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong>Owner</strong> — Full control. Can delete the team and manage all settings.
                  <span className="block text-sm mt-1 text-muted-foreground/80">Automatically assigned to whoever creates the team.</span>
                </li>
                <li>
                  <strong>Admin</strong> — Can manage members (change roles, remove people) and team settings.
                  <span className="block text-sm mt-1 text-muted-foreground/80">Promoted by the Owner via Team Settings.</span>
                </li>
                <li>
                  <strong>Member</strong> — Can create, edit, and view team artifacts.
                  <span className="block text-sm mt-1 text-muted-foreground/80">Default role when joining via Team ID.</span>
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Switching workspaces</h3>
              <p className="text-muted-foreground">
                Use the workspace picker in the header to switch between your personal library and any team workspace. Anything you create belongs to the workspace you currently have selected.
              </p>

              <Tip>
                Premium users can copy personal artifacts to a team workspace directly from the artifact detail page — handy for sharing your best work with colleagues.
              </Tip>
            </div>
          </section>

          {/* ── AI Tools ────────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Wand2} title="AI-Powered Tools" id="ai-tools" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Querino includes a suite of AI tools to help you create better artifacts faster. These features use AI credits from your account.
              </p>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Kickstart Template (Prompt Wizard)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Describe what you need in a few words — e.g. "a prompt that helps me write better emails" — and the Wizard generates a full, well-structured prompt for you. It's the fastest way to get started.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Suggest with AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Available on every edit form. Click "Suggest with AI" and Querino reads your content, then proposes a title, description, category, and tags. You can accept, modify, or discard each suggestion.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      Prompt Refinement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Already have a prompt but feel it could be better? The Refinement tool takes your existing prompt and improves it — making it clearer, more detailed, or more effective. You describe what you'd like to change, and the AI does the rest.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      AI Coach
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Get interactive feedback on the quality of your prompts, skills, or workflows. The Coach analyzes structure, clarity, and completeness, then offers specific tips for improvement.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="h-4 w-4 text-primary" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      A deeper analysis of any artifact. Insights provides quality scores, identifies strengths and weaknesses, recommends improvements, and suggests relevant tags — all powered by AI.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      AI Translation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Translate any artifact — title, description, content, and tags — into another language. The translation preserves formatting and technical terms. A translated copy is created in your library so the original stays untouched.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tip>
                AI features consume credits. You can see your remaining credits in <Link to="/settings" className="text-primary hover:underline">Settings</Link>. Free accounts receive a monthly allowance; Premium accounts get a larger budget.
              </Tip>
            </div>
          </section>

          {/* ── Versioning ──────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={History} title="Version History" id="versioning" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Every time you save changes to an artifact, Querino keeps a snapshot of the previous version. This means you can always look back, compare, and even restore an older version if needed.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">How it works</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Open any artifact you own and click <strong>"Version History"</strong> in the sidebar.</li>
                <li>You'll see a timeline of all saved versions, each with a timestamp and optional change notes.</li>
                <li>Click on any version to see its full content.</li>
                <li>Use the <strong>compare view</strong> to see a side-by-side diff between two versions.</li>
              </ul>

              <Tip>
                When saving, you can add a short <strong>change note</strong> (e.g. "Added error handling section") to make it easier to understand what changed later.
              </Tip>
            </div>
          </section>

          {/* ── Import & Export ──────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={FileText} title="Import & Export" id="import-export" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Querino uses Markdown as its universal format. You can export your artifacts to <code>.md</code> files and import them back — making it easy to back up, share, or move between tools.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Exporting</h3>
              <p className="text-muted-foreground mb-4">
                On any artifact detail page, click the <strong>Download</strong> button. The exported file includes YAML frontmatter (title, description, tags, category, language) followed by the full content.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Importing</h3>
              <p className="text-muted-foreground mb-4">
                When creating a new prompt, click <strong>"Import from Markdown"</strong> and select a <code>.md</code> file. Querino reads the frontmatter to pre-fill metadata and loads the content into the editor.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">GitHub Sync</h3>
              <p className="text-muted-foreground mb-4">
                For automated backups, connect your GitHub account in <Link to="/settings" className="text-primary hover:underline">Settings</Link>. Once configured, Querino can sync your library to a GitHub repository. Your artifacts are stored as Markdown files, organized in folders by type.
              </p>

              <Tip>
                GitHub Sync works for both personal libraries and team workspaces. Each workspace has its own sync configuration.
              </Tip>
            </div>
          </section>

          {/* ── Reviews, Comments & Suggestions ────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={MessageSquare} title="Community Features" id="community" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Querino is more than a personal tool — it's a community. Here's how you can interact with other users' work.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Ratings & Reviews</h3>
              <p className="text-muted-foreground mb-4">
                Found a great prompt? Give it a star rating (1–5) and optionally leave a short review. Ratings help surface the best content in search results and on the Discover page.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Comments</h3>
              <p className="text-muted-foreground mb-4">
                Every public artifact has a comment section. Ask questions, share how you've used a prompt, or give feedback. Comments support threaded replies, so conversations stay organized.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Suggestions</h3>
              <p className="text-muted-foreground mb-4">
                Think a public artifact could be improved? Submit a <strong>suggestion</strong> — you write your proposed content change and the author can review and accept it, similar to a pull request. It's a respectful way to contribute to someone else's work.
              </p>
            </div>
          </section>

          {/* ── MCP Server ──────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Terminal} title="MCP Server" id="mcp" />

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Querino exposes its full library over the <strong>Model Context Protocol (MCP)</strong>. Connect an external AI assistant — Claude Desktop, Claude Code, Cursor, or any MCP-aware client — and it can read, search, create, update and delete your prompts, prompt kits, skills, workflows and collections directly.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Connection details</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Endpoint:</strong> <code>https://mcp.querino.ai</code></li>
                <li><strong>Transport:</strong> MCP Streamable HTTP (JSON-RPC 2.0 over POST; SSE responses supported)</li>
                <li><strong>Auth:</strong> <code>Authorization: Bearer &lt;your-token&gt;</code></li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Personal API tokens</h3>
              <p className="text-muted-foreground mb-4">
                Authenticate with a long-lived <strong>Querino MCP token</strong> (prefix <code>qrn_mcp_</code>). Generate one in <Link to="/settings" className="text-primary hover:underline">Settings → MCP Tokens</Link>. Tokens don't expire after an hour like a session — they remain valid until you revoke them (or until an optional expiry date you set).
              </p>

              <Tip>
                Treat MCP tokens like passwords. You can have several tokens at once (one per device or assistant) and revoke any of them individually.
              </Tip>

              <h3 className="text-lg font-semibold mt-8 mb-4">What an assistant can do</h3>
              <p className="text-muted-foreground mb-4">
                Once connected, your assistant gets a full toolset to manage your library:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Prompts, Prompt Kits, Skills, Workflows</strong> — list, search, get, create, update, delete.</li>
                <li><strong>Collections</strong> — list, get with items, create, delete.</li>
                <li><strong>Profile</strong> — read and update your own profile.</li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Setup</h3>
              <p className="text-muted-foreground">
                Open <Link to="/settings" className="text-primary hover:underline">Settings → MCP Setup</Link> for ready-to-paste configuration snippets and a generated onboarding prompt you can hand to your assistant — it includes the endpoint, headers, your token placeholder, and a description of every tool.
              </p>
            </div>
          </section>

          <section className="scroll-mt-24">
            <SectionHeader icon={Cloud} title="Menerio Integration" id="menerio" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                <a href="https://menerio.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Menerio</a> is a personal knowledge management app — your "second brain." The Querino–Menerio integration mirrors your artifacts as searchable notes in Menerio, so you can find them alongside your other knowledge.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Connecting your account</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li>In Menerio, go to <strong>Settings → Connections</strong> and generate a <strong>Connection Key</strong> for Querino.</li>
                <li>In Querino, open <Link to="/settings" className="text-primary hover:underline">Settings</Link> and find the <strong>Menerio</strong> section.</li>
                <li>Paste the Connection Key and click <strong>"Connect."</strong></li>
                <li>If everything checks out, you'll see a green <strong>"Connected"</strong> badge with your Menerio display name.</li>
              </ol>

              <h3 className="text-lg font-semibold mt-8 mb-4">Syncing artifacts</h3>
              <p className="text-muted-foreground mb-2">Once connected, you have three ways to sync:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong>Manual sync</strong> — On any artifact detail page, click the <strong>"Sync to Menerio"</strong> button. A small cloud icon indicates the current sync status.
                </li>
                <li>
                  <strong>Automatic sync</strong> — Enable <strong>Auto-Sync</strong> in the Menerio settings. Whenever you update an already-synced artifact, the changes are pushed to Menerio automatically within about a minute.
                </li>
                <li>
                  <strong>Bulk sync</strong> — In the Menerio settings section, click <strong>"Sync all"</strong> to sync every artifact in your library at once. A progress bar shows how it's going.
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-8 mb-4">Sync status indicators</h3>
              <p className="text-muted-foreground mb-4">
                In your library and list views, synced artifacts show a small <strong>cloud icon</strong> next to their title. You can also filter by sync status to quickly see which artifacts are synced and which aren't.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">Disconnecting</h3>
              <p className="text-muted-foreground">
                You can disconnect at any time in Settings. Your notes in Menerio will remain — they just won't receive updates from Querino anymore. You can also click "Remove all syncs" to clear the sync metadata from all artifacts without deleting the Menerio notes.
              </p>

              <Tip>
                You can choose which artifact types to sync (Prompts, Prompt Kits, Skills, Workflows) in the Menerio settings. This is useful if you only want certain types to appear in your Menerio knowledge base.
              </Tip>
            </div>
          </section>

          {/* ── Premium ─────────────────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Crown} title="Premium" id="premium" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Querino is free to use for most features. A Premium plan unlocks additional capabilities for power users and teams.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">What Premium includes</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Higher AI credit allowance</strong> — More credits per month for AI-powered features.</li>
                <li><strong>Team features</strong> — Create and manage team workspaces.</li>
                <li><strong>Copy to team</strong> — Move personal artifacts into a team workspace.</li>
                <li><strong>Priority support</strong> — Get help faster when you need it.</li>
              </ul>

              <p className="text-muted-foreground mt-4">
                Check the <Link to="/pricing" className="text-primary hover:underline">Pricing</Link> page for current plans and a detailed feature comparison.
              </p>
            </div>
          </section>

          {/* ── Typical Workflows ───────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={ArrowRight} title="Typical Workflows" id="typical-workflows" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Here are some common ways people use Querino day to day.
              </p>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Building a personal prompt library</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Create prompts as you use them in your daily AI work.</p>
                    <p>2. Use "Suggest with AI" to quickly fill in metadata.</p>
                    <p>3. Organize with tags and collections.</p>
                    <p>4. Refine your best prompts over time — version history keeps track of changes.</p>
                    <p>5. Export to Markdown or sync to GitHub for backup.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Standardizing AI usage in a team</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Create a team workspace and invite your colleagues.</p>
                    <p>2. Build a shared library of approved prompts and skills.</p>
                    <p>3. Use skills as system prompts so everyone gets consistent AI behavior.</p>
                    <p>4. Document processes as workflows so new team members can follow them.</p>
                    <p>5. Use reviews and comments to iterate on quality together.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Creating a polished public prompt</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Start with the Kickstart Template to generate a first draft.</p>
                    <p>2. Edit and refine the content in the editor.</p>
                    <p>3. Use the AI Coach to get feedback on clarity and completeness.</p>
                    <p>4. Run AI Insights for a quality score and improvement tips.</p>
                    <p>5. Toggle to public and share the link with the community.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Syncing your knowledge to Menerio</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Connect Menerio in Settings using your Connection Key.</p>
                    <p>2. Use "Sync all" to push your entire library at once.</p>
                    <p>3. Enable Auto-Sync so future changes flow automatically.</p>
                    <p>4. Your prompts and skills are now searchable in Menerio alongside your other notes.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* ── Settings & Account ──────────────────────────────── */}
          <section className="scroll-mt-24">
            <SectionHeader icon={Settings} title="Settings & Account" id="settings" />
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg mb-6">
                Your <Link to="/settings" className="text-primary hover:underline">Settings</Link> page is where you manage your profile, integrations, and account preferences.
              </p>

              <h3 className="text-lg font-semibold mt-8 mb-4">What you'll find there</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Profile</strong> — Display name, avatar, bio, and social links.</li>
                <li><strong>AI Credits</strong> — See your current balance and usage history.</li>
                <li><strong>GitHub Sync</strong> — Configure automatic backup to a GitHub repository.</li>
                <li><strong>Menerio</strong> — Connect or disconnect your Menerio account.</li>
                <li><strong>MCP Setup & Tokens</strong> — Generate long-lived <code>qrn_mcp_</code> tokens and copy ready-made configuration for connecting Querino to AI assistants via the <Link to="/docs#mcp" className="text-primary hover:underline">Model Context Protocol</Link>.</li>
                <li><strong>Team membership</strong> — Join a team by entering the Team ID.</li>
                <li><strong>Account</strong> — Manage your subscription and account deletion.</li>
              </ul>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
