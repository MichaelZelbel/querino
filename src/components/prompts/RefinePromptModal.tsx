import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { FRAMEWORK_OPTIONS, type PromptFramework } from "@/lib/promptGenerator";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";

interface RefinePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptContent: string;
  promptTitle?: string;
  onApplyRefinedPrompt?: (refinedPrompt: string) => void;
  userId?: string;
}

interface RefinementResponse {
  refinedPrompt: string;
  explanation?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export function RefinePromptModal({
  isOpen,
  onClose,
  promptContent,
  promptTitle,
  onApplyRefinedPrompt,
  userId,
}: RefinePromptModalProps) {
  const [framework, setFramework] = useState<PromptFramework>("auto");
  const [isRefining, setIsRefining] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { checkCredits } = useAICreditsGate();

  const handleRefine = async () => {
    // Check credits before making AI call
    if (!checkCredits()) {
      return;
    }

    setIsRefining(true);
    setRefinedPrompt(null);
    setExplanation(null);

    try {
      const refinementUrl = import.meta.env.VITE_PROMPT_REFINEMENT_URL;
      
      if (!refinementUrl) {
        // Fallback: simulate refinement locally if no endpoint configured
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const simulatedRefinement = `# Enhanced Prompt\n\n${promptContent}\n\n---\n*This prompt has been refined for clarity and structure.*`;
        setRefinedPrompt(simulatedRefinement);
        setExplanation("Refinement endpoint not configured. Showing simulated result.");
        return;
      }

      const response = await fetch(refinementUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptContent,
          framework,
          goal: promptTitle || "",
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refine prompt");
      }

      const data: RefinementResponse = await response.json();
      setRefinedPrompt(data.refinedPrompt);
      setExplanation(data.explanation || null);
    } catch (error) {
      console.error("Error refining prompt:", error);
      toast.error("Failed to refine prompt. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = async () => {
    if (!refinedPrompt) return;

    try {
      await navigator.clipboard.writeText(refinedPrompt);
      setCopied(true);
      toast.success("Refined prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleApply = () => {
    if (refinedPrompt && onApplyRefinedPrompt) {
      onApplyRefinedPrompt(refinedPrompt);
      toast.success("Refined prompt applied!");
      handleClose();
    }
  };

  const handleClose = () => {
    setRefinedPrompt(null);
    setExplanation(null);
    setFramework("auto");
    onClose();
  };

  const selectedFrameworkOption = FRAMEWORK_OPTIONS.find((f) => f.value === framework);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Refine Prompt
          </DialogTitle>
          <DialogDescription>
            Querino will rewrite this prompt using best practices and the chosen framework.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Prompt */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Prompt</Label>
            <Textarea
              value={promptContent}
              readOnly
              className="h-32 resize-none bg-muted/50 font-mono text-sm"
            />
          </div>

          {/* Framework Selection */}
          {!refinedPrompt && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prompt Framework</Label>
              <Select value={framework} onValueChange={(v) => setFramework(v as PromptFramework)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORK_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFrameworkOption && (
                <p className="text-xs text-muted-foreground">
                  {selectedFrameworkOption.description}
                </p>
              )}
            </div>
          )}

          {/* Refined Prompt Result */}
          {refinedPrompt && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-primary">Refined Prompt</Label>
                  <span className="text-xs text-muted-foreground">
                    Framework: {selectedFrameworkOption?.label || framework}
                  </span>
                </div>
                <Textarea
                  value={refinedPrompt}
                  readOnly
                  className="h-48 resize-none bg-primary/5 border-primary/20 font-mono text-sm"
                />
              </div>

              {explanation && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    What was improved
                  </Label>
                  <p className="mt-1 text-sm text-foreground">{explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          {!refinedPrompt ? (
            <Button onClick={handleRefine} disabled={isRefining} className="gap-2">
              {isRefining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refining your prompt…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Refine
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Refined Prompt
                  </>
                )}
              </Button>
              {onApplyRefinedPrompt && (
                <Button onClick={handleApply} className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Replace in Editor
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
