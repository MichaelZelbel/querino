# Querino

A platform for discovering, creating, and sharing AI artifacts—prompts, skills, and workflows that help you get better results from AI tools.

## Features

### Core Functionality
- **Prompts** - Create, store, and share AI prompts with the community
- **Skills** - Build reusable prompt frameworks and system prompts
- **Workflows** - Document automation sequences and procedures in Markdown
- **Collections** - Organize related artifacts into themed groups

### Collaboration
- **Teams** - Create shared workspaces for organizations
- **Reviews & Ratings** - Rate and review community content
- **Comments** - Discuss and provide feedback on artifacts
- **Suggestions** - Propose edits to public artifacts

### Discovery
- **Semantic Search** - Find content using natural language queries
- **Similar Artifacts** - Discover related prompts, skills, and workflows
- **Categories & Tags** - Browse by category or filter by tags

### Import/Export
- **Markdown Export** - Download artifacts as `.md` files with YAML frontmatter
- **Markdown Import** - Import prompts from Markdown files
- **GitHub Sync** - Sync your library to a GitHub repository

### AI Features
- **Prompt Wizard** - Generate prompts from brief descriptions
- **AI Suggestions** - Auto-fill metadata (title, description, tags)
- **Prompt Refinement** - Improve prompts with AI assistance

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **State Management**: TanStack Query

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase project (or use Lovable Cloud)

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Header, Footer
│   ├── prompts/     # Prompt-related components
│   ├── skills/      # Skill-related components
│   ├── workflows/   # Workflow-related components
│   └── ...
├── hooks/           # Custom React hooks
├── pages/           # Route pages
├── types/           # TypeScript type definitions
├── contexts/        # React contexts (Auth, Workspace)
├── lib/             # Utility functions
└── config/          # Configuration files

supabase/
└── functions/       # Edge functions
    ├── github-sync/
    ├── prompt-wizard/
    ├── refine-prompt/
    ├── suggest-metadata/
    └── ...
```

## Documentation

- [API Documentation](./docs/API.md) - Edge function endpoints
- [Database Schema](./docs/SCHEMA.md) - Database tables and relationships

## License

MIT

## Links

- [Live App](https://querino.lovable.app)
- [Documentation](https://querino.lovable.app/docs)
