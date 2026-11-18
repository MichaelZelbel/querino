# The factory's test copy of Querino

A private, throwaway Querino for one checkout: a local Supabase stack built from that checkout's own
`supabase/migrations`, seeded with made-up accounts and items, with its edge functions served
locally. The factory signs in, creates, publishes and checks new tables there, and the live project
is never touched. How a lap uses it is in `harness/RUNTIME.md`; this file is why it is built this way.
Approved by the owner on 2026-11-18 as step A of the release "Querino 1.0.0-beta.1 for creators".

```bash
harness/test-copy.sh dev [port]     # start the copy if needed, then the app against it
eval "$(harness/test-copy.sh up)"   # start, seed, write .env.local, print the exports
harness/test-copy.sh env            # the exports again
harness/test-copy.sh down           # containers, volumes, network and .env.local gone
harness/test-copy.sh status | list | prune
```

## What is in it

| Account (password in the exports) | What it has |
|---|---|
| `author@querino.test` (test-author), account from 2026-01-01 | a profile with bio and website; public prompts `summarise-a-meeting-transcript`, `explain-a-code-diff-to-a-reviewer`, `turn-research-notes-into-an-outline`; public skills `review-a-pull-request-for-risky-changes`, `write-release-notes-from-commits`; public workflows `weekly-research-digest`, `bug-report-triage`; the public prompt kit `launch-week-prompt-kit`; the public collection `/collections/0b000000-0000-4000-a000-000000000501` (one item of each type); the private prompt `private-draft-of-a-cover-note`; an MCP token (`QUERINO_TEST_COPY_AUTHOR_MCP_TOKEN`) |
| `new-author@querino.test` (test-new-author), created at `up` | one public item of each type: `ask-for-a-second-opinion`, `check-a-recipe-for-missing-steps`, `morning-inbox-sweep`, `interview-practice-kit`; younger than seven days |
| `reader@querino.test` (test-reader), from 2026-02-01 | a private prompt and an unpublished skill, nothing public |
| `admin@querino.test` (test-admin) | the admin role |

The accounts are in `accounts.json`, the items in `seed.sql`, all made up, with fixed ids so a
check can name a page. Seeding marks the seeded items as already moderated, so starting a copy
spends nothing on the AI key; whatever a lap publishes afterwards goes through the moderation
worker for real.

## Decisions and their reasons

- **The pinned CLI, not `npx` and not a dependency.** Supabase CLI 2.122.1 (2026-11-02), the last
  release of the 2.x line; 3.x is a new major nothing here was tried against. On Linux the release
  tarball is downloaded once into `~/.cache/querino-test-copy/` and checked against the checksum
  written in `lib.mjs`, so `bun.lock` never changes and two laps never race an `npx` install into
  one cache. Other platforms fall back to `npx --yes supabase@2.122.1`.
