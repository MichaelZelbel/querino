import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { gt as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as useAuthContext, l as useSearchParams, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-from-menerio-DcO7B1tZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Landing page for Menerio's "New Prompt (Querino)" button.
* Reads query params and redirects to /prompts/new with pre-filled data.
* If not authenticated, redirects to /auth first.
*/
function CreateFromMenerio() {
	const navigate = useNavigate$1();
	const [searchParams] = useSearchParams();
	const { user, loading } = useAuthContext();
	(0, import_react.useEffect)(() => {
		if (loading) return;
		const title = searchParams.get("title") || "";
		const body = searchParams.get("body") || "";
		const menerioNoteId = searchParams.get("menerio_note_id") || "";
		const menerioCallback = searchParams.get("menerio_callback") || "";
		const entityType = searchParams.get("entity_type") || "prompt";
		const promptNewParams = new URLSearchParams();
		if (title) promptNewParams.set("title", title);
		if (body) promptNewParams.set("content", body);
		if (menerioNoteId) promptNewParams.set("menerio_note_id", menerioNoteId);
		if (menerioCallback) promptNewParams.set("menerio_callback", menerioCallback);
		if (entityType) promptNewParams.set("entity_type", entityType);
		const targetUrl = `/prompts/new?${promptNewParams.toString()}`;
		if (!user) {
			const returnUrl = `/create-from-menerio?${searchParams.toString()}`;
			navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
			return;
		}
		navigate(targetUrl, { replace: true });
	}, [
		user,
		loading,
		navigate,
		searchParams
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-screen items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary mx-auto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground text-sm",
				children: "Preparing your prompt…"
			})]
		})
	});
}
var SplitComponent = CreateFromMenerio;
//#endregion
export { SplitComponent as component };
