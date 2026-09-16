import { useRef, useState, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import { toast } from "sonner";
import {
  parseMarkdownContent,
  readFileAsText,
  type ArtefactType,
} from "@/lib/markdown";
import { draftUrl } from "@/lib/draftHandoff";

export function useMarkdownImport(type: ArtefactType) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerFileSelect = useCallback(() => {
    // Create a temporary file input if one doesn't exist
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".md";
      input.style.display = "none";
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
          const content = await readFileAsText(file);
          const parsed = parseMarkdownContent(content, file.name);

          // Override type based on hook's type
          parsed.frontmatter.type = type;

          const routes: Record<ArtefactType, string> = {
            prompt: "/prompts/new",
            skill: "/skills/new",
            workflow: "/workflows/new",
            prompt_kit: "/prompt-kits/new",
          };

          // Navigate to create page with prefilled data. The body goes
          // through sessionStorage, not ?content= (see draftHandoff).
          navigate(
            draftUrl(routes[type], {
              title: parsed.frontmatter.title,
              description: parsed.frontmatter.description,
              tags: parsed.frontmatter.tags?.join(","),
              framework: parsed.frontmatter.framework,
              content: parsed.content,
            }),
          );
          toast.success("Markdown imported! Review and save your artefact.");
        } catch (err) {
          console.error("Error reading markdown file:", err);
          toast.error("Failed to read markdown file");
        } finally {
          setIsProcessing(false);
          // Clean up
          document.body.removeChild(input);
          fileInputRef.current = null;
        }
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    fileInputRef.current.click();
  }, [navigate, type]);

  return {
    triggerFileSelect,
    isProcessing,
  };
}
