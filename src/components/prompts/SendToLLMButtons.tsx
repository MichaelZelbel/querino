import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, ChevronDown } from "lucide-react";
import {
  LLM_OPTIONS,
  LLMTarget,
  openLLM,
  buildPromptForLLM,
  getPreferredLLM,
  setPreferredLLM,
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

  const handleSendToLLM = (llm: LLMTarget) => {
    const fullPrompt = buildPromptForLLM(title, content);
    openLLM(llm, fullPrompt);
    setPreferredLLM(llm);
    setPreferred(llm);
    toast.success(`Opening in ${LLM_OPTIONS.find((o) => o.id === llm)?.name}...`);
  };

  if (variant === "compact") {
    return (
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
    );
  }

  return (
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
  );
}
