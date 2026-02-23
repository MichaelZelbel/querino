# Querino – Open Source Setup Guide

## What Querino Is

Querino is an open-source platform for discovering, creating, and sharing AI artifacts — prompts, skills, and workflows that help you get better results from AI tools. It provides a structured environment for prompt development, refinement, and collaboration.

The platform is built on React, Supabase (PostgreSQL, Auth, Edge Functions), and n8n for workflow orchestration. AI-powered features such as prompt generation, refinement, and metadata suggestion are handled through n8n workflows that call external LLM providers.

Querino is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You are free to use, modify, and self-host it under the terms of that license.

## Requirements

- **Node.js** (latest LTS, 18+)
- **A Supabase project** (hosted or self-hosted)
- **An n8n instance** (cloud or self-hosted)
- **LLM provider account** (Azure OpenAI or OpenAI) for AI-powered features
- **SerpAPI account** (optional, only if web search features are used)

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/MichaelZelbel/querino.git
cd querino
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com) or on your self-hosted instance.

2. Apply database migrations. All migrations are located in `supabase/migrations/`. Use the Supabase CLI to apply them:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

3. Deploy the Edge Functions:

   ```bash
   npx supabase functions deploy
   ```

4. Set the following environment variables (secrets) on your Supabase project. These are used by Edge Functions to communicate with n8n:

   | Variable | Description |
   |----------|-------------|
   | `N8N_BASE_URL` | Base URL of your n8n instance (e.g., `https://your-n8n.example.com`) |
   | `N8N_SHARED_SECRET` | A shared secret used in the `Authorization` header for webhook authentication |

   You can set secrets via the Supabase CLI:

   ```bash
   npx supabase secrets set N8N_BASE_URL=https://your-n8n.example.com
   npx supabase secrets set N8N_SHARED_SECRET=your-shared-secret
   ```

### 3. Configure n8n

1. Set up an n8n instance. You can use [n8n Cloud](https://n8n.io) or self-host it.

2. Create the required credentials in n8n:

   - **HTTP Header Auth** — used for authenticating incoming webhook requests from Supabase. The header name and value must match the shared secret configured in Supabase.
   - **Postgres** — connection to your Supabase PostgreSQL database (use the connection string from your Supabase project settings).
   - **LLM provider** — OpenAI or Azure OpenAI credentials, depending on your preference.
   - **SerpAPI** (optional) — only required if workflows use web search capabilities.

3. Import the workflow definitions from the `/n8n` directory in the repository. In the n8n UI, use **Settings > Import from File** and select the JSON files.

4. Activate each imported workflow so that their webhook endpoints become live.

### 4. Connect Supabase to n8n

Once both Supabase and n8n are configured:

1. Verify that the `N8N_BASE_URL` secret in Supabase points to the correct n8n instance URL.

2. Confirm that the `N8N_SHARED_SECRET` matches the HTTP Header Auth credential configured in n8n.

3. Ensure the webhook paths defined in the n8n workflows match the paths called by the Supabase Edge Functions. You can inspect the Edge Function source code in `supabase/functions/` to verify the expected endpoints.

### 5. Run the App

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

The app will be available at `http://localhost:5173`.

## n8n Workflows

All required n8n workflow definitions are stored as JSON files in the `/n8n` directory at the repository root. These workflows must be imported into your n8n instance before AI-powered features (prompt generation, refinement, metadata suggestions, coaching) will function. Refer to the individual workflow files for details on their purpose and required credentials.
