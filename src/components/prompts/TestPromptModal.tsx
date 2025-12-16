import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FlaskConical, AlertCircle } from "lucide-react";

interface TestPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptContent: string;
  promptTitle: string;
  userId?: string;
}

interface TestResult {
  output: string;
  tokensUsed?: number;
}

export function TestPromptModal({
  isOpen,
  onClose,
  promptContent,
  promptTitle,
  userId,
}: TestPromptModalProps) {
  const [testInput, setTestInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const testUrl = import.meta.env.VITE_PROMPT_TEST_URL;

      if (!testUrl) {
        // Fallback for when URL is not configured
        setError("Test endpoint not configured. Please set VITE_PROMPT_TEST_URL.");
        return;
      }

      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptContent,
          input: testInput,
          model: "gpt-4o-mini",
          user_id: userId || "anonymous",
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setResult({
        output: data.output || data.result || data.response || JSON.stringify(data),
        tokensUsed: data.tokens_used || data.tokensUsed || data.usage?.total_tokens,
      });
    } catch (err) {
      console.error("Error testing prompt:", err);
      setError("Prompt execution failed. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    setTestInput("");
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Test Prompt
          </DialogTitle>
          <DialogDescription>
            Run this prompt with a sample input.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt Preview */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Prompt: {promptTitle}
            </Label>
            <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">
                {promptContent.length > 500
                  ? promptContent.slice(0, 500) + "..."
                  : promptContent}
              </pre>
            </div>
          </div>

          {/* Test Input */}
          <div>
            <Label htmlFor="test-input" className="text-sm font-medium mb-2 block">
              Additional prompt text (optional)
            </Label>
            <Textarea
              id="test-input"
              placeholder="Enter your test input here..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-2">
              <Label className="text-sm font-medium block">
                Model Output
                {result.tokensUsed && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({result.tokensUsed} tokens used)
                  </span>
                )}
              </Label>
              <div className="rounded-lg border border-border bg-card p-4 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                  {result.output}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={isRunning} className="gap-2">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
