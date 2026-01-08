import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, Copy, ArrowRight, Loader2, Check, Info } from "lucide-react";
import { toast } from "sonner";
import {
  formatWizardInputForApi,
  FRAMEWORK_OPTIONS,
  getFrameworkDisplayName,
  type WizardFormData,
  type PromptFramework,
} from "@/lib/promptGenerator";

const N8N_WEBHOOK_URL = "https://agentpool.app.n8n.cloud/webhook/prompt-wizard";

const llmOptions = [
  { value: "ChatGPT", label: "ChatGPT" },
  { value: "Claude", label: "Claude" },
  { value: "Gemini", label: "Gemini" },
  { value: "other", label: "Other" },
];

export default function PromptWizard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  // Form state
  const [goal, setGoal] = useState("");
  const [targetLlm, setTargetLlm] = useState("");
  const [customLlm, setCustomLlm] = useState("");
  const [audience, setAudience] = useState("");
  const [toneStyle, setToneStyle] = useState("");
  const [inputs, setInputs] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [framework, setFramework] = useState<PromptFramework>("auto");

  // Generated prompt
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/prompts/wizard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const selectedFrameworkOption = FRAMEWORK_OPTIONS.find((f) => f.value === framework);

  const handleGenerate = async () => {
    // Validate goal
    if (!goal.trim()) {
      setGoalError("Please describe what you want the LLM to do");
      return;
    }
    setGoalError("");

    if (!N8N_WEBHOOK_URL) {
      toast.error("Webhook URL not configured");
      return;
    }

    const formData: WizardFormData = {
      goal: goal.trim(),
      targetLlm: targetLlm || "General LLM",
      customLlm: customLlm.trim(),
      audience: audience.trim(),
      toneStyle: toneStyle.trim(),
      inputs: inputs.trim(),
      outputFormat: outputFormat.trim(),
      constraints: constraints.trim(),
      additionalNotes: additionalNotes.trim(),
      framework,
    };

    const structuredInput = formatWizardInputForApi(formData);

    setIsGenerating(true);
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structured_input: structuredInput }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const text = await response.text();
      if (!text.trim()) {
        throw new Error("Empty response from webhook");
      }

      let promptText = text.trim();
      
      // Try to parse as JSON if it looks like JSON
      if (promptText.startsWith("[") || promptText.startsWith("{")) {
        try {
          let parsed = JSON.parse(promptText);
          // Unwrap array: [{ output: "..." }] -> { output: "..." }
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed = parsed[0];
          }
          // Extract output field
          if (parsed && typeof parsed === "object" && parsed.output) {
            promptText = parsed.output;
          }
        } catch {
          // Not valid JSON, use as plain text
        }
      }

      setGeneratedPrompt(promptText);
      toast.success("Prompt generated!");
    } catch (error) {
      console.error("Wizard error:", error);
      toast.error("Failed to generate prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleCreatePrompt = () => {
    // Navigate to /prompts/new with draft in query param
    const encodedDraft = encodeURIComponent(generatedPrompt);
    navigate(`/prompts/new?draft=${encodedDraft}`);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-display-md font-bold text-foreground">
              Prompt Wizard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Answer a few questions and let Querino draft a powerful prompt for you.
            </p>
          </div>

          {/* Wizard Form */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            {/* Goal / Task (required) */}
            <div className="space-y-2">
              <Label htmlFor="goal">What do you want the LLM to do? *</Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Summarise long-form articles into bullet-point briefs for busy executives."
                rows={3}
                className={goalError ? "border-destructive" : ""}
              />
              {goalError && (
                <p className="text-sm text-destructive">{goalError}</p>
              )}
            </div>

            {/* Prompt Framework Selector */}
            <div className="space-y-2">
              <Label htmlFor="framework">Prompt Framework</Label>
              <Select value={framework} onValueChange={(v) => setFramework(v as PromptFramework)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFrameworkOption && (
                <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{selectedFrameworkOption.description}</span>
                </div>
              )}
            </div>

            {/* Target LLM */}
            <div className="space-y-2">
              <Label htmlFor="targetLlm">Which LLM or environment is this for?</Label>
              <Select value={targetLlm} onValueChange={setTargetLlm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target LLM" />
                </SelectTrigger>
                <SelectContent>
                  {llmOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetLlm === "other" && (
                <Input
                  value={customLlm}
                  onChange={(e) => setCustomLlm(e.target.value)}
                  placeholder="Enter LLM name"
                  className="mt-2"
                />
              )}
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <Label htmlFor="audience">Who is this for? (optional)</Label>
              <Input
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Busy executives with little time, who prefer concise language."
              />
            </div>

            {/* Tone & Style */}
            <div className="space-y-2">
              <Label htmlFor="toneStyle">Preferred tone & style (optional)</Label>
              <Input
                id="toneStyle"
                value={toneStyle}
                onChange={(e) => setToneStyle(e.target.value)}
                placeholder="Concise, expert, non-fluffy. Avoid buzzwords."
              />
            </div>

            {/* Inputs */}
            <div className="space-y-2">
              <Label htmlFor="inputs">What kind of input will the model receive? (optional)</Label>
              <Textarea
                id="inputs"
                value={inputs}
                onChange={(e) => setInputs(e.target.value)}
                placeholder="Raw transcripts, long-form blog posts, or meeting notes."
                rows={2}
              />
            </div>

            {/* Output format */}
            <div className="space-y-2">
              <Label htmlFor="outputFormat">How should the output look? (optional)</Label>
              <Textarea
                id="outputFormat"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="5 bullet points, max 20 words each, plus one short 'Executive Summary' paragraph."
                rows={2}
              />
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <Label htmlFor="constraints">Constraints / Rules (optional)</Label>
              <Textarea
                id="constraints"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Never invent facts. Say 'I don't know' when data is missing."
                rows={2}
              />
            </div>

            {/* Additional notes */}
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional examples or notes (optional)</Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Here is an example of an ideal output: …"
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate Prompt"}
            </Button>
          </div>

          {/* Generated Prompt Section */}
          {generatedPrompt && (
            <div className="mt-8 rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Generated Prompt
              </h2>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono text-foreground overflow-x-auto">
                {generatedPrompt}
              </pre>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy to clipboard"}
                </Button>
                <Button onClick={handleCreatePrompt} className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Create Prompt from this
                </Button>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              to="/library"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to My Library
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
