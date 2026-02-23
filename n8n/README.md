# n8n Workflows – Querino

## Overview

This folder contains the exported n8n workflow definitions that power Querino's AI orchestration layer. These workflows handle prompt generation, refinement, coaching, structured metadata extraction, AI-driven insights, and token usage tracking.

All communication between the Querino frontend and these workflows is routed through Supabase Edge Functions, which call n8n webhook endpoints. The workflows process requests using configured LLM providers (Azure Foundry, OpenAI) and return structured results to the application.

All required workflows must be imported into a running n8n instance before Querino's AI-powered features will function. Optional workflows extend capabilities but are not strictly necessary for core prompt operations.

## Required Workflows (Core)

These workflows are required for the core product to function:

- **Prompt Wizard.json** — Generates new prompts from user input using an LLM pipeline.
- **Prompt Coach.json** — Provides interactive coaching feedback on prompt quality and structure.
- **Prompt Refinement.json** — Iteratively refines an existing prompt based on user instructions.
- **Prompt Insights.json** — Analyzes a prompt and returns structured quality scores, recommendations, and tags.
- **Update Token Usage.json** — Records LLM token consumption per user for credit tracking and enforcement.

## Additional Workflows (Optional Features)

These workflows extend functionality with coaching, insights, and metadata suggestions for additional artifact types. They are not strictly required for the core prompt flow.

- **Skill Coach.json** — Provides coaching feedback on skill definitions.
- **Skill Insights.json** — Generates AI-driven quality analysis for skills.
- **Workflow Coach.json** — Provides coaching feedback on workflow configurations.
- **Workflow Insights.json** — Generates AI-driven quality analysis for workflows.
- **Claw Insights.json** — Generates AI-driven quality analysis for claws.
- **Suggest Prompt Metadata.json** — Suggests title, description, category, and tags for a prompt based on its content.
- **Suggest Skill Metadata.json** — Suggests title, description, category, and tags for a skill based on its content.
- **Suggest Claw Metadata.json** — Suggests title, description, category, and tags for a claw based on its content.
- **Suggest Workflow Metadata.json** — Suggests title, description, category, and tags for a workflow based on its content.

## Utility / Maintenance

- **Backup Querino Workflows to GitHub.json** — Automates exporting all active n8n workflows to the repository for version control.
- **AI Agent workflow.json** — A sample/template AI agent workflow (archived, not required for production use).
- **n8n-workflow-vibe-coding-skill.md** — Documentation describing the vibe coding skill workflow structure and conventions.

## Import Instructions

1. Open your n8n instance (cloud or self-hosted).
2. Navigate to **Settings > Import from File** and import the required workflow JSON files first.
3. Configure the following credentials in n8n:
   - **HTTP Header Auth** — must match the `N8N_SHARED_SECRET` configured in your Supabase project secrets.
   - **Postgres** — connection to your Supabase PostgreSQL database.
   - **LLM provider** — Azure Foundry and/or OpenAI API credentials.
   - **SerpAPI** (optional) — only required if workflows use web search capabilities.
4. Activate each imported workflow so that webhook endpoints become live.
5. Verify that the webhook paths defined in each workflow match the paths called by the corresponding Supabase Edge Functions in `supabase/functions/`.
