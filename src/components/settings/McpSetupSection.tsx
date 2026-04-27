import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { McpTokensSection } from "./McpTokensSection";

const MCP_ENDPOINT = "https://mcp.querino.ai";

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
  return `Please connect to my Querino account via its MCP server so you can help me manage my AI artifacts (prompts, skills, claws, workflows, collections).

=== 1. CONNECTION DETAILS ===

• MCP endpoint: ${MCP_ENDPOINT}
• Transport: MCP Streamable HTTP (the standard remote MCP transport over HTTP POST with JSON-RPC 2.0; SSE responses supported)
• Auth: HTTP header "Authorization: Bearer <QUERINO_MCP_TOKEN>"
• Method: connect directly to the endpoint above — do NOT append /mcp, /sse, /v1, or any other path. The root URL is the MCP endpoint.

When sending requests, include both of these headers:
  Authorization: Bearer <QUERINO_MCP_TOKEN>
  Accept: application/json, text/event-stream
  Content-Type: application/json

Replace <QUERINO_MCP_TOKEN> with the long-lived Querino MCP token I will give you next. The token starts with "qrn_mcp_". It does NOT expire after 1 hour — it is valid until I revoke it (or until its optional expiration date). If you get 401 with a message about an invalid or revoked token, ask me for a new one.

=== 2. VERIFY THE CONNECTION ===

After registering the server, please run this verification flow and report back what you got:

1. Send an "initialize" request and confirm the server name and protocol version.
2. Call "tools/list" and confirm you can see Querino tools (e.g. list_prompts, get_my_profile, ...).
3. Call "tools/call" with name "get_my_profile" and no arguments to confirm authentication works end-to-end.

If any of these fail, tell me the exact error (status code + message) instead of silently retrying.

=== 3. QUERINO DATA MODEL (decide which tool family to use) ===

• Prompts → reusable LLM instructions / templates. Use the prompt_* tools when the user talks about "a prompt", instructions for an LLM, or text they want to reuse.
• Skills → structured, higher-level capabilities (can include OpenClaw-style skills). Use the skill_* tools when the user talks about a capability, framework, or "how the agent should do X".
• Claws → low-level executable logic units used by skills. Use the claw_* tools when the user talks about a specific tool, action, or callable unit consumed by a skill.
• Workflows → multi-step AI processes that combine prompts and/or skills. Use the workflow_* tools when the user talks about a process, pipeline, or sequence of steps.
• Collections → user-curated groups of mixed items (prompts, skills, claws, workflows). Use the collection_* tools when the user talks about grouping, organizing, or bundling items.

If you're unsure which family applies, ask one short clarifying question instead of guessing.

=== 4. AVAILABLE TOOLS ===

${toolsBullets}

=== 5. AGENT USAGE GUIDANCE ===

• Prefer search_* tools when you don't already know the exact id/slug of an item. Don't fabricate ids.
• Always call get_* before update_* or delete_* so you (and I) can see the current state and you can show a diff or summary.
• Only mutate data (create / update / delete) when I clearly intend it. If my request is ambiguous, confirm first.
• Destructive actions (delete_*) require explicit confirmation from me, unless I already said "delete" or "remove" in this turn. Never delete in bulk speculatively.
• When creating or updating, echo back the resulting id/slug + title so I can verify.
• On errors, surface the real server error message; don't hide it behind a generic "something went wrong".

=== 6. OUTPUT FORMATTING RULES (strict) ===

• Never use markdown tables — they break in narrow chat windows.
• Show each item as a short bullet line: key field (id or slug) + title/name only. One line per item.
• Only show full details (description, content, tags, etc.) if I explicitly ask for them.
• For simple entity lists (e.g. tags, categories), use a short comma-separated list or short bullets.
• After any create/update/delete, end with a one-line confirmation: what changed, and the id/slug it now has.

Use these tools whenever I ask you to view, add, edit, search, or delete my data in Querino.`;
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">MCP Server / API Access</h2>
        <p className="text-muted-foreground text-sm">
          Connect AI agents like OpenClaw, Manus, Claude Desktop, or Cursor to manage your Querino data
          via the Model Context Protocol. Authentication uses long-lived personal tokens that you create below.
        </p>
      </div>

      {/* Step 1: Personal MCP Tokens */}
      <McpTokensSection />

      {/* Step 2: Agent Prompt */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Send this prompt to your agent</CardTitle>
          </div>
          <CardDescription>
            Paste this prompt into your AI agent or MCP-compatible client (for example: OpenClaw or Manus).
            It will configure the connection to your Querino MCP server. After it confirms the connection,
            give it one of your personal MCP tokens from above.
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

      {/* Compatible Clients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Compatible MCP Clients</CardTitle>
          </div>
          <CardDescription>
            Any client that supports the Model Context Protocol (MCP) over HTTP can connect to Querino.
            Examples include OpenClaw, Manus, and other MCP-enabled agents or tools that let you add a
            custom MCP server endpoint and send an Authorization header.
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
