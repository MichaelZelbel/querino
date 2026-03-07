import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExternalLink, ChevronDown, ClipboardCheck } from "lucide-react";
import {
  LLM_OPTIONS,
  LLMTarget,
  openLLM,
  buildPromptForLLM,
  getPreferredLLM,
  setPreferredLLM,
  needsClipboardFallback,
} from "@/lib/openLLM";
import { toast } from "sonner";

interface SendToLLMButtonsProps {
  title: string;
  content: string;
  variant?: "full" | "compact";
}

export function SendToLLMButtons({
  title,
  content,
  variant = "full",
}: SendToLLMButtonsProps) {
  const [preferredLLM, setPreferred] = useState<LLMTarget | null>(
    getPreferredLLM
  );
  const [clipboardDialog, setClipboardDialog] = useState<{
    open: boolean;
    llm: LLMTarget | null;
  }>({ open: false, llm: null });

  const handleSendToLLM = async (llm: LLMTarget) => {
    const fullPrompt = buildPromptForLLM(title, content);

    if (needsClipboardFallback(llm, fullPrompt)) {
      // Long prompt: copy first, then show confirmation dialog
      await navigator.clipboard.writeText(fullPrompt);
      setPreferredLLM(llm);
      setPreferred(llm);
      setClipboardDialog({ open: true, llm });
      return;
    }

    const result = await openLLM(llm, fullPrompt);
    setPreferredLLM(llm);
    setPreferred(llm);
    const llmName = LLM_OPTIONS.find((o) => o.id === llm)?.name;
    toast.success(`Opening in ${llmName}...`);
  };

  const handleOpenLLM = () => {
    if (clipboardDialog.llm) {
      openLLM(clipboardDialog.llm, "", true);
    }
    setClipboardDialog({ open: false, llm: null });
  };

  const llmName = clipboardDialog.llm
    ? LLM_OPTIONS.find((o) => o.id === clipboardDialog.llm)?.name
    : "";

  const clipboardDialogEl = (
    <Dialog
      open={clipboardDialog.open}
      onOpenChange={(open) => {
        if (!open) setClipboardDialog({ open: false, llm: null });
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Prompt copied to clipboard
          </DialogTitle>
          <DialogDescription>
            This prompt is too long for a direct URL transfer. It has been copied
            to your clipboard. Click the button below to open {llmName}, then
            paste it into the prompt box.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setClipboardDialog({ open: false, llm: null })}>
            Cancel
          </Button>
          <Button onClick={handleOpenLLM} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open {llmName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (variant === "compact") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send to LLM</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {LLM_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleSendToLLM(option.id)}
                className="gap-2"
              >
                <span>{option.icon}</span>
                <span>{option.name}</span>
                {preferredLLM === option.id && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    (preferred)
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {clipboardDialogEl}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-foreground">Send to LLM</h3>
        <div className="flex flex-wrap gap-2">
          {LLM_OPTIONS.map((option) => (
            <Button
              key={option.id}
              variant={preferredLLM === option.id ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleSendToLLM(option.id)}
              className="gap-2"
            >
              <span>{option.icon}</span>
              <span>{option.name}</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          ))}
        </div>
      </div>
      {clipboardDialogEl}
    </>
  );
}