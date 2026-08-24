# Every public content page was a 404 for logged-out visitors

## FIXED 2026-08-24

Michael gave the go-ahead and it is applied to production, in two steps.

**Step one, the outage.** Verified logged-out with `node migration/prodcheck.mjs`:
**5 of 5 checked pages back to their real content**, 24 prompts listed on `/discover`,
no console errors, no `noindex`.

**Step two, the bylines.** Michael then asked for author names and avatars to be visible
to logged-out visitors again, so `anon` got its own SELECT policy and the grant was
narrowed from 14 columns to the 7 the public pages actually read. The byline renders
with its avatar, and the security suite is **132 green with nothing failing**, which it
had not been all night.

What was run in step one, through the Supabase Management API:

```sql
GRANT SELECT (
  id, display_name, avatar_url, bio, website, twitter, github,
  created_at, updated_at,
  github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at
) ON public.profiles TO anon;
```

Recorded in the repo as `supabase/migrations/20260824013000_restore_anon_read_on_profiles.sql`
on `main` (`2bce8dd`), so the next migration run does not undo it and the reasoning sits
where the next person will look.

And in step two:

```sql
REVOKE SELECT (created_at, updated_at, github_repo, github_branch,
               github_folder, github_sync_enabled, github_last_synced_at)
  ON public.profiles FROM anon;

CREATE POLICY "Anonymous readers can view public content authors"
ON public.profiles FOR SELECT TO anon
USING (
  EXISTS (SELECT 1 FROM public.prompts   WHERE prompts.author_id   = profiles.id AND prompts.is_public = true)
  OR EXISTS (SELECT 1 FROM public.skills    WHERE skills.author_id    = profiles.id AND skills.published = true)
  OR EXISTS (SELECT 1 FROM public.workflows WHERE workflows.author_id = profiles.id AND workflows.published = true)
);
```

Recorded as `supabase/migrations/20260824021500_public_authors_are_visible_again.sql` on
`main` (`f0d6ba6`).

**What that exposes, measured immediately after applying:** `anon` can read **2 profiles
in total**, being the two people with published content, not the user table. The
"reduce data harvesting risk" reason behind the January migration survives: there is no
anonymous path to a profile that has published nothing. `role`, `plan_type`,
`plan_source` and the github sync settings all still answer `42501` to the anon key.
The team-mate branch of the authenticated policy was deliberately **not** mirrored,
because team membership is not public.

**Still open, and it blocks nothing:** `prompt_kits` appears in neither policy, so a
prompt kit author shows no byline unless they also have a public prompt, skill or
workflow. That gap predates both.

The account of what happened follows, unchanged.

---

**This was not a migration issue.** It was found while taking the migration baseline.

## What is happening

Load any prompt, skill or workflow page without being signed in:

    https://querino.ai/prompts/conduct-a-project-premortem-and-plan-revision
    https://querino.ai/skills/anti-hallucination-reasoning-protocol

Both render **"Prompt Not Found" / "Skill Not Found"**, and both send
`<meta name="robots" content="noindex, nofollow">`.

Verified 2026-08-24 against production in a clean, logged-out browser. The console says:

    Failed to load resource: the server responded with a status of 401
    Error fetching prompt: {code: 42501, message: permission denied for table profiles}

Signed in it works, which is why it can sit there unnoticed.

## Why

`supabase/migrations/20260823174224_c30d04a7-0e6c-47af-8501-9fb0e5bed88f.sql`, committed
2026-08-23 in `fa0fa18` ("Changes"), tightens column-level security on `profiles`:

```sql
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, display_name, avatar_url, bio, website, twitter, github,
  created_at, updated_at,
  github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at
) ON public.profiles TO authenticated;
```

It revokes from **both** roles and grants back to **one**. `anon` was never re-granted.

Every public detail page asks for the author alongside the artefact:

```ts
.from("prompts").select(`*, profiles:author_id ( id, display_name, avatar_url )`)
```

PostgREST fails the whole query when one embedded table is denied, so the page gets an
error, not a partial row, and the components treat an error as "not found". 39 query
sites across 24 files embed or read `profiles`.

## Blast radius

- All 89 `/prompts/<slug>` URLs Querino publishes in its own sitemap.
- All 5 `/skills/<slug>` URLs, and the 1 `/workflows/<slug>` URL, likewise.
- Prompt kits, comments, reviews, activity and public profiles use the same pattern.
- Because the pages also emit `noindex, nofollow`, a crawler that comes back is being
  told to drop them, not just failing to read them.

`/discover`, the browse page, is down too: it renders "Failed to load prompts. Please
try again later." and contains zero links to any prompt. So a logged-out visitor can
reach the landing page and the blog, and nothing else.

The sitemap is the part that stings: the app is actively inviting crawlers to 95 URLs
that answer "not found" and ask to be de-indexed.

Measured 2026-08-24 with the script below: **2 of 5 checked pages render their content
to a logged-out visitor**, and the two that pass are the landing page and the blog index.

## Two changes, eight months apart, and only the second one broke it

Reading the policy history on `profiles` in order:

- **2025-12-10** `20251210165240`: `"Public profiles are viewable by everyone" FOR SELECT
  TO public`. Anonymous visitors could read author profiles.
- **2026-01-29** `20260129131015`, then `20260129173152`: that policy is dropped and
  replaced, twice, each time `TO authenticated`. From here on RLS admits no anonymous
  reader. But an RLS mismatch returns **no rows**, not an error, so the embedded author
  simply came back empty and the pages kept working without an author name.
- **2026-08-23** `20260823174224`: `REVOKE SELECT ... FROM anon`. A missing grant is a
  hard `42501`, and PostgREST fails the **whole** query when any embedded table is
  denied. The silent degradation became a dead page.

That is why this looks sudden even though half of it is eight months old.

## The fix, as applied

Minimum to bring the pages back, granting only the three columns the public pages
render, and leaving `role`, `plan_type` and `plan_source` hidden as the August
hardening intended:

```sql
GRANT SELECT (id, display_name, avatar_url) ON public.profiles TO anon;
```

That alone stops the 42501 and the pages render again. The author block stays empty,
because RLS still admits only `authenticated`. If author names and avatars should be
visible to logged-out visitors, which the sitemap implies they should, the January
policy also needs an anonymous twin:

```sql
CREATE POLICY "Anonymous readers can view public content authors"
ON public.profiles
FOR SELECT
TO anon
USING (
  EXISTS (SELECT 1 FROM prompts   WHERE prompts.author_id   = profiles.id AND prompts.is_public = true)
  OR EXISTS (SELECT 1 FROM skills    WHERE skills.author_id    = profiles.id AND skills.published  = true)
  OR EXISTS (SELECT 1 FROM workflows WHERE workflows.author_id = profiles.id AND workflows.published = true)
);
```

The first statement was applied. **The second was not.** Whether author identities are
public is a product decision, and it would reverse something a January migration closed
on purpose ("Restrict profiles table visibility to reduce data harvesting risk"). Say the
word and I will apply it. Until then a logged-out visitor sees the artefact without an
author byline, and the page layout handles that cleanly.

## How to know it worked

```bash
node migration/prodcheck.mjs     # from the repo root; this is the check used above
```

Expect the artefact's real title as the `h1`, and no `robots` meta.
