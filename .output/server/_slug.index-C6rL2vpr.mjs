import { h as createFileRoute, m as lazyRouteComponent } from "./_libs/@tanstack/react-router+[...].mjs";
import { d as privateHead, l as loadWorkflow, t as creativeWorkJsonLd, u as pageHead } from "./_ssr/route-loaders-BZlMkWnS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.index-C6rL2vpr.js
var $$splitComponentImporter = () => import("./_slug.index-D1yMmSC6.mjs");
var Route = createFileRoute("/workflows/$slug/")({
	loader: ({ params }) => loadWorkflow(params.slug),
	head: ({ loaderData }) => {
		if (!loaderData) return privateHead("Not Found");
		const url = `/workflows/${loaderData.slug ?? loaderData.id}`;
		const description = loaderData.summary || loaderData.description || `${loaderData.title} — AI workflow on Querino`;
		return pageHead({
			title: loaderData.title,
			description,
			canonical: url,
			jsonLd: creativeWorkJsonLd({
				name: loaderData.title,
				description,
				url,
				author: loaderData.author?.display_name ?? null,
				datePublished: loaderData.published_at ?? loaderData.created_at ?? null,
				dateModified: loaderData.updated_at ?? null,
				genre: loaderData.category ?? null,
				inLanguage: loaderData.language ?? null
			})
		});
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
