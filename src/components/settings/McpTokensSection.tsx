import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TokenRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
}

const EXPIRY_OPTIONS = [
  { value: "never", label: "Never expires" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

// Cryptographically secure random token: prefix + 32 bytes base64url
function generateRawToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let b64 = btoa(String.fromCharCode(...bytes));
  // base64url: replace +/ and strip padding
  b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `qrn_mcp_${b64}`;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function tokenStatus(t: TokenRow): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (t.revoked_at) return { label: "Revoked", variant: "destructive" };
  if (t.expires_at && new Date(t.expires_at) < new Date()) {
    return { label: "Expired", variant: "destructive" };
  }
  return { label: "Active", variant: "default" };
}

export function McpTokensSection() {
  const { user } = useAuthContext();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExpiry, setNewExpiry] = useState<string>("never");
  const [creating, setCreating] = useState(false);

  // One-time reveal dialog
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirm
  const [revokeTarget, setRevokeTarget] = useState<TokenRow | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("mcp_api_tokens")
      .select("id, name, token_prefix, created_at, last_used_at, expires_at, revoked_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load tokens");
      setLoading(false);
      return;
    }
    setTokens((data ?? []) as TokenRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Please enter a name");
      return;
    }

    setCreating(true);
    try {
      const raw = generateRawToken();
      const token_hash = await sha256Hex(raw);
      const token_prefix = raw.slice(0, 16); // e.g. "qrn_mcp_AbCdEfGh"

      let expires_at: string | null = null;
      if (newExpiry !== "never") {
        const days = parseInt(newExpiry, 10);
        const d = new Date();
        d.setDate(d.getDate() + days);
        expires_at = d.toISOString();
      }

      const { error } = await supabase.from("mcp_api_tokens").insert({
        user_id: user.id,
        name: trimmed,
        token_hash,
        token_prefix,
        expires_at,
      });

      if (error) throw error;

      setRevealedToken(raw);
      setCreateOpen(false);
      setNewName("");
      setNewExpiry("never");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const { error } = await supabase
        .from("mcp_api_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", revokeTarget.id);
      if (error) throw error;
      toast.success(`Token "${revokeTarget.name}" revoked`);
      setRevokeTarget(null);
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to revoke token");
    } finally {
      setRevoking(false);
    }
  };

  const copyRevealed = async () => {
    if (!revealedToken) return;
    await navigator.clipboard.writeText(revealedToken);
    setCopied(true);
    toast.success("Token copied — store it now, it won't be shown again");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Personal MCP Tokens</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Long-lived tokens for connecting external MCP clients (OpenClaw, Claude Desktop, Cursor, Manus…).
              They survive browser sessions and don't expire after 1 hour like the Supabase session token.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            New token
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No tokens yet. Create one to connect an external MCP client.
          </p>
        ) : (
          <div className="space-y-2">
            {tokens.map((t) => {
              const status = tokenStatus(t);
              return (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">{t.name}</span>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono">{t.token_prefix}…</code>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                      <span>Created: {formatDate(t.created_at)}</span>
                      <span>Last used: {formatDate(t.last_used_at)}</span>
                      <span>Expires: {t.expires_at ? formatDate(t.expires_at) : "Never"}</span>
                    </div>
                  </div>
                  {!t.revoked_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeTarget(t)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new MCP token</DialogTitle>
            <DialogDescription>
              Give it a recognisable name (usually the client it will be used in).
              The raw token will be shown only once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="token-name">Name</Label>
              <Input
                id="token-name"
                placeholder="e.g. Claude Desktop on MacBook"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token-expiry">Expiration</Label>
              <Select value={newExpiry} onValueChange={setNewExpiry}>
                <SelectTrigger id="token-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-time reveal dialog */}
      <Dialog open={!!revealedToken} onOpenChange={(open) => !open && setRevealedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your new token</DialogTitle>
            <DialogDescription>
              This is the only time the full token will be shown. Store it somewhere safe now —
              if you lose it, you'll need to revoke it and create a new one.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Treat this token like a password. Anyone with it has full access to your Querino data.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono text-foreground break-all">
              {revealedToken}
            </code>
            <Button variant="outline" size="sm" onClick={copyRevealed} className="gap-1.5 shrink-0">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealedToken(null)}>I've saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke "{revokeTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The token will stop working immediately. Any MCP client using it will need to be
              reconfigured with a new token.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRevoke();
              }}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Revoke token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
