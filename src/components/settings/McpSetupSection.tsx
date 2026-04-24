import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Terminal, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const MCP_ENDPOINT = "https://mcp.querino.ai/mcp-server/mcp";

const TOOL_LIST = [
  "list_prompts – List your prompts",
  "search_prompts – Search prompts by keyword",
  "get_prompt – Get full prompt details",
  "create_prompt – Create a new prompt",
  "update_prompt – Update an existing prompt",
  "delete_prompt – Delete a prompt",
  "list_skills – List your skills",
  "search_skills – Search skills by keyword",
  "get_skill – Get full skill details",
  "create_skill – Create a new skill",
  "update_skill – Update an existing skill",
  "delete_skill – Delete a skill",
  "list_workflows – List your workflows",
  "search_workflows – Search workflows by keyword",
  "get_workflow – Get full workflow details",
  "create_workflow – Create a new workflow",
  "update_workflow – Update an existing workflow",
  "delete_workflow – Delete a workflow",
  "list_claws – List your claws",
  "search_claws – Search claws by keyword",
  "get_claw – Get full claw details",
  "create_claw – Create a new claw",
  "update_claw – Update an existing claw",
  "delete_claw – Delete a claw",
  "list_collections – List your collections",
  "get_collection – Get collection with items",
  "create_collection – Create a new collection",
  "delete_collection – Delete a collection",
  "get_my_profile – Get your profile",
  "update_my_profile – Update your profile",
];

function buildPromptText() {
  const toolsBullets = TOOL_LIST.map((t) => `• ${t}`).join("\n");
  return `I want you to connect to my Querino app (an AI prompt management platform) via its MCP server so you can help me manage my data.

Here is the MCP server endpoint:
${MCP_ENDPOINT}

Please add this as an MCP server connection. When connecting, use the following HTTP header for authentication:
Authorization: Bearer <ACCESS_TOKEN>

Replace <ACCESS_TOKEN> with the access token I will give you next.

Once connected, you will have access to these tools:
${toolsBullets}

IMPORTANT formatting rules when showing me results:
• Never use markdown tables — they break in narrow chat windows.
• Show each item as a short bullet point: key field + title/name only. Keep it to one line per item.
• Only show full details if I explicitly ask for them.
• When listing simple entities, use a comma-separated list or short bullets.

Use these tools whenever I ask you to view, add, edit, search, or delete my data. Always confirm what you found or created with a short summary.`;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label ? `${label} copied` : "Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 shrink-0">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function McpSetupSection() {
  const { user, session } = useAuthContext();
  const token = session?.access_token ?? "";

  const truncatedToken = token
    ? `${token.slice(0, 20)}…${token.slice(-10)}`
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">MCP Server / API Access</h2>
        <p className="text-muted-foreground text-sm">
          Connect AI agents like OpenClaw, Manus, Claude Desktop, or Cursor to manage your Querino data via the Model Context Protocol.
        </p>
      </div>

      {/* Card 1: Access Token */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Step 1 — Copy Your Access Token</CardTitle>
          </div>
          <CardDescription>
            Your AI agent needs this token to authenticate as you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono text-muted-foreground truncate">
                  {truncatedToken}
                </code>
                <CopyButton text={token} label="Access token" />
              </div>
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Token expires after ~1 hour.</strong> Copy a fresh token each time you configure a new MCP client.
                  Never share this token publicly — it grants full access to your account.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Log in to see your access token.</p>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Agent Prompt */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Step 2 — Send This Prompt to Your Agent</CardTitle>
          </div>
          <CardDescription>
            Paste this prompt into your AI agent or MCP-compatible client (for example: OpenClaw or Manus).
            It will configure the connection to your Querino MCP server. After it confirms the connection, provide your access token when it asks for it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <pre className="rounded-lg bg-muted p-4 text-xs font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {buildPromptText()}
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={buildPromptText()} label="Agent prompt" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm text-muted-foreground shrink-0">MCP Endpoint (for manual setup):</span>
            <code className="flex-1 rounded-md bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground truncate">
              {MCP_ENDPOINT}
            </code>
            <CopyButton text={MCP_ENDPOINT} label="MCP endpoint" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Compatible Clients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Compatible MCP Clients</CardTitle>
          </div>
          <CardDescription>
            Any client that supports the Model Context Protocol (MCP) over HTTP can connect to Querino.
            Examples include OpenClaw, Manus, and other MCP-enabled agents or tools that let you add a custom MCP server endpoint and send an Authorization header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["OpenClaw", "Manus", "Claude Desktop", "Cursor", "Any MCP Client"].map((client) => (
              <Badge key={client} variant="secondary" className="text-sm px-3 py-1">
                {client}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
