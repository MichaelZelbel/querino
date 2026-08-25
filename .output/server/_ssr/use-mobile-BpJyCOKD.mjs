import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { Ut as Globe } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { t as LANGUAGES } from "./languages-CEVYo2p3.mjs";
import { t as getFunctionErrorMessage } from "./functionError-BowYYo7v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-mobile-BpJyCOKD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LanguageSelect({ value, onChange, label = "Language", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `space-y-2 ${className || ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4" }), label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
			value: value || "en",
			onValueChange: onChange,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select language" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: LANGUAGES.map((lang) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: lang.code,
				children: lang.label
			}, lang.code)) })]
		})]
	});
}
var EDGE_FUNCTION_BY_TYPE = {
	prompt: "prompt-coach",
	skill: "skill-coach",
	workflow: "workflow-coach",
	prompt_kit: "prompt-kit-coach"
};
/** Key for storing a draft session id in localStorage (new artifact, not yet saved). */
function draftSessionKey(artifactType, workspaceScope, userId) {
	return `prompt_coach_session:new:${artifactType}:${workspaceScope}:${userId}`;
}
/** Key for storing a saved-artifact session id in localStorage. */
function artifactSessionKey(artifactType, workspaceScope, userId, artifactId) {
	return `prompt_coach_session:${artifactType}:${workspaceScope}:${userId}:${artifactId}`;
}
/** Deterministic session id for an existing artifact. */
function deterministicSessionId(workspaceScope, userId, artifactId) {
	return `${workspaceScope}:${userId}:${artifactId}`;
}
/**
* Get or create a draft session id for a new artifact page.
* Persisted in localStorage so it survives refreshes.
*/
function getOrCreateDraftSessionId(workspaceScope, userId, artifactType = "prompt") {
	const key = draftSessionKey(artifactType, workspaceScope, userId);
	const existing = localStorage.getItem(key);
	if (existing) return existing;
	const id = crypto.randomUUID();
	localStorage.setItem(key, id);
	return id;
}
/**
* After a new artifact is created, "promote" the draft session to the final
* deterministic session id and clean up the draft key.
*/
function promoteDraftSession(workspaceScope, userId, newArtifactId, artifactType = "prompt") {
	const draftId = getOrCreateDraftSessionId(workspaceScope, userId, artifactType);
	const finalSessionId = deterministicSessionId(workspaceScope, userId, newArtifactId);
	const finalKey = artifactSessionKey(artifactType, workspaceScope, userId, newArtifactId);
	localStorage.setItem(finalKey, finalSessionId);
	const draftMsgKey = `prompt_coach_messages:${draftId}`;
	const finalMsgKey = `prompt_coach_messages:${finalSessionId}`;
	try {
		const draftMessages = localStorage.getItem(draftMsgKey);
		if (draftMessages) {
			localStorage.setItem(finalMsgKey, draftMessages);
			localStorage.removeItem(draftMsgKey);
		}
	} catch {}
	const draftKey = draftSessionKey(artifactType, workspaceScope, userId);
	localStorage.removeItem(draftKey);
	return finalSessionId;
}
/**
* Provider abstraction for canvas AI.
* Routes to the appropriate Supabase Edge Function based on artifact type.
*/
async function runCanvasAI(args) {
	const { artifactType, artifactId, mode, message, canvasContent, selection, userId, workspaceId, sessionId } = args;
	const edgeFunction = EDGE_FUNCTION_BY_TYPE[artifactType];
	const body = {
		user_id: userId,
		workspace_id: workspaceId ?? null,
		artifact_type: artifactType,
		prompt_id: artifactId === "draft" ? "draft" : artifactId,
		skill_id: artifactId === "draft" ? "draft" : artifactId,
		workflow_id: artifactId === "draft" ? "draft" : artifactId,
		prompt_kit_id: artifactId === "draft" ? "draft" : artifactId,
		mode,
		message,
		canvas_content: canvasContent,
		selection: selection ?? null,
		session_id: sessionId
	};
	const { data, error } = await supabase.functions.invoke(edgeFunction, { body });
	if (error) {
		console.error(`[runCanvasAI:${artifactType}] Edge function error:`, error);
		throw new Error(await getFunctionErrorMessage(error, "AI request failed"));
	}
	if (data?.session?.id) {
		const workspaceScope = workspaceId ?? "personal";
		if (artifactId && artifactId !== "draft") {
			const key = artifactSessionKey(artifactType, workspaceScope, userId, artifactId);
			localStorage.setItem(key, data.session.id);
		}
	}
	const canvas = data?.canvas ?? { updated: false };
	if (mode === "chat_only") canvas.updated = false;
	return {
		assistantMessage: data?.assistantMessage ?? "I processed your request.",
		canvas
	};
}
var MOBILE_BREAKPOINT = 768;
function useIsMobile() {
	const [isMobile, setIsMobile] = import_react.useState(void 0);
	import_react.useEffect(() => {
		const mql = window.matchMedia(`(max-width: 767px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		return () => mql.removeEventListener("change", onChange);
	}, []);
	return !!isMobile;
}
//#endregion
export { runCanvasAI as a, promoteDraftSession as i, deterministicSessionId as n, useIsMobile as o, getOrCreateDraftSessionId as r, LanguageSelect as t };