- **The app cannot fall back to the live project.** Without `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` the app's client uses the live project
  (`src/integrations/supabase/client.ts`), and an agent's tool calls each run in a new shell, so
  exports set by one call are gone in the next. `up` therefore also writes the checkout's
  `.env.local` (ignored by git), whose first line says the test copy wrote it, so a plain
  `bun run dev` in any shell talks to the copy; `harness/test-copy.sh dev` starts the copy and the
  app in one call. Variables set on the command line still win over the file (Vite's rule), which is
  how the explicit live-visitor command in `RUNTIME.md` keeps working. A `.env.local` without that
  first line is someone's own: `up` refuses to start rather than overwrite it, and `down` removes
  the file only when it is the copy's.
- **A generated `supabase/` folder, not the checkout's.** `up` writes `harness/.results/test-copy/`
  (ignored by git): a copy of the checkout's migrations and functions and a `config.toml` made from
  the repository's own, so the gateway's `verify_jwt` per function is what the live project has. The
  checkout's files are never changed and `git status` stays clean.
- **One project id and one port block per checkout.** The id is `querino-tc-` and ten hex digits
  of the SHA-256 of the checkout's path, so Docker's containers, volumes and network are the
  checkout's own. The block is ten ports between 20000 and 29999, picked from the same hash and
  moved to the next block when one of its ports is taken or another copy has claimed it; it stays
  below Linux's ephemeral range (32768 and up), where the app server's and the browser's free ports
  come from. When a port is taken in the seconds between that check and `supabase start` (proved on
  2026-11-19 by binding the API port in those seconds), the half-started stack is removed and the next free
  block is tried, twice at most; any other failure stops the copy at once.
- **One `up` or `down` at a time per checkout.** Both take a lock (`flock` on
  `harness/.results/test-copy.lock`, beside the folder `down` deletes). A second one waits up to 120
  seconds (`QUERINO_TEST_COPY_LOCK_WAIT`), then fails with a plain message; a second `up` that gets
  the lock after the first finds the copy up and prints its exports.
- **The live project is unreachable, by a rewrite before the migrations run.** Twelve migrations
  aim pg_cron jobs or the signup trigger at `https://zvuwkffneqxqsihlnfsd.supabase.co` (17
  addresses), and four of them carry the live visitor key. The copy's migrations are rewritten as they are copied:
  the live address becomes the local gateway (`http://kong:8000`, the gateway's name on the stack's
  network), a key issued for the live project becomes a stand-in, and any other mention of the live
  ref becomes a stand-in too, so an address built in pieces cannot reach it either. This cannot wait
  until after the migrations: each job is scheduled the moment its migration is applied (one of
  them every 30 seconds until a later migration slows it to two minutes), applying them all takes
  about 25 seconds, and pg_net would send a due request before any clean-up afterwards. The repository's
  migration files are never edited (they are what the live project ran). After the migrations,
  `up` checks inside the database that no scheduled job, function body or queued request names the
  live project and that every job posts to the local gateway, and refuses to continue otherwise.
- **The scheduled jobs run, against the copy.** The moderation worker, embeddings, the sync queues
  and the nightly model catalogue call the copy's own functions with a random machine key made at
  `up` (stored in Vault and given to the functions as `INTERNAL_JOB_SECRET`), so a check of the
  moderation queue sees the real worker. `QUERINO_TEST_COPY_INTERNAL_JOB_SECRET` lets a check run a
  worker at once instead of waiting for its tick.
- **Grants as on the live project.** `auto_expose_new_tables = false`: the live project stopped
  granting new tables to the API roles on 2026-10-30, so a migration that forgets its grants fails
  here the way it would fail there.
- **What it leaves out.** Realtime (nothing in `src/` uses it), Studio, the mail catcher, image
  transformation, logs and analytics, the pooler and postgres-meta: about 4.6 GB of images and about
  600 MB of memory per running copy.
- **Secrets.** The functions get `INTERNAL_JOB_SECRET` (random, local), `ADMIN_EMAIL` (made up) and
  `PUBLIC_SITE_URL` (`http://127.0.0.1:8080`), as `env()` references in the generated config, so no
  value is written to a file in the checkout. `OPENROUTER_API_KEY` is read from
  `~/.config/querino-test-copy/openrouter.key` (mode 600, placed by Mission Control, limited to
  2 USD) when that file exists; without it the AI features fail closed (`QUERINO_TEST_COPY_AI=off`).
  `RESEND_API_KEY` and `OPENAI_API_KEY` are never set: no mail leaves the copy. The lap's own
  `SUPABASE_*`, `VITE_SUPABASE_*` and AI keys are stripped from the CLI's environment, because the
  CLI reads `SUPABASE_*` variables as config overrides. The CLI's own telemetry is switched off
  (`SUPABASE_TELEMETRY_DISABLED`, `DO_NOT_TRACK`).
- **Accounts through the sign-in service, content through SQL.** The four accounts are created
  through the copy's own auth API (so their identities are what a real sign-up makes), then
  `seed.sql` dates them, sets the admin role and adds the items, as the local superuser.
- **Cleaning up.** `down` runs `supabase stop --no-backup` and then removes anything still carrying
  the project's label, and fails if a container, volume or network is left. `up` first removes any
  copy whose checkout folder no longer exists (a lap that died before its `down`); `prune` also
  removes copies whose checkout cannot be told.

## Known limits

- The AI helpers that the browser calls (coaches, insights, wizard) answer CORS only to
  `https://querino.ai`, `http://localhost:8080` and `http://localhost:5173`
  (`supabase/functions/_shared/cors.ts`). A lap's app runs on a free port, so in its browser those
  calls are refused; test them through the API with a signed-in token instead.
- Mail is not sent: the signup notification is not wired (its Vault key is the placeholder the
  migrations leave), `notify-admin` would answer 500 for want of a mail key, and the moderation
  worker skips its mail with a warning.
- The CLI has no setting to bind the published ports to 127.0.0.1, so they listen on every address
  of the factory's network namespace, its loopback and `10.231.0.2`. Inside the namespace every
  process of the factory account can reach every copy, the database included (`postgres:postgres`);
  the copies are that account's own. Outside it, nothing answers: measured on 2026-11-19 with a copy
  up, the host itself (as root) got no connection to `10.231.0.2` on the API or the database port,
  because the namespace's firewall (`inet gsforge`) drops what comes back from the namespace to the
  host and lets in only answers to the namespace's own outgoing connections, and the server's
  public address answers nothing on those ports.
