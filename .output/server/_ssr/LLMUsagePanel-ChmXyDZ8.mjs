import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DReQYbEM.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LLMUsagePanel-ChmXyDZ8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* What each caller bucket is called on screen, and why it is its own bucket.
*
* "Admin" is separate from "Paying" on purpose. The routing layer folds admins
* in with premium, which is right for choosing a model and wrong here: on this
* page an admin is the operator testing his own app, and counting that as paid
* usage would report a thriving paid tier that does not exist.
*/
var CALLER_LABEL = {
	free: "Free",
	premium: "Paying",
	admin: "Admin",
	machine: "Machine"
};
var CALLER_VARIANT = {
	free: "secondary",
	premium: "default",
	admin: "outline",
	machine: "outline"
};
var WINDOWS = [
	{
		value: "7",
		label: "Last 7 days"
	},
	{
		value: "30",
		label: "Last 30 days"
	},
	{
		value: "90",
		label: "Last 90 days"
	},
	{
		value: "0",
		label: "All time"
	}
];
/** The free-call volume per month that would reopen the tiering decision. */
var TIERING_THRESHOLD_CALLS_PER_MONTH = 4e4;
function num(n) {
	return n.toLocaleString();
}
function LLMUsagePanel() {
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [days, setDays] = (0, import_react.useState)("30");
	const [usage, setUsage] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase.functions.invoke("admin-llm-config", { body: {
					action: "usage",
					days: Number(days)
				} });
				if (error) throw error;
				if (!cancelled) setUsage(data);
			} catch (e) {
				if (!cancelled) toast.error("Failed to load AI usage", { description: e.message });
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [days]);
	const headline = (0, import_react.useMemo)(() => {
		if (!usage) return null;
		const free = usage.by_caller.find((c) => c.caller === "free");
		const paying = usage.by_caller.find((c) => c.caller === "premium");
		const total = usage.totals.total_tokens;
		return {
			freeCalls: free?.calls ?? 0,
			freeTokens: free?.total_tokens ?? 0,
			payingCalls: paying?.calls ?? 0,
			share: total === 0 ? 0 : (free?.total_tokens ?? 0) / total * 100
		};
	}, [usage]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "AI usage by call site" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
		"Which call sites actually spend money, and who spends it. Per-tier configuration (cheaper models for free users) was decided against on 23 August 2026, because free callers had cost half a cent in seven months. This is the view that would reverse that decision: roughly",
		" ",
		num(TIERING_THRESHOLD_CALLS_PER_MONTH),
		" free calls a month, or the arrival of real paying users. Cost is shown in tokens and credits rather than currency, because no price list is stored and a hardcoded one goes stale. A row marked ",
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "not configured" }),
		" spent tokens under a name the table above does not carry: either the name the earlier logging used for the same work (counted separately, because the old and new names cannot be matched up reliably), or a feature such as embeddings that does not go through a configurable call site at all."
	] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
			value: days,
			onValueChange: setDays,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
				className: "w-[180px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: WINDOWS.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: w.value,
				children: w.label
			}, w.value)) })]
		}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full" }) : !usage ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-md border bg-muted/40 p-4 text-sm",
			children: [headline && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
					"Free callers: ",
					num(headline.freeCalls),
					" calls"
				] }),
				" ",
				"(",
				num(headline.freeTokens),
				" tokens,",
				" ",
				headline.share.toFixed(1),
				"% of everything the app spent in this window). Paying callers: ",
				num(headline.payingCalls),
				" ",
				"calls."
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-muted-foreground",
				children: [
					num(usage.totals.calls),
					" calls in total,",
					" ",
					num(usage.totals.total_tokens),
					" tokens (",
					num(usage.totals.prompt_tokens),
					" in,",
					" ",
					num(usage.totals.completion_tokens),
					" out),",
					" ",
					usage.totals.credits.toFixed(2),
					" credits."
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-md border overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Call site" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Calls"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Tokens"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Who called it" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Which row served it" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: usage.call_sites.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
				className: c.calls === 0 ? "opacity-50" : void 0,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						className: "font-mono text-xs",
						children: [c.call_site, !c.is_configured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "ml-2 text-[10px] font-sans",
							children: "not configured"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right text-xs",
						children: num(c.calls)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-right text-xs",
						children: num(c.total_tokens)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: c.by_caller.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs italic text-muted-foreground",
						children: "Never called"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: c.by_caller.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: CALLER_VARIANT[b.caller],
							className: "text-[10px]",
							children: [
								CALLER_LABEL[b.caller],
								" ",
								num(b.calls)
							]
						}, b.caller))
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: c.by_source.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "not used yet"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: c.by_source.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "text-[10px]",
							children: [
								s.source,
								" ",
								num(s.calls)
							]
						}, s.source))
					}) })
				]
			}, c.call_site)) })] })
		})] })]
	})] });
}
//#endregion
export { LLMUsagePanel as default };
