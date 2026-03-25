import { supabase } from "@/integrations/supabase/client";

export async function generateSlug(title: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-slug", {
      body: { title },
    });

    if (error) throw error;
    return data?.slug || "";
  } catch (err) {
    console.error("Error generating slug:", err);
    // Fallback: basic client-side slug
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `untitled-${crypto.randomUUID().substring(0, 8)}`;
  }
}
