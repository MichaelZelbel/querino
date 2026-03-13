import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAICreditsGate } from "@/hooks/useAICreditsGate";
import { useAuth } from "@/hooks/useAuth";
import { LANGUAGES } from "@/config/languages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Languages } from "lucide-react";
import { toast } from "sonner";

type ArtifactType = "prompt" | "skill" | "workflow" | "claw";

interface TranslateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifactType: ArtifactType;
  sourceLanguage: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  category?: string;
}

const NEW_ROUTES: Record<ArtifactType, string> = {
  prompt: "/prompts/new",
  skill: "/skills/new",
  workflow: "/workflows/new",
  claw: "/claws/new",
};

export function TranslateModal({
  open,
  onOpenChange,
  artifactType,
  sourceLanguage,
  title,
  description,
  content,
  tags,
  category,
}: TranslateModalProps) {
  const navigate = useNavigate();
  const { checkCredits } = useAICreditsGate();
  const { user } = useAuth();
  const [targetLanguage, setTargetLanguage] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const availableLanguages = LANGUAGES.filter((l) => l.code !== sourceLanguage);

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error("Please select a target language");
      return;
    }

    if (!checkCredits()) return;

    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke("translate-artifact", {
        body: {
          artifactType,
          title,
          description,
          content,
          tags,
          sourceLanguage,
          targetLanguage,
          user_id: user?.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Build URL params for the "Create New" page
      const params = new URLSearchParams();
      if (data.title) params.set("title", data.title);
      if (data.description) params.set("description", data.description);
      if (data.content) params.set("content", data.content);
      if (data.tags && Array.isArray(data.tags)) params.set("tags", data.tags.join(","));
      if (category) params.set("category", category);
      params.set("language", targetLanguage);

      onOpenChange(false);
      toast.success("Translation complete! Creating new artifact…");

      navigate(`${NEW_ROUTES[artifactType]}?${params.toString()}`);
    } catch (err) {
      console.error("Translation error:", err);
      const message = err instanceof Error ? err.message : "Translation failed";
      toast.error(message);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Translate {artifactType.charAt(0).toUpperCase() + artifactType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Translate this {artifactType} into another language. A new prefilled "{artifactType}" will be created with the translated content.
          </p>

          <div className="space-y-2">
            <Label>Target Language</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTranslating}>
            Cancel
          </Button>
          <Button onClick={handleTranslate} disabled={isTranslating || !targetLanguage} className="gap-2">
            {isTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating…
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Translate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
