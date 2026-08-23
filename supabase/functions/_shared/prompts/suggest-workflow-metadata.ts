// System prompt for suggesting a workflow's metadata.
//
// Here rather than in the function that sends it so admin-llm-config can read
// it too: the LLM Config page shows the prompt in use, and it cannot show a
// default it has no way to load.

export const SYSTEM_PROMPT = `You generate concise metadata for AI Workflows in the Querino library.
A Workflow describes an automation, integration, or n8n-style pipeline written in Markdown — what it does end-to-end.

Return:
- A short descriptive title (max 60 chars).
- A single-sentence description (max 160 chars) of the workflow's outcome.
- A single category from this fixed list.
- 3–6 lowercase tags describing the domain, key tools/integrations, and trigger type.

Allowed categories:
- Automation
- Integration
- Data Processing
- Notifications
- Content
- Marketing
- Sales
- Operations
- Developer Tools
- Other

Pick the single best-fitting category. Tags should mention concrete services/tools where applicable (e.g. "slack", "airtable", "webhook", "cron").`;
