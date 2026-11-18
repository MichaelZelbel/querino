# Mission

<!--
  Owner: humans only. This file is on the protected list; the factory cannot edit it.
  Written 2026-11-18 by Mission Control when Querino joined Cole Medin's factory, from the
  README, CLAUDE.md and what querino.ai shows today. The out-of-scope list is Mission Control's
  proposal for the owner to strike or keep.
-->

**Derived from:** `README.md`, `CLAUDE.md` and the live site https://querino.ai, read 2026-11-18
**Last reconciled with it:** 2026-11-18

## What Querino is

Querino is a website, querino.ai, where people keep the AI instructions that worked, so they can
find them again and reuse them instead of rewriting them from memory: prompts, prompt kits (several
prompts in one document), skills, workflows, and collections that group them. What someone keeps
stays private, is shared with a team, or is made public, where other people find it, rate it,
comment on it and copy it. AI helpers improve what people write (the prompt wizard, refinement,
coaches, insights, metadata suggestions), and a person's own AI assistant reaches their library
through Querino's MCP server.

One hosted site with one Supabase project (database, sign-in, edge functions). The code is open
source under the AGPL, so anyone may run their own copy. Premium is granted by hand: there is no
way to pay.

## Who it is for

- A person who uses AI tools every day, has stopped experimenting and started repeating, and keeps
  losing the wording that worked last time.
- That person's AI assistant, which reads and saves their prompts, skills and workflows through
  the MCP server.

Querino is not a chat app or an agent platform: it keeps and improves the instructions, and people
run them wherever they work.

## Core capabilities (in scope)

The factory may accept issues in these areas.

**Keeping**
- Creating, editing and versioning prompts, prompt kits, skills and workflows; collections.
- Private, team and public visibility; Markdown import and export with front matter.

**Finding**
- Browsing the public artifacts, categories and tags; semantic search; similar artifacts; profiles.

**Sharing**
- Public pages that search engines and link previews can read; ratings, reviews, comments,
  suggested edits; teams.

**AI help**
- The prompt wizard, refinement, coaches, insights, translation and metadata suggestions, each on
  the model the admin panel sets, within the person's AI credit allowance.

**Connections**
- The MCP server, GitHub sync, the link with Menerio.

**Running the site**
- The admin panel (models, users, credits), cookie consent, legal pages, sitemap, RSS.

## Out of scope: the factory must never build this

**Money**
- Any way to pay: a checkout, a pricing or purchase page, a customer portal, subscriptions, Stripe.
  Premium is granted by hand (`CLAUDE.md`, "No checkout, ever").
- A marketplace: selling or buying artifacts, paid artifacts, revenue sharing, payouts.

**Becoming something else**
- Running prompts as a chat app, executing workflows, or hosting agents. Querino keeps and improves
  instructions; it is not the place they run.
- Mobile apps, desktop apps or browser extensions. The website and the MCP server are the product.

**People's trust**
- Showing anyone a private or team artifact they were not given, making an artifact public without
  its owner's own action, or using people's artifacts to train or sell anything.
- Advertising, or statistics and tracking before the visitor's consent.
- Mail beyond the transactional mail a person triggered: no newsletters, marketing or reminders
  they did not ask for.

## Hard invariants: not tunable by any issue

1. **An edge function never reads an identity from a request body.** It takes it from the caller's
   sign-in, or it is a machine endpoint behind the internal key (`CLAUDE.md`, the security rule:
   the same mistake cost the whole user list three times).
2. **No way to pay, ever.** See above; restoring a payment path is never a fix.
3. **Every new table in `public` states its grants in the migration that creates it**
   (`CLAUDE.md`, "Every new table states its grants"), and an applied migration is never edited.
4. **Merging is not publishing.** A merge reaches main and Lovable's preview only. Publishing the
   site, deploying edge functions and applying migrations to the live project are the release step,
   after the owner's go. The factory never does them.
5. **The factory cannot modify governance files.** `MISSION.md`, `FACTORY_RULES.md`,
   `engineering.md` and `CLAUDE.md` are the constitution. A pull request touching any of them is an
   automatic reject.
6. **The factory cannot modify its own judge.** `harness/`, `.factory/`, `.github/`,
   `tests/security/` and the ratchet baselines in `scripts/` define what "working" means here. Adding
   an assertion is always welcome; removing or loosening one is a human decision, always.

## Allowed evolutions

- Faster pages, fewer downloads per page, clearer error messages.
- More tests: unit tests in `tests/web/` and `supabase/functions/_shared/`, more security tests.
- Lowering the counts in the lint and type ratchets.

## Definition of done

**Gate 1: checks and tests pass.** The commands in `harness/harness.config.json`: `npm run check`,
the frontend types, the two Deno unit suites and the script tests. CI's `required` check gathers
them with the build and the live security suite.

**Gate 2: a visitor understands it without being told.** Any new or changed screen says in plain
words what it is for and what happened.

**Gate 3: the journeys in `harness/END-TO-END.md` pass as a real visitor would take them,** on the
app started as `harness/RUNTIME.md` says.

## Open questions: decisions nobody has made yet

These are undecided, not forbidden. **The factory may propose an answer to any of them**, build
against it, and record what it assumed; the merge is then held for a human.

- **Q1** Whether Querino gets a staging copy with its own database and test data, so signed-in
  journeys can be checked without touching the live project.

**Except these, which do stop the factory:**

- Anything about who may sign in, act as whom, or see which artifact.
- Anything that migrates, rewrites or deletes stored data, or changes AI credit allowances.

## Decisions

- 2026-11-18 **Who may give the factory work?** Only the owner and Mission Control's two GitHub
  Apps. An issue or pull request anyone else opens is labelled `needs-owner` by the repository's
  trust workflow, and a bug report from the form arrives labelled `needs-owner` too: reports reach
  the factory as tickets the planner wrote, never raw.

## What the factory does NOT own: permanently human

- Whether a page looks right and reads right to a first-time visitor.
- Whether an AI helper's answer is actually good.
- Whether a release is worth publishing: the go is the owner's.
