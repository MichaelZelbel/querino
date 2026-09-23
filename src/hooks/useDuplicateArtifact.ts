import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateArtifactQueries } from "@/lib/invalidateArtifactQueries";

type ArtifactType = "prompt" | "skill" | "workflow" | "prompt_kit";

const TABLE_BY_TYPE = {
  prompt: "prompts",
  skill: "skills",
  workflow: "workflows",
  prompt_kit: "prompt_kits",
} as const;

const LABEL_BY_TYPE: Record<ArtifactType, string> = {
  prompt: "Prompt",
  skill: "Skill",
  workflow: "Workflow",
  prompt_kit: "Prompt kit",
};

/**
 * Generates a Windows Explorer-style duplicate title.
 * Given "My Title" and existing titles, returns "My Title (1)", "My Title (2)", etc.
 */
function generateDuplicateTitle(
  originalTitle: string,
  existingTitles: string[],
): string {
  // Strip existing (N) suffix to get base title
  const baseMatch = originalTitle.match(/^(.*?)\s*\((\d+)\)$/);
  const baseTitle = baseMatch ? baseMatch[1] : originalTitle;

  // Find all existing numbers for this base title
  const usedNumbers = new Set<number>();
  const pattern = new RegExp(`^${escapeRegex(baseTitle)}\\s*\\((\\d+)\\)$`);

  for (const title of existingTitles) {
    const match = title.match(pattern);
    if (match) {
      usedNumbers.add(parseInt(match[1], 10));
    }
  }

  // Find lowest available number starting from 1
  let num = 1;
  while (usedNumbers.has(num)) {
    num++;
  }

  return `${baseTitle} (${num})`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useDuplicateArtifact() {
  const [duplicating, setDuplicating] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const duplicateArtifact = async (
    type: ArtifactType,
    artifact: Record<string, any>,
    userId: string,
  ) => {
    setDuplicating(true);

    try {
      const table = TABLE_BY_TYPE[type];

      // Fetch existing titles for this user to determine numbering
      const { data: existing } = await supabase
        .from(table)
        .select("title")
        .eq("author_id", userId);

      const existingTitles = (existing || []).map((r: any) => r.title);
      const newTitle = generateDuplicateTitle(artifact.title, existingTitles);

      let insertData: Record<string, any>;
      let editPath: string;

      switch (type) {
        case "prompt":
          insertData = {
            title: newTitle,
            description: artifact.description,
            content: artifact.content,
            category: artifact.category,
            tags: artifact.tags || [],
            author_id: userId,
            is_public: false,
            rating_avg: 0,
            rating_count: 0,
            copies_count: 0,
            language: artifact.language || "en",
            summary: artifact.summary || null,
            example_output: artifact.example_output || null,
            team_id: artifact.team_id || null,
          };
          break;

        case "skill":
          insertData = {
            title: newTitle,
            description: artifact.description || null,
            content: artifact.content,
            category: artifact.category || null,
            tags: artifact.tags || [],
            author_id: userId,
            published: false,
            rating_avg: 0,
            rating_count: 0,
            language: artifact.language || "en",
            team_id: artifact.team_id || null,
          };
          break;

        case "workflow":
          insertData = {
            title: newTitle,
            description: artifact.description || null,
            content: artifact.content || null,
            json: artifact.json || {},
            category: artifact.category || null,
            tags: artifact.tags || [],
            author_id: userId,
            published: false,
            rating_avg: 0,
            rating_count: 0,
            language: artifact.language || "en",
            team_id: artifact.team_id || null,
            filename: artifact.filename || null,
          };
          break;

        case "prompt_kit":
          insertData = {
            title: newTitle,
            description: artifact.description || null,
            content: artifact.content,
            category: artifact.category || null,
            tags: artifact.tags || [],
            author_id: userId,
            published: false,
            language: artifact.language || "en",
            team_id: artifact.team_id || null,
          };
          break;
      }

      const { data, error } = await (supabase.from(table) as any)
        .insert(insertData)
        .select("id, slug")
        .single();

      if (error) throw error;

      void invalidateArtifactQueries(queryClient, type);
      toast.success(`${LABEL_BY_TYPE[type]} duplicated as "${newTitle}"`);

      // Navigate to edit page
      switch (type) {
        case "prompt":
          editPath = `/library/${data.slug}/edit`;
          break;
        case "skill":
          editPath = `/skills/${data.slug}/edit`;
          break;
        case "workflow":
          editPath = `/workflows/${data.slug}/edit`;
          break;
        case "prompt_kit":
          editPath = `/prompt-kits/${data.slug}/edit`;
          break;
      }

      navigate(editPath!);
      return data;
    } catch (err) {
      console.error(`Error duplicating ${type}:`, err);
      toast.error(`Failed to duplicate ${LABEL_BY_TYPE[type].toLowerCase()}`);
      return null;
    } finally {
      setDuplicating(false);
    }
  };

  return { duplicateArtifact, duplicating };
}
