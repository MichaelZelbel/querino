import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Coins, Save, Loader2 } from "lucide-react";

interface CreditSetting {
  key: string;
  value_int: number;
  description: string | null;
}

const SETTING_KEYS = [
  "tokens_per_credit",
  "credits_free_per_month",
  "credits_premium_per_month",
] as const;

const SETTING_LABELS: Record<string, string> = {
  tokens_per_credit: "Tokens per AI Credit",
  credits_free_per_month: "Free Plan – AI Credits per Month",
  credits_premium_per_month: "Premium Plan – AI Credits per Month",
};

const SETTING_MIN_VALUES: Record<string, number> = {
  tokens_per_credit: 1,
  credits_free_per_month: 0,
  credits_premium_per_month: 0,
};

export function AICreditSettings() {
  const [settings, setSettings] = useState<Record<string, CreditSetting>>({});
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_credit_settings")
        .select("key, value_int, description")
        .in("key", SETTING_KEYS);

      if (error) throw error;

      const settingsMap: Record<string, CreditSetting> = {};
      data?.forEach((setting) => {
        settingsMap[setting.key] = setting;
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching AI credit settings:", error);
      toast.error("Failed to load AI credit settings");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setEditedValues((prev) => ({
        ...prev,
        [key]: numValue,
      }));
    } else if (value === "") {
      setEditedValues((prev) => ({
        ...prev,
        [key]: 0,
      }));
    }
  };

  const getCurrentValue = (key: string): number => {
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    return settings[key]?.value_int ?? 0;
  };

  const hasChanges = (key: string): boolean => {
    return (
      editedValues[key] !== undefined &&
      editedValues[key] !== settings[key]?.value_int
    );
  };

  const isValid = (key: string): boolean => {
    const value = getCurrentValue(key);
    const minValue = SETTING_MIN_VALUES[key] ?? 0;
    return value >= minValue;
  };

  const handleSave = async (key: string) => {
    const value = editedValues[key];
    if (value === undefined) return;

    const minValue = SETTING_MIN_VALUES[key] ?? 0;
    if (value < minValue) {
      toast.error(`Value must be at least ${minValue}`);
      return;
    }

    setSavingKey(key);
    try {
      const { error } = await supabase
        .from("ai_credit_settings")
        .update({ value_int: value })
        .eq("key", key);

      if (error) throw error;

      // Update local state
      setSettings((prev) => ({
        ...prev,
        [key]: { ...prev[key], value_int: value },
      }));

      // Clear edited state
      setEditedValues((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });

      toast.success(`${SETTING_LABELS[key]} updated successfully`);
    } catch (error) {
      console.error("Error updating AI credit setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-muted-foreground" />
            <CardTitle>AI Credit Settings</CardTitle>
          </div>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-muted-foreground" />
          <CardTitle>AI Credit Settings</CardTitle>
        </div>
        <CardDescription>
          Configure AI credit allocation and conversion rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {SETTING_KEYS.map((key) => {
          const setting = settings[key];
          const currentValue = getCurrentValue(key);
          const changed = hasChanges(key);
          const valid = isValid(key);
          const minValue = SETTING_MIN_VALUES[key] ?? 0;

          return (
            <div key={key} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={key}>{SETTING_LABELS[key]}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={minValue}
                    value={currentValue}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    className={!valid ? "border-destructive" : ""}
                  />
                  {setting?.description && (
                    <p className="text-xs text-muted-foreground">
                      {setting.description}
                    </p>
                  )}
                  {!valid && (
                    <p className="text-xs text-destructive">
                      Value must be at least {minValue}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleSave(key)}
                  disabled={!changed || !valid || savingKey === key}
                  size="sm"
                  className="gap-1.5"
                >
                  {savingKey === key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {savingKey === key ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
