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
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, CheckCircle2, Info, Unplug } from "lucide-react";
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

  // Connection state
  const [connectionKey, setConnectionKey] = useState("");
  const [connectedDisplayName, setConnectedDisplayName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Settings state (only relevant when connected)
  const [autoSync, setAutoSync] = useState(true);
  const [syncTypes, setSyncTypes] = useState<string[]>(["prompt", "skill", "claw", "workflow"]);
  const [isActive, setIsActive] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing integration on mount
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
        setAutoSync(d.auto_sync ?? true);
        setSyncTypes(d.sync_artifact_types || ["prompt", "skill", "claw", "workflow"]);
        setIsActive(d.is_active ?? true);
        setLastSyncAt(d.last_sync_at || null);
        setIsConnected(true);
        // Re-verify to get display name
        verifyExistingConnection(d.menerio_api_key);
      }
      setLoading(false);
    })();
  }, [user]);

  const verifyExistingConnection = async (apiKey: string) => {
    try {
      const res = await fetch(`${MENERIO_BASE_URL}/verify-connection`, {
        method: "POST",
        headers: { "x-api-key": apiKey },
      });
      const json = await res.json();
      if (json.ok) {
        setConnectedDisplayName(json.user_display_name || null);
      }
    } catch {
      // Silent — we already have the integration saved
    }
  };

  const handleConnect = async () => {
    if (!user || !connectionKey.trim()) {
      toast.error("Please paste your Menerio connection key.");
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch(`${MENERIO_BASE_URL}/verify-connection`, {
        method: "POST",
        headers: { "x-api-key": connectionKey.trim() },
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        toast.error(json.error || "Connection failed. Please check your key.");
        return;
      }

      // Store in database
      const payload = {
        user_id: user.id,
        menerio_api_key: connectionKey.trim(),
        menerio_base_url: MENERIO_BASE_URL,
        auto_sync: autoSync,
        sync_artifact_types: syncTypes,
        is_active: true,
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

      setIsConnected(true);
      setConnectedDisplayName(json.user_display_name || null);
      setConnectionKey("");
      toast.success(
        json.already_connected
          ? "Already connected to Menerio!"
          : "Successfully connected to Menerio!"
      );
    } catch (error) {
      console.error("Menerio connect error:", error);
      toast.error("Failed to save connection. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!existingId) return;
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from("menerio_integration" as any)
        .delete()
        .eq("id", existingId);
      if (error) throw error;

      setIsConnected(false);
      setConnectedDisplayName(null);
      setExistingId(null);
      setConnectionKey("");
      toast.success("Menerio integration disconnected.");
    } catch (error) {
      console.error("Menerio disconnect error:", error);
      toast.error("Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!existingId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("menerio_integration" as any)
        .update({
          auto_sync: autoSync,
          sync_artifact_types: syncTypes,
          is_active: isActive,
        })
        .eq("id", existingId);
      if (error) throw error;
      toast.success("Menerio settings saved.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
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
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Menerio 2nd Brain
          </CardTitle>
          {isConnected && (
            <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400 gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected{connectedDisplayName ? ` as ${connectedDisplayName}` : ""}
            </Badge>
          )}
        </div>
        <CardDescription>
          Mirror your Querino artifacts as searchable notes in your Menerio 2nd Brain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isConnected ? (
          /* ── Not connected: show key input + Connect button ── */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menerioKey">Connection Key</Label>
              <Input
                id="menerioKey"
                type="password"
                placeholder="Paste your Menerio connection key…"
                value={connectionKey}
                onChange={(e) => setConnectionKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Generate a connection key in your Menerio app under Settings → Integrations → Querino.
              </p>
            </div>
            <Button onClick={handleConnect} disabled={connecting || !connectionKey.trim()}>
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        ) : (
          /* ── Connected: show settings ── */
          <>
            {/* Auto-Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Sync</p>
                <p className="text-sm text-muted-foreground">
                  Automatically sync changes to artifacts to Menerio.
                </p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            {/* Integration Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Integration active</p>
                <p className="text-sm text-muted-foreground">
                  Pause the Menerio connection without disconnecting.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Artifact Type Checkboxes */}
            <div className="space-y-3">
              <Label>Artifact types to sync</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ARTIFACT_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
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
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save settings"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive hover:text-destructive"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting…
                  </>
                ) : (
                  <>
                    <Unplug className="mr-2 h-4 w-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
