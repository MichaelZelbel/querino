## Review findings

**1. "MCP Server / API Access" label**

An MCP server is a protocol endpoint that AI clients (Claude Desktop, Cursor, OpenClaw, Manus, etc.) connect to over JSON‑RPC — it is *not* a traditional REST API that a user would call from their own code. The "API access" half of the label is misleading. Recommend simplifying to just **"MCP Server"**.

**2. "Send this prompt to your agent" card (your "census prompt")**

I cross‑checked the embedded agent prompt in `src/components/settings/McpSetupSection.tsx` against the live `supabase/functions/mcp-server/index.ts`:

- Endpoint `https://mcp.querino.ai` — correct.
- Token prefix `qrn_mcp_` and Bearer header auth — matches `authenticate()` in the edge function.
- Required headers (`Authorization`, `Accept: application/json, text/event-stream`, `Content-Type: application/json`) — correct for MCP Streamable HTTP.
- Tool list in `TOOL_LIST` matches the registered tools on the server for prompts, prompt kits, skills, workflows, collections, and profile.
- **Claws**: the server still registers `list/search/get/create/update/delete_claws`, but per project memory ("Claws removed from product — do not surface in docs or UI") the UI prompt correctly omits them. Keep it that way.
- Data model section (Prompts / Prompt Kits / Skills / Workflows / Collections) is current.

No factual/staleness issues in the agent prompt — only the surrounding label needs updating.

## Changes

Edit `src/components/settings/McpSetupSection.tsx`:

1. Heading: `MCP Server / API Access` → `MCP Server`.
2. Intro sentence: keep wording but drop the "API" framing; describe it as connecting AI agents/MCP clients to your Querino account.
3. Inside the embedded `buildPromptText()` agent prompt, update the two breadcrumb references:
   - `Settings → MCP Server / API Access → "Personal MCP Tokens"` → `Settings → MCP Server → "Personal MCP Tokens"` (2 occurrences).

No other files reference "MCP Server / API Access" (verified with grep). No backend or token logic changes.
