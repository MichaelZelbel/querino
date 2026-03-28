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

const ARTIFACT_TYPES = [
  { value: "prompt", label: "Prompts" },
  { value: "skill", label: "Skills" },
  { value: "claw", label: "Claws" },
  { value: "workflow", label: "Workflows" },
] as const;

export function MenerioIntegrationSection() {
  const { user } = useAuthContext();

  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
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

  // Load existing settings
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
        setBaseUrl(d.menerio_base_url || "");
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
      toast.error("API Key ist erforderlich");
      return;
    }
    if (!baseUrl.trim()) {
      toast.error("Base URL ist erforderlich");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        menerio_api_key: apiKey.trim(),
        menerio_base_url: baseUrl.trim().replace(/\/+$/, ""),
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

      toast.success("Menerio-Einstellungen gespeichert");
      setTestStatus("idle");
    } catch (error) {
      console.error("Error saving Menerio settings:", error);
      toast.error("Fehler beim Speichern der Menerio-Einstellungen");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!baseUrl.trim()) {
      toast.error("Bitte zuerst eine Base URL eingeben");
      return;
    }

    setTesting(true);
    setTestStatus("idle");

    try {
      // Simple GET to check if the Menerio instance is reachable
      const testUrl = baseUrl.trim().replace(/\/+$/, "");
      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 means the server is reachable but auth may differ — still counts as "reachable"
        setTestStatus("success");
        toast.success("Menerio-Instanz erreichbar!");
      } else {
        setTestStatus("error");
        toast.error(`Verbindung fehlgeschlagen: HTTP ${response.status}`);
      }
    } catch (error) {
      setTestStatus("error");
      toast.error("Verbindung fehlgeschlagen — URL nicht erreichbar");
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
          Verbinde Querino mit deinem Menerio 2nd Brain. Deine Artefakte werden als durchsuchbare Notizen in Menerio gespiegelt.
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
                Der API-Key, den du in Menerio für die Querino-Integration generiert hast.
              </p>
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="menerioBaseUrl">Menerio Base URL</Label>
              <Input
                id="menerioBaseUrl"
                type="url"
                placeholder="https://xyz.supabase.co/functions/v1"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setTestStatus("idle");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Die Supabase Functions URL deiner Menerio-Instanz.
              </p>
            </div>

            {/* Auto-Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Sync aktiviert</p>
                <p className="text-sm text-muted-foreground">
                  Änderungen an Artefakten werden automatisch zu Menerio gesynct.
                </p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            {/* Integration Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Integration aktiv</p>
                <p className="text-sm text-muted-foreground">
                  Deaktiviere die gesamte Menerio-Verbindung ohne Daten zu löschen.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Artifact Type Checkboxes */}
            <div className="space-y-3">
              <Label>Artefakt-Typen für Sync</Label>
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
                  Letzter Sync: {new Date(lastSyncAt).toLocaleString("de-DE")}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern…
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !baseUrl.trim()}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Teste…
                  </>
                ) : testStatus === "success" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Erreichbar
                  </>
                ) : testStatus === "error" ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                    Fehlgeschlagen
                  </>
                ) : (
                  "Verbindung testen"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
