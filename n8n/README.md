# n8n Workflows – Querino

## Overview

This folder contains all n8n workflow definitions required to run Querino's AI orchestration layer. These workflows handle prompt generation, refinement, coaching, structured metadata extraction, AI-driven insights, and token usage tracking.

All communication between the Querino frontend and these workflows is routed through Supabase Edge Functions, which call n8n webhook endpoints. The workflows process requests using configured LLM providers (Azure Foundry, OpenAI) and return structured results to the application.

Every JSON file in this folder must be imported into a running n8n instance before Querino will function correctly.

## Required Workflows (Import All)

All workflow files in this folder are required. Import all JSON files before activating the system.

- **AI Agent workflow.json** — Sample AI agent workflow used as a reference template for agent-based orchestration.
- **Claw Insights.json** — Generates AI-driven quality analysis, recommendations, and tags for claws.
- **Prompt Coach.json** — Provides interactive coaching feedback on prompt quality and structure.
- **Prompt Insights.json** — Analyzes a prompt and returns structured quality scores, recommendations, and tags.
- **Prompt Refinement.json** — Iteratively refines an existing prompt based on user instructions.
- **Prompt Wizard.json** — Generates new prompts from user input using an LLM pipeline.
- **Skill Coach.json** — Provides coaching feedback on skill definitions.
- **Skill Insights.json** — Generates AI-driven quality analysis, recommendations, and tags for skills.
- **Suggest Claw Metadata.json** — Suggests title, description, category, and tags for a claw based on its content.
- **Suggest Prompt Metadata.json** — Suggests title, description, category, and tags for a prompt based on its content.
- **Suggest Skill Metadata.json** — Suggests title, description, category, and tags for a skill based on its content.
- **Suggest Workflow Metadata.json** — Suggests title, description, category, and tags for a workflow based on its content.
- **Translate Artifact.json** — Translates artifact fields (title, description, content, tags) between languages using structured output.
- **Update Token Usage.json** — Records LLM token consumption per user for credit tracking and enforcement.
- **Workflow Coach.json** — Provides coaching feedback on workflow configurations.
- **Workflow Insights.json** — Generates AI-driven quality analysis, recommendations, and tags for workflows.

The file `n8n-workflow-vibe-coding-skill.md` documents the vibe coding skill workflow structure and conventions.

## Import Instructions

1. Open your n8n instance (cloud or self-hosted).
2. Import all JSON files from this folder via **Settings > Import from File**.
3. Configure the following credentials in n8n:
   - **HTTP Header Auth** — the header name must be `X-API-Key` and the value must match the `N8N_WEBHOOK_KEY` secret configured in your Supabase project.
   - **Postgres** — connection to your Supabase PostgreSQL database.
   - **LLM provider** — Azure Foundry and/or OpenAI API credentials.
   - **SerpAPI** (optional) — only required if workflows use web search capabilities.
4. Activate all imported workflows so that webhook endpoints become live.
5. Verify that the webhook paths defined in each workflow match the paths called by the corresponding Supabase Edge Functions in `supabase/functions/`.
