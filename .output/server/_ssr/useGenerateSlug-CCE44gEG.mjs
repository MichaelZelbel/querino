import { n as supabase } from "./client-Bi_X_zk2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useGenerateSlug-CCE44gEG.js
async function generateSlug(title) {
	try {
		const { data, error } = await supabase.functions.invoke("generate-slug", { body: { title } });
		if (error) throw error;
		return data?.slug || "";
	} catch (err) {
		console.error("Error generating slug:", err);
		return title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || `untitled-${crypto.randomUUID().substring(0, 8)}`;
	}
}
//#endregion
export { generateSlug as t };
