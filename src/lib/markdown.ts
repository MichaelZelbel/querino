// Markdown import/export utilities for artefacts

export type ArtefactType = "prompt" | "skill" | "workflow" | "prompt_kit";

export interface MarkdownFrontmatter {
  title: string;
  type: ArtefactType;
  description?: string;
  tags?: string[];
  framework?: string;
}

export interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  content: string;
}

/**
 * Slugify a title for use as a filename
 */
export function slugify(title: string): string {
  if (!title || !title.trim()) {
    return "querino-export";
  }
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "querino-export";
}

export function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildMarkdownContent(data: {
  title: string;
  type: ArtefactType;
  description?: string | null;
  tags?: string[] | null;
  framework?: string | null;
  content: string;
}): string {
  const frontmatterLines: string[] = ["---"];
  frontmatterLines.push(`title: ${data.title}`);
  frontmatterLines.push(`type: ${data.type}`);
  if (data.description) {
    const escapedDesc = data.description.replace(/"/g, '\\"');
    frontmatterLines.push(`description: "${escapedDesc}"`);
  }
  if (data.tags && data.tags.length > 0) {
    frontmatterLines.push(`tags: [${data.tags.join(", ")}]`);
  }
  if (data.framework) {
    frontmatterLines.push(`framework: ${data.framework}`);
  }
  frontmatterLines.push("---");
  frontmatterLines.push("");
  frontmatterLines.push(data.content);
  return frontmatterLines.join("\n");
}

export function parseMarkdownContent(
  markdown: string,
  filename?: string
): ParsedMarkdown {
  const trimmed = markdown.trim();
  if (trimmed.startsWith("---")) {
    const secondDashIndex = trimmed.indexOf("---", 3);
    if (secondDashIndex !== -1) {
      const frontmatterStr = trimmed.slice(3, secondDashIndex).trim();
      const content = trimmed.slice(secondDashIndex + 3).trim();
      const frontmatter = parseFrontmatter(frontmatterStr);
      return {
        frontmatter: {
          title: frontmatter.title || deriveTitle(content, filename),
          type: (frontmatter.type as ArtefactType) || "prompt",
          description: frontmatter.description,
          tags: frontmatter.tags,
          framework: frontmatter.framework,
        },
        content,
      };
    }
  }
  return {
    frontmatter: {
      title: deriveTitle(trimmed, filename),
      type: "prompt",
    },
    content: trimmed,
  };
}

function parseFrontmatter(str: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = str.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      const arrayContent = value.slice(1, -1);
      result[key] = arrayContent
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function deriveTitle(content: string, filename?: string): string {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  if (filename) {
    const nameWithoutExt = filename.replace(/\.md$/i, "");
    return unslugify(nameWithoutExt);
  }
  return "Untitled";
}

export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
