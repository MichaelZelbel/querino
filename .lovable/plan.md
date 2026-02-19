
## Create Skill Coach.json and Workflow Coach.json

### What this involves

Duplicate `n8n/Prompt Coach.json` twice and make targeted substitutions in each copy. No new node types, no new connections, no structural changes — the workflow graph shape stays identical.

### Changes per file

#### Both files share these common changes:

| Location | Current value | Skill Coach | Workflow Coach |
|---|---|---|---|
| `"name"` (top level) | `"Prompt Coach"` | `"Skill Coach"` | `"Workflow Coach"` |
| Webhook `"path"` | `"prompt-coach"` | `"skill-coach"` | `"workflow-coach"` |
| Agent node `"name"` | `"Prompt Coach Agent"` | `"Skill Coach Agent"` | `"Workflow Coach Agent"` |
| All connection keys referencing `"Prompt Coach Agent"` | same | `"Skill Coach Agent"` | `"Workflow Coach Agent"` |
| `"active"` flag | `false` | `false` | `false` |

#### Config node — artifact ID field

The `"prompt_id"` assignment in the **Config** node becomes:

- **Skill Coach**: `"skill_id"` (field name + value expression updated from `prompt_id` to `skill_id`)
- **Workflow Coach**: `"workflow_id"`

The fallback default stays `"draft"`.

#### Config node — `"artifact_type"` default

- **Prompt Coach**: `'prompt'`
- **Skill Coach**: `'skill'`
- **Workflow Coach**: `'workflow'`

#### Config node — `session_id` expression

The session_id uses `prompt_id` in the fallback expression. This gets updated to use `skill_id` / `workflow_id` respectively so the deterministic session key stays correct.

#### Test Config node — test field

- `"test_prompt_id"` → `"test_skill_id"` (Skill Coach)
- `"test_prompt_id"` → `"test_workflow_id"` (Workflow Coach)
- `"test_canvas_content"` gets a more appropriate example value for testing

#### Agent system prompt

This is the most meaningful change — the LLM instruction is rewritten to match the artifact type:

**Skill Coach system prompt:**
```
You are "Skill Coach", an expert LLM framework designer helping the user write and refine skills.
A "skill" in Querino is a reusable LLM prompt framework (e.g. a structured system prompt, a chain-of-thought template, or a role definition) that can be applied across many tasks.
You always see the current skill canvas content.
You must follow the selected mode:
- chat_only: explain, ask clarifying questions, suggest improvements, but DO NOT modify the canvas.
- collab_edit: you MAY modify the canvas. Keep original intent, make minimal/safe improvements.

You MUST return ONLY valid JSON matching the Response Contract schema.
Never return diffs. If updating, return the full updated canvas text.

Additional rules:
- If mode is chat_only, return canvas.updated=false and do not provide canvas.content.
- If mode is collab_edit and skill is updated, set canvas.updated=true and provide full updated canvas in canvas.content.
- If mode is collab_edit and no changes are needed, return canvas.updated=false.

Skills can be long — focus on structure, clarity, and reusability rather than brevity.
```

**Workflow Coach system prompt:**
```
You are "Workflow Coach", an expert n8n automation architect helping the user design and refine n8n workflow descriptions.
A "workflow" in Querino is a natural-language description or specification of an n8n automation — explaining what the workflow does, its trigger, nodes, and expected behavior.
You always see the current workflow canvas content.
You must follow the selected mode:
- chat_only: explain, ask clarifying questions, suggest improvements, but DO NOT modify the canvas.
- collab_edit: you MAY modify the canvas. Keep original intent, make minimal/safe improvements.

You MUST return ONLY valid JSON matching the Response Contract schema.
Never return diffs. If updating, return the full updated canvas text.

Additional rules:
- If mode is chat_only, return canvas.updated=false and do not provide canvas.content.
- If mode is collab_edit and workflow description is updated, set canvas.updated=true and provide full updated canvas in canvas.content.
- If mode is collab_edit and no changes are needed, return canvas.updated=false.

Workflow descriptions can be long — focus on completeness, node-by-node clarity, and automation logic.
```

#### Node UUIDs

All node `"id"` UUIDs and the top-level workflow `"id"` will be replaced with freshly generated UUIDs so n8n treats them as distinct workflows and avoids ID collisions when importing both into the same n8n instance.

#### `"versionId"` and `"meta"`

- A fresh `"versionId"` UUID is generated for each
- `"meta"` block is kept as-is (same instanceId is fine — it just records origin)

### What stays the same

- Postgres Chat Memory node (same table `prompt_coach_messages`, same session key expression — the table is keyed by `session_id` which already encodes the artifact type via the frontend's deterministic key format `workspace:user:artifactId`)
- OpenRouter LLM node (same model, same credentials)
- Structured Output Parser (same schema — the response contract is identical)
- Build Response node (same logic)
- Respond to Webhook node (same)
- Call Update Token Usage sub-workflow call (same)
- All connections (graph topology is identical)

### Files to create

| File | Based on |
|---|---|
| `n8n/Skill Coach.json` | `n8n/Prompt Coach.json` |
| `n8n/Workflow Coach.json` | `n8n/Prompt Coach.json` |

### No frontend or edge function changes needed for this step

The existing `runCanvasAI.ts` and `prompt-coach` edge function already support `artifact_type: "skill" | "workflow"`. Once the two new n8n workflows are imported and activated in n8n, the frontend just needs to be pointed at the right webhook path — that would be a follow-up step (adding a `skill-coach` and `workflow-coach` edge function proxy, or extending the existing one to route by artifact type).

### Note on importing

After this PR, you (or your n8n admin) would need to:
1. Import `Skill Coach.json` into n8n
2. Import `Workflow Coach.json` into n8n
3. Activate both workflows
4. Configure the Auth Header credential (same `Y2M2gm8PMqf8Owkp` reference is kept, so if credentials are shared across workflows in your instance, no re-configuration is needed)
