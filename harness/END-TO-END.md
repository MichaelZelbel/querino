# Journeys

What a visitor does on Querino today. Each runs against the app started as `harness/RUNTIME.md`
says: the site from the candidate commit on a local port, reading the live project's public data
with the public visitor key. Every journey only reads. Signed-in journeys wait for a staging copy
with its own data (`MISSION.md`, Q1), because signing in here would write to the live project.

Measured on 2026-11-18: the public prompt list had 158 prompts, skills 8, workflows 1, and the
sitemap 178 addresses. Those numbers grow; a journey asserts "at least one", never an exact count.

## A visitor finds a public prompt and can copy it

1. Open `/prompts`.
2. The page heading says "All Public Prompts" and the page lists at least one prompt, each with its
   title, linking to `/prompts/<slug>`.
3. Open the first prompt in the list.
4. Its page shows the prompt's title as the heading, the prompt's full text, and a "Copy Prompt"
   button.

**What would make this fail:** an empty list while the live project has public prompts, a prompt
page without its text, a link that leads to a "not found" page, or a page that only fills in after
JavaScript runs (the first response must already hold the title and text, for search engines).

## A visitor browses skills and workflows

1. Open `/skills`. The heading says "All Public Skills" and at least one skill is listed.
2. Open one. Its page shows the skill's title and its content.
3. Open `/workflows`. The heading says "All Public Workflows" and at least one workflow is listed;
   opening it shows its title and content.

**What would make this fail:** a list that stays empty or loading, or a detail page without the
content a visitor came for.

## A visitor discovers and searches

1. Open `/discover`. The heading says "Discover prompts, skills, workflows and kits".
2. Type a word that appears in public prompt titles (for example "mission") into the search box.
   Results come in after the page's scripts run, so wait for them.
3. Results appear, and the first page holds at least one prompt whose title contains that word.

**What would make this fail:** no results for a word that is in public prompt titles, an error
message instead of results, or results that never stop loading.

## Search engines and the old addresses

1. Open `/sitemap.xml`. It lists full `https://querino.ai/...` addresses, including the prompts
   seen above.
2. Open the home page `/`. The first response holds the title "Querino" and the heading
   "Discover, Create & ..." without running JavaScript.
3. Open `/auth`. The sign-in page shows its form (email and password). Do not sign in.

**What would make this fail:** a sitemap with relative or empty addresses, a home page whose first
response is an empty shell, or a sign-in page that does not show its form.
