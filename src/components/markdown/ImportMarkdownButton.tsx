import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  parseMarkdownContent,
  readFileAsText,
  type ArtefactType,
  type ParsedMarkdown,
} from "@/lib/markdown";

interface ImportMarkdownButtonProps {
  /** The type of artefact to import */
  type: ArtefactType;
  /** Variant for the button */
  variant?: "default" | "outline" | "secondary" | "ghost";
  /** Size for the button */
  size?: "default" | "sm" | "lg" | "icon";
  /** Custom label */
  label?: string;
  /** Class name */
  className?: string;
  /** 
   * For editor mode: callback with parsed data instead of navigation.
   * If provided, shows confirmation modal before replacing.
   */
  onImport?: (data: ParsedMarkdown) => void;
  /** Whether we're in editor mode (show confirmation modal) */
  isEditorMode?: boolean;
}

export function ImportMarkdownButton({
  type,
  variant = "outline",
  size = "default",
  label,
  className,
  onImport,
  isEditorMode = false,
}: ImportMarkdownButtonProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<ParsedMarkdown | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const parsed = parseMarkdownContent(content, file.name);

      // Override type based on button's type prop
      parsed.frontmatter.type = type;

      if (isEditorMode && onImport) {
        // Show confirmation modal
        setPendingData(parsed);
        setShowConfirm(true);
      } else if (onImport) {
        // Direct callback without confirmation
        onImport(parsed);
      } else {
        // Navigate to create page with prefilled data
        navigateToCreate(parsed);
      }
    } catch (err) {
      console.error("Error reading markdown file:", err);
      toast.error("Failed to read markdown file");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const navigateToCreate = (parsed: ParsedMarkdown) => {
    const params = new URLSearchParams();
    params.set("title", parsed.frontmatter.title);
    if (parsed.frontmatter.description) {
      params.set("description", parsed.frontmatter.description);
    }
    if (parsed.frontmatter.tags && parsed.frontmatter.tags.length > 0) {
      params.set("tags", parsed.frontmatter.tags.join(","));
    }
    if (parsed.frontmatter.framework) {
      params.set("framework", parsed.frontmatter.framework);
    }
    params.set("content", parsed.content);

    const routes: Record<ArtefactType, string> = {
      prompt: "/prompts/new",
      skill: "/skills/new",
      workflow: "/workflows/new",
    };

    navigate(`${routes[type]}?${params.toString()}`);
    toast.success("Markdown imported! Review and save your artefact.");
  };

  const handleConfirmImport = () => {
    if (pendingData && onImport) {
      onImport(pendingData);
      toast.success("Content replaced from markdown file");
    }
    setShowConfirm(false);
    setPendingData(null);
  };

  const getLabel = () => {
    if (label) return label;
    if (isEditorMode) return "Import .md";
    const typeLabels: Record<ArtefactType, string> = {
      prompt: "New Prompt from .md",
      skill: "New Skill from .md",
      workflow: "New Workflow from .md",
    };
    return typeLabels[type];
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`gap-2 ${className || ""}`}
      >
        <Upload className="h-4 w-4" />
        {getLabel()}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Confirmation Modal for Editor Mode */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Replace Current Content?
            </DialogTitle>
            <DialogDescription>
              Importing will replace the current editor content with the file
              contents. Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
