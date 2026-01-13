import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  parseMarkdownContent,
  readFileAsText,
  type ArtefactType,
} from "@/lib/markdown";

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

          // Navigate to create page with prefilled data
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
