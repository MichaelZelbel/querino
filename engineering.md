See [factory workflow policy](factory/WORKFLOW_POLICY.md) for factory-specific shared-workflow requirements.

# How Querino is built

`CLAUDE.md` is the engineering guide: the stack, the commands, the security rule, the product
policy and how migrations are written. Read it first; this file adds only what the factory needs.

- **Checks:** the commands in `harness/harness.config.json`, run as `harness/RUNTIME.md` says. A
  change comes with the tests that prove it: pure frontend logic in `tests/web/`, edge function
  shared code next to it in `supabase/functions/_shared/`, script checks in `tests/scripts/`.
- **The live security suite is CI's job.** `npm test` runs against the live project with one shared
  test account; never start it from a factory checkout. CI runs it on every pull request, and the
  `required` check waits for it.
- **Merging is not publishing.** Never publish the Lovable project, deploy edge functions, apply
  migrations or set secrets. Those happen in the release step after the owner's go: publish, deploy
  the changed functions, `npm run db:push`, then `node scripts/check-public-pages.mjs` must report
  every sitemap page.
- **A new migration** follows `CLAUDE.md` ("Every new table states its grants"); an applied
  migration is never edited. A pull request with a migration says so in its first line, because the
  release step has to apply it.
- **Ratchets only fall.** The lint ceiling and the edge function type baseline may go down, never up.
- **No secrets in files.** The only key in this repository is the public visitor key in
  `harness/runtime.inputs.json`, which querino.ai sends to every browser.
- **Commits** say in plain words what changed and why.
