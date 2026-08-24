# What each route puts in <head> today

Captured from the running production build, not read off SEOHead's props, because
SEOHead writes all of this from a useEffect and renders null. A crawler that does not
execute JavaScript sees none of it. That is the whole reason for the migration, and
this file is the list of what has to survive it.

Routes captured: 53. With their own title: 53.
With a canonical URL: 15. With structured data: 53.

After the migration, re-run this spec and diff seo-inventory.json. Every field below
must come back, and the canonical URLs must no longer depend on which host served
the page.

## `*`

- captured at: `/this-route-does-not-exist`
- title: `Page Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: `http://localhost:4173/this-route-does-not-exist`
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/`

- captured at: `/`
- title: `Querino - AI Prompt Library for Creators`
- description: `Thousands of curated prompts, your personal library, and a tiny mascot who genuinely cares whether your prompts are good.`
- canonical: `https://querino.ai/`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/__tokens`

- captured at: `/__tokens`
- title: `Page Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: `http://localhost:4173/__tokens`
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/activity`

- captured at: `/activity`
- title: `Activity | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/admin`

- captured at: `/admin`
- title: `Querino - AI Prompt Library for Creators`
- description: `Thousands of curated prompts, your personal library, and a tiny mascot who genuinely cares whether your prompts are good.`
- canonical: `https://querino.ai/`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/auth`

- captured at: `/auth`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog`

- captured at: `/blog`
- title: `Blog | Querino`
- description: `Explore articles about AI prompts, workflows, and productivity tips.`
- canonical: `https://querino.ai/blog`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/blog`
- twitter card: `summary_large_image`
- rss link: `https://querino.ai/api/rss.xml`
- structured data: `Organization`, `WebSite`

## `/blog/:slug`

- captured at: `/blog/baseline-no-published-post`
- title: `Post Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin`

- captured at: `/blog/admin`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/categories`

- captured at: `/blog/admin/categories`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/media`

- captured at: `/blog/admin/media`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/posts`

- captured at: `/blog/admin/posts`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/posts/:id/edit`

- captured at: `/blog/admin/posts/00000000-0000-0000-0000-000000000000/edit`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/posts/new`

- captured at: `/blog/admin/posts/new`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/tags`

- captured at: `/blog/admin/tags`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/category/:slug`

- captured at: `/blog/category/baseline-no-category`
- title: `Category Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/tag/:slug`

- captured at: `/blog/tag/baseline-no-tag`
- title: `Tag Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections`

- captured at: `/collections`
- title: `Collections | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections/:id`

- captured at: `/collections/00000000-0000-0000-0000-000000000000`
- title: `Collection | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections/:id/edit`

- captured at: `/collections/00000000-0000-0000-0000-000000000000/edit`
- title: `Collections | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections/new`

- captured at: `/collections/new`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/community-guidelines`

- captured at: `/community-guidelines`
- title: `Community Guidelines — Querino`
- description: `Querino's community guidelines for publishing AI artifacts. Learn what content is allowed and how we keep the platform safe.`
- canonical: `https://querino.ai/community-guidelines`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/community-guidelines`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/cookies`

- captured at: `/cookies`
- title: `Cookies Policy | Querino`
- description: `Which cookies Querino sets, what they are for, and how to control them.`
- canonical: `https://querino.ai/cookies`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/cookies`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/create-from-menerio`

- captured at: `/create-from-menerio`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/dashboard`

- captured at: `/dashboard`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/discover`

- captured at: `/discover`
- title: `Discover AI Prompts, Skills and Workflows | Querino`
- description: `Browse curated AI prompts, prompt kits, skills and workflows shared by the Querino community.`
- canonical: `https://querino.ai/discover`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/discover`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/docs`

- captured at: `/docs`
- title: `Documentation — Querino`
- description: `Learn how to create, organize, and share AI prompts, prompt kits, skills, and workflows with Querino.`
- canonical: `https://querino.ai/docs`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/docs`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/impressum`

- captured at: `/impressum`
- title: `Impressum | Querino`
- description: `Legal notice and company information for Querino, operated by Zelbel Ltd.`
- canonical: `https://querino.ai/impressum`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/impressum`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/library`

- captured at: `/library`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/library/:slug/edit`

- captured at: `/library/conduct-a-project-premortem-and-plan-revision/edit`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/library/:slug/versions`

- captured at: `/library/conduct-a-project-premortem-and-plan-revision/versions`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/privacy`

- captured at: `/privacy`
- title: `Privacy Policy | Querino`
- description: `How Querino collects, uses and protects your data.`
- canonical: `https://querino.ai/privacy`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/privacy`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/profile/edit`

- captured at: `/profile/edit`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompt-kits/:slug`

- captured at: `/prompt-kits/baseline-no-public-kit`
- title: `Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompt-kits/:slug/edit`

- captured at: `/prompt-kits/baseline-no-public-kit/edit`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompt-kits/new`

- captured at: `/prompt-kits/new`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompts/:slug`

- captured at: `/prompts/conduct-a-project-premortem-and-plan-revision`
- title: `Conduct a Project Premortem and Plan Revision | Querino`
- description: `Perform a project premortem by identifying top failure modes and generating a revised, risk-mitigated version of a provided plan.`
- canonical: `https://querino.ai/prompts/conduct-a-project-premortem-and-plan-revision`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/prompts/conduct-a-project-premortem-and-plan-revision`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`, `CreativeWork`

## `/prompts/:slug/edit`

- captured at: `/prompts/conduct-a-project-premortem-and-plan-revision/edit`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompts/new`

- captured at: `/prompts/new`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompts/wizard`

- captured at: `/prompts/wizard`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/settings`

- captured at: `/settings`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/skills/:slug`

- captured at: `/skills/anti-hallucination-reasoning-protocol`
- title: `Anti-Hallucination Reasoning Protocol | Querino`
- description: `Guides AI to maximize factual accuracy and minimize hallucination through strict rules.`
- canonical: `https://querino.ai/skills/anti-hallucination-reasoning-protocol`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/skills/anti-hallucination-reasoning-protocol`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`, `CreativeWork`

## `/skills/:slug/edit`

- captured at: `/skills/anti-hallucination-reasoning-protocol/edit`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/skills/new`

- captured at: `/skills/new`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/team/:id/activity`

- captured at: `/team/00000000-0000-0000-0000-000000000000/activity`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/team/:id/settings`

- captured at: `/team/00000000-0000-0000-0000-000000000000/settings`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/team/join`

- captured at: `/team/join`
- title: `Join Team | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/terms`

- captured at: `/terms`
- title: `Terms of Service | Querino`
- description: `The terms that govern your use of Querino.`
- canonical: `https://querino.ai/terms`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/terms`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/u/:username`

- captured at: `/u/baseline-no-public-profile`
- title: `Profile Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/u/:username/activity`

- captured at: `/u/baseline-no-public-profile/activity`
- title: `Activity | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/workflows/:slug`

- captured at: `/workflows/create-validation-workflow`
- title: `Create Validation Workflow | Querino`
- description: `Generates a comprehensive validation workflow for analyzing codebases and ensuring production readiness.`
- canonical: `https://querino.ai/workflows/create-validation-workflow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `https://querino.ai/workflows/create-validation-workflow`
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`, `CreativeWork`

## `/workflows/:slug/edit`

- captured at: `/workflows/create-validation-workflow/edit`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/workflows/new`

- captured at: `/workflows/new`
- title: `Sign In | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: (none)
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`
