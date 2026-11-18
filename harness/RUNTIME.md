# How to run Querino in a checkout

For every agent of the factory. The journeys to check are in `harness/END-TO-END.md`; the project's
own guide is `CLAUDE.md`.

## Install

`bun install --frozen-lockfile` from the root. `bun.lock` is the only lockfile; never run
`npm install` and never change `bun.lock` unless the ticket changes a dependency.

## The checks and tests

Exactly what `harness/harness.config.json` names, all from the root and all offline except for
downloading Deno's imports the first time:

- `npm run check` (migrations, table grants, lint ratchet, edge function type ratchet)
- `npx tsc --noEmit -p tsconfig.json` (frontend types)
- `bun run test:unit` and `bun run test:web` (Deno; each ends with `ok | N passed | 0 failed`)
- `npm run test:scripts`

Save the whole output in `$ARTIFACTS_DIR` (or a temporary folder when that is not set).

**Never run `npm test` (the security suite) here.** It runs against the live project with one shared
test account, CI runs it on every pull request, and two runs at once corrupt each other.

## Start the app

Pick a free port (never a fixed one: several checkouts may run at once), then from the root:

```bash
VITE_SUPABASE_URL=https://zvuwkffneqxqsihlnfsd.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY="$(jq -r .http.env.VITE_SUPABASE_PUBLISHABLE_KEY harness/runtime.inputs.json)" \
bun run dev --port "$PORT" --strictPort --host 127.0.0.1
```

It is ready in a few seconds when `http://127.0.0.1:$PORT/` answers 200 with "Querino" in the page.
The key is the public visitor key that querino.ai sends to every browser; it can read only what a
visitor may read. Stop the app when you are done (stop the process you started, nothing else).

The app reads the live project's public data. **Act only as a visitor:** browse and search, never
sign in, sign up, create, edit, rate, comment or copy. There is no staging copy with its own data
yet (`MISSION.md`, Q1).

## What never to do on this machine

Never publish the site, deploy an edge function (`supabase functions deploy`), apply a migration
(`supabase db push`, `npm run db:push`), set a secret, or call the Supabase Management API. Those
are the release step, after the owner's go. Never push to a repository other than the one being
built.
