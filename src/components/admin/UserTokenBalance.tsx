import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { adjustAllowance } from "./adjustAllowance";

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

export function UserTokenBalance({
  userId,
  allowances,
  onUpdate,
}: UserTokenBalanceProps) {
  const { user: adminUser } = useAuthContext();
  const allowance = allowances[userId];
  // The field text, so clearing the box is not read as "set to 0".
  const [value, setValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Calculate remaining tokens
  const remainingTokens = allowance
    ? Math.max(allowance.tokens_granted - allowance.tokens_used, 0)
    : null;

  useEffect(() => {
    setValue(remainingTokens === null ? "" : String(remainingTokens));
  }, [remainingTokens]);

  const revert = () =>
    setValue(remainingTokens === null ? "" : String(remainingTokens));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || /^\d+$/.test(raw)) setValue(raw);
  };

  const save = async () => {
    if (!allowance || remainingTokens === null || savingRef.current) return;
    const target = parseInt(value, 10);
    // Nothing typed, or the value did not change: nothing to save.
    if (Number.isNaN(target) || target < 0) {
      revert();
      return;
    }
    if (target === remainingTokens) return;
    if (!adminUser) {
      toast.error("Admin authentication required");
      revert();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      // The admin asked for "remaining = target" while looking at
      // remainingTokens. Apply that difference to the row as it is now, so a
      // charge that landed since the page loaded is not erased.
      const remainingDelta = target - remainingTokens;
      const { next, audited } = await adjustAllowance({
        allowanceId: allowance.id,
        userId,
        adminId: adminUser.id,
        grantedDelta: 0,
        usedDelta: -remainingDelta,
        via: "inline_balance",
      });

      onUpdate(userId, {
        ...allowance,
        tokens_granted: next.tokens_granted,
        tokens_used: next.tokens_used,
      });

      if (audited) {
        toast.success("Remaining tokens updated");
      } else {
        toast.warning("Remaining tokens updated, but the audit log failed");
      }
    } catch (error) {
      console.error("Error updating tokens:", error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to update tokens",
      );
      revert();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      revert();
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
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onBlur={() => void save()}
      onKeyDown={handleKeyDown}
      disabled={saving}
      title="Remaining tokens. Press Enter to save, Escape to undo."
      aria-label="Remaining tokens"
      className="w-24 h-8 text-sm"
    />
  );
}
