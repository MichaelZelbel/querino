# Google Search Console: "Soft 404" + "Excluded by 'noindex' tag"

## Verdict: mostly intentional, one real gap

Both new reasons are direct, expected consequences of the SEO fixes we shipped after the last GSC complaint.

**"Excluded by 'noindex' tag" — intentional, keep it.**
We deliberately added `noIndex` to:
- `NotFound.tsx` (404 route)
- the "not found" branches of `PromptDetail`, `SkillDetail`, `WorkflowDetail`, `PromptKitDetail`
- `TeamJoin` (private invite route)
- the `mcp.querino.ai` landing page

Google is reporting that it obeyed those tags. That is the desired outcome, not an error. Nothing to fix.

**"Soft 404" — partly intentional, partly a real limitation.**
Querino is a client-rendered SPA: every URL returns HTTP 200 with an empty shell, and the content (and the `noindex` tag) is only injected by JavaScript afterwards. So:
- Deleted / unpublished / renamed artifacts still answer 200 → Google calls them Soft 404. Correct behaviour on Google's side, unavoidable on the current stack.
- Thin or JS-dependent pages (e.g. `/discover` filter URLs, empty tag pages) can also be classified Soft 404 because the first HTML response has no content.

The homepage itself is healthy: GSC's stored inspection says "Submitted and indexed", canonical `https://querino.ai`, crawl successful, 995 impressions in the last 28 days.

## Answering your two questions

### 1. Fix on the current stack?
Possible, but only partially:
- Confirm which exact URLs GSC lists under Soft 404 (export from the report) — most are likely old artifact slugs that no longer exist. Those can simply be left as-is; Google drops them.
- Add a `410 Gone` / real `404` response for deleted artifact slugs by serving artifact detail routes through the existing `api` edge function or a Cloudflare Worker (we already proxy `sitemap.xml` that way). This is the only way to send a real status code without SSR.
- Make sure the sitemap never lists slugs that 404 (it already only queries public rows, so this should be clean — worth re-verifying).
- Keep the `noindex` tags exactly as they are.

Effort: small-to-medium. Result: Soft 404 count shrinks, but JS-rendered content stays a structural weakness.

### 2. Upgrade to the new stack?
The new stack (server-rendered React Router framework) would fix the root cause, not the symptom:
- Real HTTP status codes: 404/410 for missing artifacts, no more Soft 404 at all.
- Server-rendered `<title>`, description, canonical and JSON-LD per route — no reliance on `SEOHead` mutating the DOM after hydration.
- Better crawl budget and faster indexing for the artifact catalogue, which is Querino's main organic surface.

Effort: large (full migration of ~40 pages, edge functions stay as-is). Worth it if organic discovery of prompts/skills/workflows is a growth priority — currently 11 clicks / 995 impressions per 28 days, so there is real upside.

**Recommendation:** do not treat this GSC email as an incident. The `noindex` half is working as designed. For Soft 404, first export the affected URL list and confirm they are dead artifact slugs; if they are, no fix is needed. Plan the stack upgrade as a separate, deliberate SEO project rather than as a reaction to this email.

## What I need from you
- Export the Soft 404 URL list from Search Console (Indexing → Pages → Soft 404 → Export) and paste a sample, so I can confirm whether they are dead artifact slugs or live pages being misjudged.
- Tell me whether organic search is a priority for Querino in the next quarter — that decides whether the stack upgrade is worth scheduling.
