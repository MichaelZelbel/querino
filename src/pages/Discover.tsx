import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromptsSection } from "@/components/landing/PromptsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillCard } from "@/components/skills/SkillCard";
import { WorkflowCard } from "@/components/workflows/WorkflowCard";
import { PromptKitCard } from "@/components/promptKits/PromptKitCard";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import { usePromptKits } from "@/hooks/usePromptKits";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Search, FileText, Workflow, Sparkles, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Discover = () => {
  const [activeTab, setActiveTab] = useState("prompts");
  const [skillSearch, setSkillSearch] = useState("");
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [kitSearch, setKitSearch] = useState("");

  const debouncedSkillSearch = useDebounce(skillSearch, 300);
  const debouncedWorkflowSearch = useDebounce(workflowSearch, 300);
  const debouncedKitSearch = useDebounce(kitSearch, 300);

  const { data: skills, isLoading: skillsLoading } = useSkills({ published: true, searchQuery: debouncedSkillSearch });
  const { data: workflows, isLoading: workflowsLoading } = useWorkflows({ published: true, searchQuery: debouncedWorkflowSearch });
  const { data: kits, isLoading: kitsLoading } = usePromptKits({ published: true, searchQuery: debouncedKitSearch });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-2xl grid-cols-4">
                <TabsTrigger value="prompts" className="gap-2"><Sparkles className="h-4 w-4" />Prompts</TabsTrigger>
                <TabsTrigger value="kits" className="gap-2"><Package className="h-4 w-4" />Prompt Kits</TabsTrigger>
                <TabsTrigger value="skills" className="gap-2"><FileText className="h-4 w-4" />Skills</TabsTrigger>
                <TabsTrigger value="workflows" className="gap-2"><Workflow className="h-4 w-4" />Workflows</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="prompts" className="mt-0"><PromptsSection showHeader={false} /></TabsContent>

            <TabsContent value="kits" className="mt-0">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Search prompt kits..." value={kitSearch} onChange={(e) => setKitSearch(e.target.value)} className="pl-10" /></div>
                {kitsLoading ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /></div>)}</div>
                ) : kits && kits.length > 0 ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{kits.map((kit) => <PromptKitCard key={kit.id} kit={kit} showAuthorInfo />)}</div>
                ) : (<div className="py-12 text-center"><p className="text-lg text-muted-foreground">No prompt kits found.</p></div>)}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Search skills..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} className="pl-10" /></div>
                {skillsLoading ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /></div>)}</div>
                ) : skills && skills.length > 0 ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{skills.map((skill) => <SkillCard key={skill.id} skill={skill} showAuthorInfo />)}</div>
                ) : (<div className="py-12 text-center"><p className="text-lg text-muted-foreground">No skills found.</p></div>)}
              </div>
            </TabsContent>

            <TabsContent value="workflows" className="mt-0">
              <div className="space-y-6">
                <div className="relative mx-auto max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" placeholder="Search workflows..." value={workflowSearch} onChange={(e) => setWorkflowSearch(e.target.value)} className="pl-10" /></div>
                {workflowsLoading ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /></div>)}</div>
                ) : workflows && workflows.length > 0 ? (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{workflows.map((workflow) => <WorkflowCard key={workflow.id} workflow={workflow} showAuthorInfo />)}</div>
                ) : (<div className="py-12 text-center"><p className="text-lg text-muted-foreground">No workflows found.</p></div>)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Discover;
