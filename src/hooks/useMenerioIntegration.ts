import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMenerioIntegration(userId: string | undefined) {
  const [hasIntegration, setHasIntegration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setHasIntegration(false);
      setLoading(false);
      return;
    }

    supabase
      .from("menerio_integration")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        setHasIntegration(!!data);
        setLoading(false);
      });
  }, [userId]);

  return { hasIntegration, loading };
}
