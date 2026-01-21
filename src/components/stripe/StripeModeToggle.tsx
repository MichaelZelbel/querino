import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TestTube } from "lucide-react";
import { getStripeMode, setStripeMode, type StripeMode } from "@/config/stripe";

interface StripeModeToggleProps {
  showInProduction?: boolean;
}

export function StripeModeToggle({ showInProduction = false }: StripeModeToggleProps) {
  const [mode, setMode] = useState<StripeMode>(getStripeMode());

  // Only show in development or if explicitly allowed
  const shouldShow = import.meta.env.DEV || showInProduction;

  useEffect(() => {
    setStripeMode(mode);
  }, [mode]);

  if (!shouldShow) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-warning/50 bg-warning/5">
      <TestTube className="h-4 w-4 text-warning" />
      <div className="flex items-center gap-2">
        <Label htmlFor="stripe-mode" className="text-sm font-medium">
          Stripe Mode:
        </Label>
        <Badge variant={mode === "sandbox" ? "secondary" : "default"} className="text-xs">
          {mode === "sandbox" ? "Sandbox (Test)" : "Live"}
        </Badge>
      </div>
      <Switch
        id="stripe-mode"
        checked={mode === "live"}
        onCheckedChange={(checked) => setMode(checked ? "live" : "sandbox")}
      />
      {mode === "live" && (
        <div className="flex items-center gap-1 text-xs text-warning">
          <AlertTriangle className="h-3 w-3" />
          <span>Real payments</span>
        </div>
      )}
    </div>
  );
}
