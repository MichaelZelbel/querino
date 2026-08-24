import { n as supabase } from "./client-Bi_X_zk2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/moderateContent-Dd1HYPU1.js
/**
* Calls the moderate-content edge function to check if content violates community guidelines.
* Only call this when content is going public (publish, edit public, comment).
*/
async function moderateContent(contentFields, action, itemType, itemId) {
	try {
		const cleanFields = {};
		for (const [key, val] of Object.entries(contentFields)) if (val) cleanFields[key] = val;
		const { data, error } = await supabase.functions.invoke("moderate-content", { body: {
			content_fields: cleanFields,
			action,
			item_type: itemType,
			item_id: itemId
		} });
		if (error) {
			console.warn("[Moderation] Edge function error — failing open:", error);
			return { approved: true };
		}
		if (!data || typeof data.approved === "undefined") {
			console.warn("[Moderation] Unexpected response shape — failing open:", data);
			return { approved: true };
		}
		return data;
	} catch (err) {
		console.warn("[Moderation] Network/parse error — failing open:", err);
		return { approved: true };
	}
}
//#endregion
export { moderateContent as t };
