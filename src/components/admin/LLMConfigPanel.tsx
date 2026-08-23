import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Play, RotateCcw, Save } from "lucide-react";

type Provider = "lovable" | "openrouter" | "openai" | "anthropic" | "gemini";

interface ProviderPreset {
  provider: Provider;
  label: string;
  models: { value: string; label: string }[];
}

interface Config {
  call_site: string;
  tier: string;
  description: string | null;
  provider: Provider;
  model: string;
  system_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
  enabled: boolean;
  updated_at: string;
  placeholders: string[];
}

interface TestResult {
  ok: boolean;
  error?: string;
  provider?: string;
  model?: string;
  content?: string | null;
  config_source?: string;
  latency_ms?: number;
  usage?: { total_tokens: number };
}

export default function LLMConfigPanel() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Config | null>(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-llm-config", {
        body: { action: "list" },
      });
      if (error) throw error;
      setConfigs(data.configs ?? []);
      setPresets(data.providers ?? []);
      setAvailability(data.availability ?? {});
    } catch (e) {
      toast.error("Failed to load LLM configs", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => configs.filter((c) => c.call_site.toLowerCase().includes(filter.toLowerCase())),
    [configs, filter],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Call Configuration</CardTitle>
        <CardDescription>
          Provider, model and system prompt for each AI call site. An inactive entry, or an empty
          system prompt, falls back to the default in the code. Runtime context is substituted into{" "}
          <code>{`{{placeholder}}`}</code> before the prompt is sent. A change can take up to 30
          seconds to reach every call site.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          {presets.map((p) => (
            <Badge
              key={p.provider}
              variant={availability[p.provider] ? "default" : "outline"}
              className="text-xs"
            >
              {p.label}
              {availability[p.provider] ? "" : " (no key)"}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Filter by call site…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call site</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>System prompt</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={`${c.call_site}:${c.tier}`}>
                    <TableCell className="font-mono text-xs">{c.call_site}</TableCell>
                    <TableCell>
                      <Badge
                        variant={availability[c.provider] ? "secondary" : "destructive"}
                        className="text-[10px]"
                      >
                        {presets.find((p) => p.provider === c.provider)?.label ?? c.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.model}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.system_prompt ? "Custom" : <span className="italic">Code default</span>}
                    </TableCell>
                    <TableCell>{c.enabled ? "✓" : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {editing && (
          <EditDialog
            config={editing}
            presets={presets}
            availability={availability}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await load();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EditDialog({
  config,
  presets,
  availability,
  onClose,
  onSaved,
}: {
  config: Config;
  presets: ProviderPreset[];
  availability: Record<string, boolean>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Config>({ ...config });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPrompt, setTestPrompt] = useState(
    "Say 'Hello' and tell me which model and provider you are using.",
  );
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const models = presets.find((p) => p.provider === draft.provider)?.models ?? [];
  const isCustomModel = !models.some((m) => m.value === draft.model);

  // Writes go through the admin function rather than PostgREST, so the whole
  // table stays behind one audited, admin-gated endpoint.
  const save = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-llm-config", {
        body: {
          action: "save",
          call_site: draft.call_site,
          tier: draft.tier,
          patch: {
            provider: draft.provider,
            model: draft.model.trim(),
            system_prompt: draft.system_prompt?.trim() ? draft.system_prompt : null,
            temperature: draft.temperature,
            max_tokens: draft.max_tokens,
            enabled: draft.enabled,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Saved");
      return true;
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Save first, so the test exercises what is actually persisted.
      if (!(await save())) return;
      const { data, error } = await supabase.functions.invoke("admin-llm-config", {
        body: {
          action: "test",
          call_site: draft.call_site,
          tier: draft.tier,
          prompt: testPrompt,
        },
      });
      if (error) throw error;
      setTestResult(data as TestResult);
    } catch (e) {
      setTestResult({ ok: false, error: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{draft.call_site}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provider</Label>
              <Select
                value={draft.provider}
                onValueChange={(v) => {
                  const next = v as Provider;
                  const firstModel = presets.find((p) => p.provider === next)?.models[0]?.value;
                  setDraft({ ...draft, provider: next, model: firstModel ?? draft.model });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem
                      key={p.provider}
                      value={p.provider}
                      disabled={!availability[p.provider]}
                    >
                      {p.label}
                      {!availability[p.provider] && " — no API key"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Select
                value={isCustomModel ? "__custom__" : draft.model}
                onValueChange={(v) => {
                  if (v === "__custom__") return;
                  setDraft({ ...draft, model: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom…</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="mt-2 font-mono text-xs"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="e.g. openai/gpt-4o-mini"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>System prompt</Label>
              {draft.system_prompt && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDraft({ ...draft, system_prompt: null })}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset to code default
                </Button>
              )}
            </div>
            <Textarea
              rows={10}
              value={draft.system_prompt ?? ""}
              onChange={(e) => setDraft({ ...draft, system_prompt: e.target.value })}
              placeholder="Leave empty to use the default in the code."
              className="font-mono text-xs"
            />
            {draft.placeholders.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Available placeholders:{" "}
                {draft.placeholders.map((p) => (
                  <code key={p} className="mx-0.5">{`{{${p}}}`}</code>
                ))}{" "}
                substituted with runtime context before sending.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={draft.temperature ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    temperature: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="auto"
              />
            </div>
            <div>
              <Label>Max tokens</Label>
              <Input
                type="number"
                min="1"
                value={draft.max_tokens ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    max_tokens: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="auto"
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(v) => setDraft({ ...draft, enabled: v })}
              />
              <Label>Active</Label>
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3 bg-muted/30">
            <Label className="text-xs">Test run</Label>
            <Textarea
              rows={2}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="text-xs"
            />
            <Button size="sm" onClick={runTest} disabled={testing || saving}>
              {testing ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Save &amp; test
            </Button>
            {testResult && (
              <div className="text-xs mt-2 space-y-1">
                {testResult.ok ? (
                  <>
                    <div className="text-muted-foreground">
                      {testResult.provider} / <code>{testResult.model}</code> ·{" "}
                      {testResult.latency_ms}ms · config: {testResult.config_source}
                      {testResult.usage && ` · ${testResult.usage.total_tokens} tokens`}
                    </div>
                    <pre className="whitespace-pre-wrap rounded bg-background p-2 border max-h-48 overflow-auto">
                      {testResult.content}
                    </pre>
                  </>
                ) : (
                  <div className="text-destructive">Error: {testResult.error}</div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (await save()) onSaved();
            }}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
