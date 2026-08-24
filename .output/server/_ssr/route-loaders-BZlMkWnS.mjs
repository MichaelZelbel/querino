import { n as supabase } from "./client-Bi_X_zk2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-loaders-BZlMkWnS.js
/**
* Builds a TanStack Router `head()` payload.
*
* This replaces what SEOHead did from a useEffect. The difference is not cosmetic: a
* useEffect runs only after React has hydrated in a browser, so a crawler that does not
* execute JavaScript saw none of it. Measured before this existed, all 53 routes served
* one title, no canonical link, and no page-specific structured data.
*
* The rules below are copied from SEOHead deliberately, not improved, so the metadata a
* person sees after hydration and the metadata a crawler sees in the HTML are the same
* text. migration/seo-inventory.json is the record of what that text was.
*/
var SITE_NAME = "Querino";
var DEFAULT_DESCRIPTION = "Discover and share AI prompts, skills, and workflows.";
var DEFAULT_OG_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";
var SITE_ORIGIN = "https://querino.ai";
var absolute = (url) => url.startsWith("http") ? url : `${SITE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
function pageHead(page) {
	const fullTitle = page.title.includes(SITE_NAME) ? page.title : `${page.title} | ${SITE_NAME}`;
	const description = page.description || DEFAULT_DESCRIPTION;
	const ogImage = page.ogImage || DEFAULT_OG_IMAGE;
	const canonical = page.canonical ? absolute(page.canonical) : null;
	const meta = [
		{ title: fullTitle },
		{
			name: "description",
			content: description
		},
		{
			property: "og:title",
			content: fullTitle
		},
		{
			property: "og:description",
			content: description
		},
		{
			property: "og:type",
			content: page.ogType ?? "website"
		},
		{
			property: "og:site_name",
			content: SITE_NAME
		},
		{
			property: "og:image",
			content: ogImage
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{
			name: "twitter:title",
			content: fullTitle
		},
		{
			name: "twitter:description",
			content: description
		},
		{
			name: "twitter:image",
			content: ogImage
		}
	];
	if (canonical) meta.push({
		property: "og:url",
		content: canonical
	});
	if (page.noIndex) meta.push({
		name: "robots",
		content: "noindex, nofollow"
	});
	if (page.ogType === "article") {
		if (page.publishedTime) meta.push({
			property: "article:published_time",
			content: page.publishedTime
		});
		if (page.author) meta.push({
			property: "article:author",
			content: page.author
		});
	}
	const links = [];
	if (canonical) links.push({
		rel: "canonical",
		href: canonical
	});
	if (page.rss) links.push({
		rel: "alternate",
		type: "application/rss+xml",
		title: `${SITE_NAME} Blog RSS Feed`,
		href: `${SITE_ORIGIN}/api/rss.xml`
	});
	return {
		meta,
		links,
		scripts: (page.jsonLd ? [page.jsonLd].flat() : []).map((block) => ({
			type: "application/ld+json",
			children: JSON.stringify(block)
		}))
	};
}
/**
* A page that must never be indexed: everything behind sign-in, every editor, every
* admin screen. They still get a real title, because a browser tab and a bookmark are
* worth as much on a private page as on a public one.
*/
function privateHead(title) {
	return pageHead({
		title,
		noIndex: true
	});
}
/** Structured data for one artefact, matching what the detail pages already emitted. */
function creativeWorkJsonLd(input) {
	const block = {
		"@context": "https://schema.org",
		"@type": "CreativeWork",
		name: input.name,
		url: absolute(input.url),
		isAccessibleForFree: true,
		publisher: {
			"@type": "Organization",
			name: SITE_NAME,
			url: SITE_ORIGIN
		}
	};
	block.headline = input.name;
	block.inLanguage = input.inLanguage || "en";
	if (input.genre) block.genre = input.genre;
	if (input.description) block.description = input.description;
	if (input.author) block.author = {
		"@type": "Person",
		name: input.author
	};
	if (input.datePublished) block.datePublished = input.datePublished;
	if (input.dateModified) block.dateModified = input.dateModified;
	return block;
}
/**
* Server-side fetches for the public detail routes.
*
* A TanStack route `loader` runs on the server for the first request and on the client
* for later navigations. That is what puts the artefact into the HTML instead of only
* into the page after hydration, and it is what lets `head()` build a real title from a
* real record.
*
* These use the same anon Supabase client the components use, so they are subject to the
* same row-level security. A logged-out server request sees exactly what a logged-out
* visitor sees, which is the point.
*
* Every loader returns null rather than throwing when the record is missing. The page
* components already render their own "not found" state, and a thrown loader error would
* replace that with the router's error boundary, which is a behaviour change.
*/
var AUTHOR = "profiles:author_id ( id, display_name, avatar_url )";
var isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function loadBySlug(table, slug) {
	if (!slug || isUuid(slug)) return null;
	const { data, error } = await supabase.from(table).select(`*, ${AUTHOR}`).eq("slug", slug).maybeSingle();
	if (error || !data) return null;
	const row = data;
	return {
		...row,
		author: row.profiles ?? null
	};
}
var loadPrompt = (slug) => loadBySlug("prompts", slug);
var loadSkill = (slug) => loadBySlug("skills", slug);
var loadWorkflow = (slug) => loadBySlug("workflows", slug);
var loadPromptKit = (slug) => loadBySlug("prompt_kits", slug);
async function loadBlogPost(slug) {
	if (!slug) return null;
	const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
	if (error || !data) return null;
	return data;
}
/** The public profile page keys off display_name, the way UserProfile does. */
async function loadProfile(username) {
	if (!username) return null;
	const { data, error } = await supabase.from("profiles").select("id, display_name, avatar_url, bio, website, twitter, github").eq("display_name", username).maybeSingle();
	if (error || !data) return null;
	return data;
}
/** Blog taxonomy pages. Both key off slug and both are public. */
async function loadBlogCategory(slug) {
	if (!slug) return null;
	const { data, error } = await supabase.from("blog_categories").select("id, name, slug, description").eq("slug", slug).maybeSingle();
	return error ? null : data;
}
async function loadBlogTag(slug) {
	if (!slug) return null;
	const { data, error } = await supabase.from("blog_tags").select("id, name, slug").eq("slug", slug).maybeSingle();
	return error ? null : data;
}
//#endregion
export { loadProfile as a, loadSkill as c, privateHead as d, loadBlogTag as i, loadWorkflow as l, loadBlogCategory as n, loadPrompt as o, loadBlogPost as r, loadPromptKit as s, creativeWorkJsonLd as t, pageHead as u };
