import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, Check, X, Loader2, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { useUpdatePromptSlug } from "@/hooks/useUpdatePromptSlug";
import { toast } from "sonner";
import { generateSlug } from "@/hooks/useGenerateSlug";

interface SlugEditorProps {
  promptId: string;
  currentSlug: string;
  userId: string;
  onSlugChanged: (newSlug: string) => void;
}

export function SlugEditor({ promptId, currentSlug, userId, onSlugChanged }: SlugEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [slugInput, setSlugInput] = useState(currentSlug);
  const [error, setError] = useState<string | null>(null);
  const { updateSlug, updating } = useUpdatePromptSlug();

  const handleStartEdit = () => {
    setSlugInput(currentSlug);
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSlugInput(currentSlug);
    setError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmed = slugInput.trim();
    if (!trimmed) {
      setError("Slug cannot be empty");
      return;
    }

    setError(null);
    const result = await updateSlug(promptId, trimmed, userId);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.changed && result.slug) {
      onSlugChanged(result.slug);
      toast.success(`Slug updated to "${result.slug}"`);
      setSlugInput(result.slug);
    } else if (result.slug) {
      // Slug was normalized but didn't change
      setSlugInput(result.slug);
    }

    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4" />
        URL Slug
      </Label>

      {isEditing ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center rounded-md border border-input bg-background">
                <span className="px-3 text-sm text-muted-foreground whitespace-nowrap border-r border-input bg-muted/50">
                  /prompts/
                </span>
                <Input
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="my-prompt-slug"
                  autoFocus
                />
              </div>
            </div>
            <Button
              size="icon"
              variant="default"
              onClick={handleSave}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCancel}
              disabled={updating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm text-muted-foreground">
              Changing this slug will update the public URL. Old links will redirect automatically.
            </AlertDescription>
          </Alert>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md border border-input bg-muted/30 px-3 py-2">
            <span className="text-sm text-muted-foreground">/prompts/</span>
            <span className="text-sm font-medium text-foreground">{currentSlug}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleStartEdit}
            title="Edit slug"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        The slug is the URL-friendly identifier for this prompt. It won't change when you edit the title.
      </p>
    </div>
  );
}
