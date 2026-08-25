import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Switch } from "./switch-BXNTxolN.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DReQYbEM.mjs";
import { H as RotateCcw, V as Save, X as Play, gt as LoaderCircle, v as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LLMConfigPanel-DmI-LtO-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ALERT_WORDING = {
	retired: "the model it was set to is no longer offered",
	lost_tool_support: "the model it was set to stopped supporting tool calling",
	code_default_retired: "the model in the code was retired, so falling back no longer helps and this needs a code change",
	sync_failed: "the catalogue could not be refreshed, so nothing was changed"
};
/**
* Whether the box still holds the code default, ignoring surrounding whitespace.
*
* The same rule the server enforces on save. Kept in step deliberately: the
* badge would be a lie if the panel called something custom that the server
* then stored as null.
*/
function isStillTheDefault(text, fallback) {
	if (fallback === null) return false;
	return text.trim() === fallback.trim();
}
function LLMConfigPanel() {
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [configs, setConfigs] = (0, import_react.useState)([]);
	const [presets, setPresets] = (0, import_react.useState)([]);
	const [availability, setAvailability] = (0, import_react.useState)({});
	const [alerts, setAlerts] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [filter, setFilter] = (0, import_react.useState)("");
	const load = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase.functions.invoke("admin-llm-config", { body: { action: "list" } });
			if (error) throw error;
			setConfigs(data.configs ?? []);
			setPresets(data.providers ?? []);
			setAvailability(data.availability ?? {});
			setAlerts(data.alerts ?? []);
		} catch (e) {
			toast.error("Failed to load LLM configs", { description: e.message });
		} finally {
			setLoading(false);
		}
	};
	const dismiss = async (id) => {
		try {
			const { error } = await supabase.functions.invoke("admin-llm-config", { body: {
				action: "resolve_alert",
				alert_id: id
			} });
			if (error) throw error;
			setAlerts((a) => a.filter((x) => x.id !== id));
		} catch (e) {
			toast.error("Could not dismiss", { description: e.message });
		}
	};
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	const filtered = (0, import_react.useMemo)(() => configs.filter((c) => c.call_site.toLowerCase().includes(filter.toLowerCase())), [configs, filter]);
	const alertsByCallSite = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const a of alerts) if (a.call_site) map.set(a.call_site, a);
		return map;
	}, [alerts]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "LLM Call Configuration" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
			"Provider, model and system prompt for each AI call site. Edit shows the prompt that would actually be sent, whether that is the one in the code or an override. Saving it unchanged leaves the call site following the code; an inactive entry, or an empty system prompt, does the same. Runtime context is substituted into",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: `{{placeholder}}` }),
			" before the prompt is sent. A change can take up to 30 seconds to reach every call site."
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-2 pt-2",
			children: presets.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
				variant: availability[p.provider] ? "default" : "outline",
				className: "text-xs",
				children: [p.label, availability[p.provider] ? "" : " (no key)"]
			}, p.provider))
		})
	] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			alerts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-sm font-medium text-destructive",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }),
						"The nightly model check found",
						" ",
						alerts.length === 1 ? "something" : `${alerts.length} things`
					]
				}), alerts.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: a.call_site ?? a.model_id ?? a.provider
						}),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: a.detail?.reason ?? ALERT_WORDING[a.kind]
						}),
						a.action_taken && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-muted-foreground italic",
							children: a.action_taken
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						className: "shrink-0",
						onClick: () => void dismiss(a.id),
						children: "Dismiss"
					})]
				}, a.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				placeholder: "Filter by call site…",
				value: filter,
				onChange: (e) => setFilter(e.target.value),
				className: "max-w-sm"
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-md border overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Call site" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Provider" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Model" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "System prompt" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Active" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono text-xs",
						children: c.call_site
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: availability[c.provider] ? "secondary" : "destructive",
						className: "text-[10px]",
						children: presets.find((p) => p.provider === c.provider)?.label ?? c.provider
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono text-xs",
						children: c.model
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-xs text-muted-foreground",
						children: c.system_prompt ? "Custom" : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "italic",
							children: "Code default"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: c.enabled ? "✓" : alertsByCallSite.get(c.call_site) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "destructive",
						className: "text-[10px]",
						children: "auto"
					}) : "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => setEditing(c),
						children: "Edit"
					}) })
				] }, `${c.call_site}:${c.tier}`)) })] })
			}),
			editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditDialog, {
				config: editing,
				presets,
				availability,
				onClose: () => setEditing(null),
				onSaved: async () => {
					setEditing(null);
					await load();
				}
			})
		]
	})] });
}
function EditDialog({ config, presets, availability, onClose, onSaved }) {
	const [draft, setDraft] = (0, import_react.useState)({
		...config,
		system_prompt: config.system_prompt ?? config.default_system_prompt ?? ""
	});
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [testing, setTesting] = (0, import_react.useState)(false);
	const [testPrompt, setTestPrompt] = (0, import_react.useState)("Say 'Hello' and tell me which model and provider you are using.");
	const [testResult, setTestResult] = (0, import_react.useState)(null);
	const models = presets.find((p) => p.provider === draft.provider)?.models ?? [];
	const isCustomModel = !models.some((m) => m.value === draft.model);
	const lacksToolCalling = models.some((m) => m.value === draft.model && m.label.includes("no tool calling"));
	const promptText = draft.system_prompt ?? "";
	const isOverride = promptText.trim().length > 0 && !isStillTheDefault(promptText, config.default_system_prompt);
	const save = async () => {
		setSaving(true);
		try {
			const { data, error } = await supabase.functions.invoke("admin-llm-config", { body: {
				action: "save",
				call_site: draft.call_site,
				tier: draft.tier,
				patch: {
					provider: draft.provider,
					model: draft.model.trim(),
					system_prompt: isOverride ? draft.system_prompt : null,
					temperature: draft.temperature,
					max_tokens: draft.max_tokens,
					enabled: draft.enabled
				}
			} });
			if (error) throw error;
			if (data?.error) throw new Error(data.error);
			toast.success("Saved");
			return true;
		} catch (e) {
			toast.error("Save failed", { description: e.message });
			return false;
		} finally {
			setSaving(false);
		}
	};
	const runTest = async () => {
		setTesting(true);
		setTestResult(null);
		try {
			if (!await save()) return;
			const { data, error } = await supabase.functions.invoke("admin-llm-config", { body: {
				action: "test",
				call_site: draft.call_site,
				tier: draft.tier,
				prompt: testPrompt
			} });
			if (error) throw error;
			setTestResult(data);
		} catch (e) {
			setTestResult({
				ok: false,
				error: e.message
			});
		} finally {
			setTesting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: true,
		onOpenChange: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-base",
					children: draft.call_site
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: config.description })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Provider" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: draft.provider,
								onValueChange: (v) => {
									const next = v;
									const firstModel = presets.find((p) => p.provider === next)?.models[0]?.value;
									setDraft({
										...draft,
										provider: next,
										model: firstModel ?? draft.model
									});
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: presets.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
									value: p.provider,
									disabled: !availability[p.provider],
									children: [p.label, !availability[p.provider] && " — no API key"]
								}, p.provider)) })]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Model" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: isCustomModel ? "__custom__" : draft.model,
									onValueChange: (v) => {
										if (v === "__custom__") return;
										setDraft({
											...draft,
											model: v
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [models.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: m.value,
										children: m.label
									}, m.value)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "__custom__",
										children: "Custom…"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-2 font-mono text-xs",
									value: draft.model,
									onChange: (e) => setDraft({
										...draft,
										model: e.target.value
									}),
									placeholder: "e.g. openai/gpt-4o-mini"
								}),
								lacksToolCalling && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-destructive mt-1",
									children: "This model does not support tool calling. It will not error, it will answer in prose, and the reply will fail to parse."
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "System prompt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: isOverride ? "default" : "secondary",
										className: "text-[10px]",
										children: isOverride ? "Custom" : "Code default"
									})]
								}), isOverride && config.default_system_prompt !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => setDraft({
										...draft,
										system_prompt: config.default_system_prompt ?? ""
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3 w-3 mr-1" }), " Reset to code default"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								rows: 10,
								value: draft.system_prompt ?? "",
								onChange: (e) => setDraft({
									...draft,
									system_prompt: e.target.value
								}),
								placeholder: "Leave empty to use the default in the code.",
								className: "font-mono text-xs"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground mt-1",
								children: isOverride ? "Saved as an override. This call site stops following changes to the prompt in the code." : "This is the prompt in the code. Saved as-is it stays that way, so the call site keeps following changes to it. Edit it to override, or clear the box to go back."
							}),
							draft.placeholders.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-muted-foreground mt-1",
								children: [
									"Available placeholders:",
									" ",
									draft.placeholders.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "mx-0.5",
										children: `{{${p}}}`
									}, p)),
									" ",
									"substituted with runtime context before sending."
								]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Temperature" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									step: "0.1",
									min: "0",
									max: "2",
									value: draft.temperature ?? "",
									onChange: (e) => setDraft({
										...draft,
										temperature: e.target.value === "" ? null : Number(e.target.value)
									}),
									placeholder: "auto"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Max tokens" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: "1",
									value: draft.max_tokens ?? "",
									onChange: (e) => setDraft({
										...draft,
										max_tokens: e.target.value === "" ? null : Number(e.target.value)
									}),
									placeholder: "auto"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end gap-2 pb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: draft.enabled,
										onCheckedChange: (v) => setDraft({
											...draft,
											enabled: v
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Active" })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 rounded-md border p-3 bg-muted/30",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs",
									children: "Test run"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 2,
									value: testPrompt,
									onChange: (e) => setTestPrompt(e.target.value),
									className: "text-xs"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									onClick: runTest,
									disabled: testing || saving,
									children: [testing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 mr-1 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-3 w-3 mr-1" }), "Save & test"]
								}),
								testResult && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs mt-2 space-y-1",
									children: testResult.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-muted-foreground",
										children: [
											testResult.provider,
											" / ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: testResult.model }),
											" ·",
											" ",
											testResult.latency_ms,
											"ms · config:",
											" ",
											testResult.config_source,
											testResult.usage && ` · ${testResult.usage.total_tokens} tokens`
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "whitespace-pre-wrap rounded bg-background p-2 border max-h-48 overflow-auto",
										children: testResult.content
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-destructive",
										children: ["Error: ", testResult.error]
									})
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: onClose,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: async () => {
						if (await save()) onSaved();
					},
					disabled: saving,
					children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 mr-1 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-3 w-3 mr-1" }), "Save"]
				})] })
			]
		})
	});
}
//#endregion
export { LLMConfigPanel as default };
