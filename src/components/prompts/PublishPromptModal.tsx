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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Globe, Sparkles } from "lucide-react";

interface PublishPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (data: { summary: string; exampleOutput: string }) => Promise<void>;
  isPublishing: boolean;
}

export function PublishPromptModal({
  open,
  onOpenChange,
  onPublish,
  isPublishing,
}: PublishPromptModalProps) {
  const [summary, setSummary] = useState("");
  const [exampleOutput, setExampleOutput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!summary.trim()) {
      newErrors.summary = "Summary is required";
    } else if (summary.length > 200) {
      newErrors.summary = "Summary must be less than 200 characters";
    }

    if (exampleOutput.length > 1000) {
      newErrors.exampleOutput = "Example output must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onPublish({
      summary: summary.trim(),
      exampleOutput: exampleOutput.trim(),
    });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isPublishing) {
      onOpenChange(isOpen);
      if (!isOpen) {
        setSummary("");
        setExampleOutput("");
        setErrors({});
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Publish Your Prompt</DialogTitle>
          <DialogDescription className="text-base">
            Publishing your prompt makes it discoverable by all users on Querino.
            Add some details to help others find and understand your prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">
              Summary <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A short 1-2 sentence explanation of what this prompt does..."
              rows={3}
              className={errors.summary ? "border-destructive" : ""}
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {summary.length}/200 characters
            </p>
          </div>

          {/* Example Output */}
          <div className="space-y-2">
            <Label htmlFor="exampleOutput" className="flex items-center gap-2">
              Example Output
              <span className="text-xs font-normal text-muted-foreground">(recommended)</span>
            </Label>
            <Textarea
              id="exampleOutput"
              value={exampleOutput}
              onChange={(e) => setExampleOutput(e.target.value)}
              placeholder="Show users an example of what this prompt produces..."
              rows={4}
              className={errors.exampleOutput ? "border-destructive" : ""}
            />
            {errors.exampleOutput && (
              <p className="text-sm text-destructive">{errors.exampleOutput}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {exampleOutput.length}/1000 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What happens when you publish?</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Your prompt appears on the Discover page</li>
                <li>Anyone can copy and use your prompt</li>
                <li>You can unpublish anytime from the edit page</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPublishing} className="gap-2">
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Publish Prompt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
