import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AllowancePeriod {
  id: string;
  user_id: string;
  tokens_granted: number;
  tokens_used: number;
}

interface UserTokenBalanceProps {
  userId: string;
  allowances: Record<string, AllowancePeriod>;
  onUpdate: (userId: string, newAllowance: AllowancePeriod) => void;
}

export function UserTokenBalance({ userId, allowances, onUpdate }: UserTokenBalanceProps) {
  const allowance = allowances[userId];
  const [value, setValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Calculate remaining tokens
  const remainingTokens = allowance 
    ? Math.max(allowance.tokens_granted - allowance.tokens_used, 0)
    : null;

  useEffect(() => {
    setValue(remainingTokens);
  }, [remainingTokens]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      setValue(newValue);
    } else if (e.target.value === "") {
      setValue(0);
    }
  };

  const handleBlur = async () => {
    if (!allowance || value === null || value === remainingTokens) return;

    setSaving(true);
    try {
      // If the admin sets remaining tokens higher than what's currently granted,
      // we need to increase tokens_granted to accommodate the new value
      let newTokensGranted = allowance.tokens_granted;
      let newTokensUsed = allowance.tokens_used;

      if (value > allowance.tokens_granted) {
        // Admin wants more remaining than currently granted
        // Set tokens_granted = value (the new remaining), tokens_used = 0
        newTokensGranted = value;
        newTokensUsed = 0;
      } else {
        // Normal case: adjust tokens_used to achieve desired remaining
        // remaining = tokens_granted - tokens_used
        // tokens_used = tokens_granted - remaining
        newTokensUsed = Math.max(allowance.tokens_granted - value, 0);
      }

      const { error } = await supabase
        .from("ai_allowance_periods")
        .update({ 
          tokens_granted: newTokensGranted,
          tokens_used: newTokensUsed 
        })
        .eq("id", allowance.id);

      if (error) throw error;

      // Update local state
      onUpdate(userId, {
        ...allowance,
        tokens_granted: newTokensGranted,
        tokens_used: newTokensUsed,
      });

      toast.success("Remaining tokens updated");
    } catch (error) {
      console.error("Error updating tokens:", error);
      toast.error("Failed to update tokens");
      // Reset to original value
      setValue(remainingTokens);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  if (!allowance) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Input
      type="number"
      min={0}
      value={value ?? 0}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={saving}
      className="w-24 h-8 text-sm"
    />
  );
}
