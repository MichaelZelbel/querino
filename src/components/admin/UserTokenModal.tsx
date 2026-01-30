import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface AllowancePeriodFull {
  id: string;
  user_id: string;
  tokens_granted: number;
  tokens_used: number;
  period_start: string;
  period_end: string;
  source: string | null;
  metadata: Record<string, unknown> | null;
}

interface UserTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  displayName: string | null;
  onSave?: (allowance: AllowancePeriodFull) => void;
}

export function UserTokenModal({
  open,
  onOpenChange,
  userId,
  displayName,
  onSave,
}: UserTokenModalProps) {
  const { user: adminUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowance, setAllowance] = useState<AllowancePeriodFull | null>(null);
  const [tokensPerCredit, setTokensPerCredit] = useState(200);
  
  // Editable fields
  const [tokensGranted, setTokensGranted] = useState<number>(0);
  const [tokensUsed, setTokensUsed] = useState<number>(0);

  useEffect(() => {
    if (open && userId) {
      fetchAllowanceData();
    }
  }, [open, userId]);

  const fetchAllowanceData = async () => {
    setLoading(true);
    try {
      // Fetch tokens_per_credit setting and allowance data in parallel
      const [settingsResult, allowanceResult] = await Promise.all([
        supabase
          .from("ai_credit_settings")
          .select("key, value_int")
          .eq("key", "tokens_per_credit")
          .maybeSingle(),
        supabase
          .from("ai_allowance_periods")
          .select("*")
          .eq("user_id", userId)
          .lte("period_start", new Date().toISOString())
          .gt("period_end", new Date().toISOString())
          .order("period_end", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (settingsResult.data) {
        setTokensPerCredit(settingsResult.data.value_int || 200);
      }

      if (allowanceResult.data) {
        const data = allowanceResult.data as AllowancePeriodFull;
        setAllowance(data);
        setTokensGranted(data.tokens_granted);
        setTokensUsed(data.tokens_used);
      } else {
        setAllowance(null);
        setTokensGranted(0);
        setTokensUsed(0);
      }
    } catch (error) {
      console.error("Error fetching allowance data:", error);
      toast.error("Failed to load token data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!allowance) {
      toast.error("No allowance period found for this user");
      return;
    }

    if (!adminUser) {
      toast.error("Admin authentication required");
      return;
    }

    setSaving(true);
    try {
      // Calculate changes for audit log
      const oldTokensGranted = allowance.tokens_granted;
      const oldTokensUsed = allowance.tokens_used;
      const tokensGrantedDelta = tokensGranted - oldTokensGranted;
      const tokensUsedDelta = tokensUsed - oldTokensUsed;

      // Update the allowance period
      const { error: updateError } = await supabase
        .from("ai_allowance_periods")
        .update({
          tokens_granted: tokensGranted,
          tokens_used: tokensUsed,
        })
        .eq("id", allowance.id);

      if (updateError) throw updateError;

      // Log the admin adjustment to llm_usage_events
      const { error: logError } = await supabase
        .from("llm_usage_events")
        .insert({
          user_id: userId,
          idempotency_key: `admin_adjustment_${allowance.id}_${Date.now()}`,
          feature: "admin_balance_adjustment",
          total_tokens: tokensGrantedDelta, // Net change in granted tokens
          prompt_tokens: 0,
          completion_tokens: 0,
          credits_charged: 0,
          metadata: {
            admin_id: adminUser.id,
            admin_action: "balance_adjustment",
            allowance_period_id: allowance.id,
            target_user_id: userId,
            target_display_name: displayName,
            previous_tokens_granted: oldTokensGranted,
            new_tokens_granted: tokensGranted,
            tokens_granted_delta: tokensGrantedDelta,
            previous_tokens_used: oldTokensUsed,
            new_tokens_used: tokensUsed,
            tokens_used_delta: tokensUsedDelta,
            previous_remaining: oldTokensGranted - oldTokensUsed,
            new_remaining: tokensGranted - tokensUsed,
            adjusted_at: new Date().toISOString(),
          },
        });

      if (logError) {
        console.error("Failed to log admin adjustment:", logError);
        // Don't fail the operation, just warn
        toast.warning("Balance updated but audit log failed");
      }

      const updatedAllowance = {
        ...allowance,
        tokens_granted: tokensGranted,
        tokens_used: tokensUsed,
      };

      setAllowance(updatedAllowance);
      onSave?.(updatedAllowance);
      toast.success("Token balance updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving token balance:", error);
      toast.error("Failed to update token balance");
    } finally {
      setSaving(false);
    }
  };

  const remainingTokens = Math.max(tokensGranted - tokensUsed, 0);
  const creditsGranted = tokensGranted / tokensPerCredit;
  const creditsUsed = tokensUsed / tokensPerCredit;
  const creditsRemaining = remainingTokens / tokensPerCredit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Token & Plan Management</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !allowance ? (
          <div className="py-8 text-center text-muted-foreground">
            No active subscription period found for this user.
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info */}
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">User Name</Label>
                <p className="font-medium">{displayName || "Unnamed User"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Full User ID</Label>
                <p className="font-mono text-sm break-all">{userId}</p>
              </div>
            </div>

            {/* Subscription Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Subscription Period Start
                </Label>
                <p className="font-medium">
                  {format(new Date(allowance.period_start), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Subscription Period End
                </Label>
                <p className="font-medium">
                  {format(new Date(allowance.period_end), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>

            {/* Token Fields */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold">Token Balance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokens-granted">Tokens Granted</Label>
                  <Input
                    id="tokens-granted"
                    type="number"
                    min={0}
                    value={tokensGranted}
                    onChange={(e) => setTokensGranted(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokens-used">Tokens Used</Label>
                  <Input
                    id="tokens-used"
                    type="number"
                    min={0}
                    value={tokensUsed}
                    onChange={(e) => setTokensUsed(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Remaining Tokens</Label>
                <p className="text-2xl font-bold text-primary">
                  {remainingTokens.toLocaleString()}
                </p>
              </div>
            </div>

            {/* AI Credits (computed) */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold">
                AI Credits{" "}
                <span className="font-normal text-muted-foreground">
                  (1 credit = {tokensPerCredit.toLocaleString()} tokens)
                </span>
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Granted</Label>
                  <p className="text-lg font-medium">{Math.round(creditsGranted).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Used</Label>
                  <p className="text-lg font-medium">{Math.round(creditsUsed).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Remaining</Label>
                  <p className="text-lg font-medium text-primary">
                    {Math.round(creditsRemaining).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !allowance}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
