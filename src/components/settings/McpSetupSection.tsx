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
  "list_prompt_kits – List your prompt kits",
  "search_prompt_kits – Search prompt kits by keyword",
  "get_prompt_kit – Get full prompt kit details",
  "create_prompt_kit – Create a new prompt kit",
  "update_prompt_kit – Update an existing prompt kit",
  "delete_prompt_kit – Delete a prompt kit",
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
  "list_collections – List your collections",
  "get_collection – Get collection with items",
  "create_collection – Create a new collection",
  "delete_collection – Delete a collection",
  "get_my_profile – Get your profile",
  "update_my_profile – Update your profile",
];

function buildPromptText() {
  return `Set up Querino as my permanent AI-artifacts MCP server. This has two parts: install the server, and save behavior rules so you use it correctly in every future session. Do both.

**Step 1 — Get my token.** Before anything else, ask me to paste my Querino Personal MCP Token. I'll generate it in Querino → Settings → MCP Server / API Access → "Personal MCP Tokens" → "Create token" (starts with \`qrn_mcp_\`, shown only once) and send it back. Wait for it — don't try to connect without it.

**Step 2 — Install the server.** Register Querino as a **persistent, user-scoped MCP server** using your tool's normal mechanism (a CLI like \`claude mcp add\` / \`gemini mcp add\`, or your MCP config file):

- Transport: HTTP (streamable, JSON-RPC 2.0; SSE responses supported)

- URL: \`https://mcp.querino.ai\` *(exactly this — no \`/mcp\`, \`/sse\`, or \`/v1\` suffix; the root URL is the endpoint)*

- Auth header: \`Authorization: Bearer <the token I gave you>\`

- The token is long-lived (no 1-hour expiry); it stays valid until I revoke it. If you get HTTP 401 (invalid/expired/revoked), stop and ask me for a new one — don't retry the old one.

**Step 3 — Save behavior rules.** Ask my permission, then append the following to your **global / user-level** instructions file (e.g. \`~/.claude/CLAUDE.md\`, \`GEMINI.md\`, \`AGENTS.md\`, or your tool's user-scope rules) so they apply in every future session:

- **Tool-family routing.** A single reusable LLM instruction/template → \`prompt_*\`. Several prompts shipped together as one Markdown document → \`prompt_kit_*\`. A capability/framework for how to do something → \`skill_*\`. A multi-step process/pipeline → \`workflow_*\`. A mixed, user-curated grouping across types → \`collection_*\`. If unsure, ask one short clarifying question instead of guessing.

- **Safe access.** Prefer \`search_*\` when I don't already know the exact id/slug; never fabricate ids. Always call \`get_*\` before any \`update_*\`/\`delete_*\` so the current state is visible.

- **Mutations.** Only create/update/delete when my intent is clear; if ambiguous, confirm first. \`delete_*\` requires explicit confirmation unless I already said "delete"/"remove" this turn. Never bulk-delete speculatively.

- **Confirmation.** After any create/update/delete, end with a one-line confirmation: what changed and the id/slug it now has. Surface the real server error message on failure — don't hide it behind a generic message.

- **Output format.** Never use Markdown tables (they break in narrow chat). List each item as one short bullet: id/slug + title only. Show full details (content, tags, description) only when I explicitly ask.

**Step 4 — Verify.** Confirm the MCP server is connected (list your servers and confirm Querino tools like \`list_prompts\`, \`get_my_profile\` appear), confirm the rules were written to the file, then call \`get_my_profile\` with no arguments to prove auth works end-to-end. Report all three results, with exact status codes/messages on any failure.`;
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
        <h2 className="text-xl font-semibold text-foreground mb-1">MCP Server</h2>
        <p className="text-muted-foreground text-sm">
          Connect AI agents and MCP-compatible clients like OpenClaw, Manus, Claude Desktop, or Cursor
          to manage your Querino data via the Model Context Protocol. Authentication uses long-lived
          personal tokens that you create below.
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
            Workflow: (1) create a personal MCP token above and copy it. (2) Copy the prompt below.
            (3) <strong>Before sending it to your agent</strong>, replace the
            <code className="mx-1 px-1 rounded bg-muted text-xs">&lt;&lt;&lt;PASTE YOUR qrn_mcp_... TOKEN HERE&gt;&gt;&gt;</code>
            line at the top of the prompt with your actual token. Then send the whole prompt to your AI
            agent or MCP-compatible client (for example: OpenClaw, Manus, Claude Desktop, Cursor) — it
            will use the token from the top of the prompt for every request, so you don't need to paste
            it again separately.
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
