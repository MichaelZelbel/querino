import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  buildMarkdownContent,
  slugify,
  downloadMarkdownFile,
  type ArtefactType,
} from "@/lib/markdown";

interface DownloadMarkdownButtonProps {
  title: string;
  type: ArtefactType;
  description?: string | null;
  tags?: string[] | null;
  framework?: string | null;
  content: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DownloadMarkdownButton({
  title,
  type,
  description,
  tags,
  framework,
  content,
  variant = "outline",
  size = "lg",
  className,
}: DownloadMarkdownButtonProps) {
  const handleDownload = () => {
    try {
      const markdownContent = buildMarkdownContent({
        title,
        type,
        description,
        tags,
        framework,
        content,
      });

      const filename = `${slugify(title)}.md`;
      downloadMarkdownFile(markdownContent, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error("Error downloading markdown:", err);
      toast.error("Failed to download markdown file");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      className={`gap-2 ${className || ""}`}
    >
      <Download className="h-4 w-4" />
      Download .md
    </Button>
  );
}
