//#region node_modules/.nitro/vite/services/ssr/assets/site-jKTsxe7R.js
var CONFIGURED_ORIGIN = "https://querino.ai";
function siteOrigin() {
	if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
	return CONFIGURED_ORIGIN;
}
//#endregion
export { siteOrigin as t };
