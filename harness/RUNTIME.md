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

The app runs against this checkout's own **test copy** of Querino: a local Supabase stack built from
this checkout's `supabase/migrations` (a pull request's new migration is in it), seeded with made-up
accounts and items, with this checkout's edge functions served locally. It cannot reach the live
project. Why it is built this way: `harness/test-copy/README.md`.

**One call starts both,** the copy if it is not up yet and then the app against it:

```bash
harness/test-copy.sh dev "$PORT"    # the copy: about 30 s, about 2 min the first time on a machine
```

Pick a free port for `$PORT` (never a fixed one: several checkouts may run at once), or leave it out
and the command picks one and prints it. Run it in the background and record its process ID: that
process is the app server. The app is ready when `http://127.0.0.1:$PORT/` answers 200 with
"Querino" in the page.

`up` also writes the checkout's `.env.local` (git-ignored, first line says the test copy wrote it),
so even a plain `bun run dev` started in a new shell talks to the copy. Without that file and
without the variables, the app falls back to the **live** project
(`src/integrations/supabase/client.ts`). `harness/test-copy.sh status` says which project a plain
`bun run dev` would talk to. If a `.env.local` that the copy did not write is in the way, `up`
refuses to start rather than overwrite it.

For checks of your own, the copy's addresses, keys and seeded logins are shell exports:
`eval "$(harness/test-copy.sh env)"` sets them **in the shell that runs it**, so run it in the same
command as the check that needs them (each tool call is a new shell):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`: the copy's address and visitor key.
- `QUERINO_TEST_COPY_API_URL`, `_FUNCTIONS_URL`, `_MCP_URL`, `_ANON_KEY`, `_SERVICE_ROLE_KEY`,
  `_INTERNAL_JOB_SECRET` (the machine key the scheduled jobs send), `_PROJECT_ID`, `_DB_URL`, and
  `_AI` (`on` when the copy has an AI key, `off` when the AI features fail closed).
- For each seeded account `AUTHOR`, `NEW_AUTHOR`, `READER` and `ADMIN`:
  `QUERINO_TEST_COPY_<ACCOUNT>_EMAIL`, `_PASSWORD` and `_ID`; and
  `QUERINO_TEST_COPY_AUTHOR_MCP_TOKEN`, an MCP token of test-author.

What is seeded (the accounts, every item's address, the public prompt kit
`/prompt-kits/launch-week-prompt-kit` and the public collection
`/collections/0b000000-0000-4000-a000-000000000501`) is listed in `harness/test-copy/README.md`.

**When you are done,** stop the app (the process you started, nothing else), then run
`harness/test-copy.sh down`, also after a failure. It removes this checkout's containers, volumes,
network and `.env.local`, and fails if anything is left.

## Who to be where

**Never sign up, sign in or write on the live project.** Not with a seeded account, not with a new
one, not to try something. A seeded login (`author@querino.test` and the others) that fails means
the app is talking to the wrong project: stop, run `harness/test-copy.sh status`, and start the app
again with `harness/test-copy.sh dev`. Do not sign up to get past it.

**On the test copy, act as anyone.** Sign in as the seeded accounts, or sign up new ones (no email
is confirmed or sent), and create, edit, publish, unpublish, rate, comment, copy, upload and delete
freely: the copy is thrown away at `down`. The scheduled jobs (the moderation worker, embeddings,
the GitHub and Menerio sync queues) run against the copy's own functions on the schedules the
migrations give them, every two minutes for those four (`cron.job` in the copy). To run one at
once, post to it with the machine key, for example
`curl -X POST "$QUERINO_TEST_COPY_FUNCTIONS_URL/ai-moderate-content" -H "X-Internal-Key: $QUERINO_TEST_COPY_INTERNAL_JOB_SECRET" -H "Content-Type: application/json" -d '{}'`.
Use `QUERINO_TEST_COPY_SERVICE_ROLE_KEY` only to set up a state a person cannot reach by
themselves, never as proof of what a person can do. The AI helpers the browser calls (coaches,
insights, wizard) refuse a page on a free port (their CORS list names only fixed origins), so
check those through the API with a signed-in token.

**The live project stays visitor-only and read-only.** Use it only for a visitor check that needs
the real data, and start the app against it only for that, with the variables on the same command
line (they override `.env.local`):

```bash
VITE_SUPABASE_URL=https://zvuwkffneqxqsihlnfsd.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY="$(jq -r .http.env.VITE_SUPABASE_PUBLISHABLE_KEY harness/runtime.inputs.json)" \
bun run dev --port "$PORT" --strictPort --host 127.0.0.1
```

That key is the public visitor key querino.ai sends to every browser. There, **act only as a
visitor:** browse and search, never sign in, sign up, create, edit, rate, comment or copy. Never
bring a test-copy account, key or token to the live project.

## What never to do on this machine

Never publish the site, deploy an edge function (`supabase functions deploy`), apply a migration
(`supabase db push`, `npm run db:push`), set a secret, or call the Supabase Management API. Those
are the release step, after the owner's go. Never link the Supabase CLI to the live project
(`supabase link`, `--linked`), and never put the live project's address or a live key into the test
copy. Never push to a repository other than the one being built.
