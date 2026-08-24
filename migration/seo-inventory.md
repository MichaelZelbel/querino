# What each route puts in <head> today

Captured from the running production build, not read off SEOHead's props, because
SEOHead writes all of this from a useEffect and renders null. A crawler that does not
execute JavaScript sees none of it. That is the whole reason for the migration, and
this file is the list of what has to survive it.

Routes captured: 53. With their own title: 53.
With a canonical URL: 9. With structured data: 53.

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
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/__tokens`

- captured at: `/__tokens`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/activity`

- captured at: `/activity`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/admin`

- captured at: `/admin`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/auth`

- captured at: `/auth`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog`

- captured at: `/blog`
- title: `Blog | Querino`
- description: `Explore articles about AI prompts, workflows, and productivity tips.`
- canonical: `http://localhost:4173/blog`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url `http://localhost:4173/blog`
- twitter card: `summary`
- rss link: `http://localhost:4173/api/rss.xml`
- structured data: `Organization`, `WebSite`

## `/blog/:slug`

- captured at: `/blog/baseline-no-published-post`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin`

- captured at: `/blog/admin`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/categories`

- captured at: `/blog/admin/categories`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/media`

- captured at: `/blog/admin/media`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/posts`

- captured at: `/blog/admin/posts`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/posts/:id/edit`

- captured at: `/blog/admin/posts/00000000-0000-0000-0000-000000000000/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/posts/new`

- captured at: `/blog/admin/posts/new`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/admin/tags`

- captured at: `/blog/admin/tags`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/category/:slug`

- captured at: `/blog/category/baseline-no-category`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/blog/tag/:slug`

- captured at: `/blog/tag/baseline-no-tag`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections`

- captured at: `/collections`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections/:id`

- captured at: `/collections/00000000-0000-0000-0000-000000000000`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections/:id/edit`

- captured at: `/collections/00000000-0000-0000-0000-000000000000/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/collections/new`

- captured at: `/collections/new`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/community-guidelines`

- captured at: `/community-guidelines`
- title: `Community Guidelines — Querino`
- description: `Querino's community guidelines for publishing AI artifacts. Learn what content is allowed and how we keep the platform safe.`
- canonical: `http://localhost:4173/community-guidelines`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/cookies`

- captured at: `/cookies`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/create-from-menerio`

- captured at: `/create-from-menerio`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/dashboard`

- captured at: `/dashboard`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/discover`

- captured at: `/discover`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/docs`

- captured at: `/docs`
- title: `Documentation — Querino`
- description: `Learn how to create, organize, and share AI prompts, prompt kits, skills, and workflows with Querino.`
- canonical: `http://localhost:4173/docs`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/impressum`

- captured at: `/impressum`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/library`

- captured at: `/library`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/library/:slug/edit`

- captured at: `/library/conduct-a-project-premortem-and-plan-revision/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/library/:slug/versions`

- captured at: `/library/conduct-a-project-premortem-and-plan-revision/versions`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/privacy`

- captured at: `/privacy`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/profile/edit`

- captured at: `/profile/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompt-kits/:slug`

- captured at: `/prompt-kits/baseline-no-public-kit`
- title: `Prompt Kit Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: `http://localhost:4173/prompt-kits/baseline-no-public-kit`
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/prompt-kits/:slug/edit`

- captured at: `/prompt-kits/baseline-no-public-kit/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompt-kits/new`

- captured at: `/prompt-kits/new`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompts/:slug`

- captured at: `/prompts/conduct-a-project-premortem-and-plan-revision`
- title: `Prompt Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: `http://localhost:4173/prompts/conduct-a-project-premortem-and-plan-revision`
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/prompts/:slug/edit`

- captured at: `/prompts/conduct-a-project-premortem-and-plan-revision/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompts/new`

- captured at: `/prompts/new`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/prompts/wizard`

- captured at: `/prompts/wizard`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/settings`

- captured at: `/settings`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/skills/:slug`

- captured at: `/skills/anti-hallucination-reasoning-protocol`
- title: `Skill Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: `http://localhost:4173/skills/anti-hallucination-reasoning-protocol`
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/skills/:slug/edit`

- captured at: `/skills/anti-hallucination-reasoning-protocol/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/skills/new`

- captured at: `/skills/new`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/team/:id/activity`

- captured at: `/team/00000000-0000-0000-0000-000000000000/activity`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/team/:id/settings`

- captured at: `/team/00000000-0000-0000-0000-000000000000/settings`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/team/join`

- captured at: `/team/join`
- title: `Join Team | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: `http://localhost:4173/team/join`
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/terms`

- captured at: `/terms`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/u/:username`

- captured at: `/u/baseline-no-public-profile`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/u/:username/activity`

- captured at: `/u/baseline-no-public-profile/activity`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/workflows/:slug`

- captured at: `/workflows/create-validation-workflow`
- title: `Workflow Not Found | Querino`
- description: `Discover and share AI prompts, skills, and workflows.`
- canonical: `http://localhost:4173/workflows/create-validation-workflow`
- robots: `noindex, nofollow`
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary`
- structured data: `Organization`, `WebSite`

## `/workflows/:slug/edit`

- captured at: `/workflows/create-validation-workflow/edit`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`

## `/workflows/new`

- captured at: `/workflows/new`
- title: `Querino - AI Prompt Library for Creators`
- description: `Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools.`
- canonical: (none)
- og: type `website`, image `https://lovable.dev/opengraph-image-p98pqg.png`, url (none)
- twitter card: `summary_large_image`
- structured data: `Organization`, `WebSite`
