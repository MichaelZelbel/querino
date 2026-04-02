import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { toast } from "sonner";

const MENERIO_BASE_URL = "https://tjeapelvjlmbxafsmjef.supabase.co/functions/v1";

const ARTIFACT_TYPES = [
  { value: "prompt", label: "Prompts" },
  { value: "skill", label: "Skills" },
  { value: "claw", label: "Claws" },
  { value: "workflow", label: "Workflows" },
] as const;

export function MenerioIntegrationSection() {
  const { user } = useAuthContext();

  const [apiKey, setApiKey] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [syncTypes, setSyncTypes] = useState<string[]>(["prompt", "skill", "claw", "workflow"]);
  const [isActive, setIsActive] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("menerio_integration" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        setExistingId(d.id);
        setApiKey(d.menerio_api_key || "");
        setAutoSync(d.auto_sync ?? true);
        setSyncTypes(d.sync_artifact_types || ["prompt", "skill", "claw", "workflow"]);
        setIsActive(d.is_active ?? true);
        setLastSyncAt(d.last_sync_at || null);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!apiKey.trim()) {
      toast.error("API Key is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        menerio_api_key: apiKey.trim(),
        menerio_base_url: MENERIO_BASE_URL,
        auto_sync: autoSync,
        sync_artifact_types: syncTypes,
        is_active: isActive,
      };

      if (existingId) {
        const { error } = await supabase
          .from("menerio_integration" as any)
          .update(payload)
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("menerio_integration" as any)
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setExistingId((data as any).id);
      }

      toast.success("Menerio settings saved");
      setTestStatus("idle");
    } catch (error) {
      console.error("Error saving Menerio settings:", error);
      toast.error("Failed to save Menerio settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus("idle");

    try {
      const response = await fetch(MENERIO_BASE_URL, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (response.ok || response.status === 401 || response.status === 403) {
        setTestStatus("success");
        toast.success("Menerio instance is reachable!");
      } else {
        setTestStatus("error");
        toast.error(`Connection failed: HTTP ${response.status}`);
      }
    } catch (error) {
      setTestStatus("error");
      toast.error("Connection failed — URL not reachable");
    } finally {
      setTesting(false);
    }
  };

  const toggleSyncType = (type: string) => {
    setSyncTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Menerio 2nd Brain Integration
        </CardTitle>
        <CardDescription>
          Connect Querino with your Menerio 2nd Brain. Your artifacts will be mirrored as searchable notes in Menerio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="menerioApiKey">Menerio API Key</Label>
              <div className="relative">
                <Input
                  id="menerioApiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="menerio_key_xxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestStatus("idle");
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The API key you generated in Menerio for the Querino integration.
              </p>
            </div>

            {/* Auto-Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Sync enabled</p>
                <p className="text-sm text-muted-foreground">
                  Changes to artifacts are automatically synced to Menerio.
                </p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            {/* Integration Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Integration active</p>
                <p className="text-sm text-muted-foreground">
                  Disable the entire Menerio connection without deleting data.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Artifact Type Checkboxes */}
            <div className="space-y-3">
              <Label>Artifact types to sync</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ARTIFACT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={syncTypes.includes(type.value)}
                      onCheckedChange={() => toggleSyncType(type.value)}
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Last Sync Info */}
            {lastSyncAt && (
              <Alert className="border-border">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Last sync: {new Date(lastSyncAt).toLocaleString("en-US")}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !apiKey.trim()}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing…
                  </>
                ) : testStatus === "success" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Reachable
                  </>
                ) : testStatus === "error" ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                    Failed
                  </>
                ) : (
                  "Test connection"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
