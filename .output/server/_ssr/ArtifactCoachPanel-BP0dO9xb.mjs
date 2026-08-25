import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { Nn as Bot, P as Sparkles, gt as LoaderCircle, lt as MessageSquare, m as Undo2, s as User, z as Send } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as ScrollArea } from "./scroll-area-D0AShDWm.mjs";
import { a as runCanvasAI } from "./use-mobile-BpJyCOKD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ArtifactCoachPanel-BP0dO9xb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COACH_CONFIG = {
	prompt: {
		label: "Prompt Coach",
		helperText: "This AI sees your current prompt content.",
		placeholder: "Ask the Prompt Coach...",
		quickActions: [
			{
				label: "Make clearer",
				message: "Make this prompt clearer and more specific."
			},
			{
				label: "Make stricter",
				message: "Make this prompt stricter with fewer ambiguities."
			},
			{
				label: "Add output format",
				message: "Add a clear output format specification to this prompt."
			},
			{
				label: "Shorten",
				message: "Shorten this prompt while preserving its intent."
			},
			{
				label: "Add examples",
				message: "Add concrete examples to illustrate the expected behavior."
			}
		]
	},
	skill: {
		label: "Skill Coach",
		helperText: "This AI sees your current skill content and helps you write better LLM frameworks.",
		placeholder: "Ask the Skill Coach...",
		quickActions: [
			{
				label: "Improve structure",
				message: "Improve the structure and clarity of this skill."
			},
			{
				label: "Add role definition",
				message: "Add or improve the role definition at the top of this skill."
			},
			{
				label: "Add examples",
				message: "Add concrete examples to illustrate the expected behavior."
			},
			{
				label: "Make reusable",
				message: "Make this skill more reusable and generic so it can be applied across tasks."
			},
			{
				label: "Add output format",
				message: "Add a clear output format specification to this skill."
			}
		]
	},
	workflow: {
		label: "Workflow Coach",
		helperText: "This AI sees your current workflow content and helps you design better n8n automations.",
		placeholder: "Ask the Workflow Coach...",
		quickActions: [
			{
				label: "Clarify steps",
				message: "Clarify each step in this workflow to make it easier to implement."
			},
			{
				label: "Add error handling",
				message: "Add error handling and edge case considerations to this workflow."
			},
			{
				label: "Improve structure",
				message: "Improve the overall structure and organization of this workflow description."
			},
			{
				label: "Add trigger details",
				message: "Add more detail about how this workflow is triggered."
			},
			{
				label: "Summarize",
				message: "Add a clear summary at the top describing what this workflow does."
			}
		]
	},
	prompt_kit: {
		label: "Prompt Kit Coach",
		helperText: "This AI sees the entire kit and helps you add, refine, and structure the prompts inside it.",
		placeholder: "Ask the Prompt Kit Coach...",
		quickActions: [
			{
				label: "Suggest missing prompts",
				message: "Suggest prompts that are missing from this kit to make it more complete."
			},
			{
				label: "Add a new prompt",
				message: "Add a new '## Prompt: <Title>' section that complements the existing prompts."
			},
			{
				label: "Improve consistency",
				message: "Improve naming and style consistency across the prompts in this kit."
			},
			{
				label: "Tighten prompts",
				message: "Make each prompt in the kit clearer and less ambiguous, preserving structure."
			},
			{
				label: "Add output formats",
				message: "Add or unify clear output format specifications across the prompts in this kit."
			}
		]
	}
};
function ArtifactCoachPanel({ artifactType, artifactId, canvasContent, onApplyContent, onUndo, canUndo, isNew = false, userId, workspaceId, sessionId }) {
	const config = COACH_CONFIG[artifactType];
	const storageKey = `prompt_coach_messages:${sessionId}`;
	const [messages, setMessages] = (0, import_react.useState)(() => {
		try {
			const stored = typeof window === "undefined" ? null : localStorage.getItem(storageKey);
			if (stored) return JSON.parse(stored);
		} catch {}
		if (isNew) return [{
			role: "assistant",
			content: {
				prompt: "What do you want this prompt to do?",
				skill: "What kind of skill or LLM framework do you want to create?",
				workflow: "What workflow do you want to design? Tell me about your automation goal.",
				prompt_kit: "What use case should this prompt kit cover? I can help you draft and structure the prompts inside it."
			}[artifactType]
		}];
		return [];
	});
	const [input, setInput] = (0, import_react.useState)("");
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [mode, setMode] = (0, import_react.useState)("collab_edit");
	const scrollRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		try {
			localStorage.setItem(storageKey, JSON.stringify(messages));
		} catch {}
	}, [messages, storageKey]);
	(0, import_react.useEffect)(() => {
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (parsed.length > 0) setMessages(parsed);
			}
		} catch {}
	}, [storageKey]);
	(0, import_react.useEffect)(() => {
		if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [messages]);
	const handleSend = async (overrideMessage) => {
		const msg = overrideMessage || input.trim();
		if (!msg || isLoading) return;
		const userMsg = {
			role: "user",
			content: msg
		};
		setMessages((prev) => [...prev, userMsg]);
		if (!overrideMessage) setInput("");
		setIsLoading(true);
		try {
			const result = await runCanvasAI({
				artifactType,
				artifactId,
				mode: overrideMessage ? "collab_edit" : mode,
				message: msg,
				canvasContent,
				userId,
				workspaceId,
				sessionId
			});
			const assistantMsg = {
				role: "assistant",
				content: result.assistantMessage
			};
			setMessages((prev) => [...prev, assistantMsg]);
			if (result.canvas?.updated && result.canvas.content) {
				onApplyContent(result.canvas.content, result.canvas.changeNote);
				toast(`AI updated the ${artifactType}`, {
					description: result.canvas.changeNote || "Content was modified",
					action: canUndo ? void 0 : {
						label: "Undo",
						onClick: onUndo
					}
				});
			}
		} catch (err) {
			console.error(`[${config.label}] Error:`, err);
			const errorMessage = err instanceof Error ? err.message : "AI request failed";
			toast.error(errorMessage);
			setMessages((prev) => [...prev, {
				role: "assistant",
				content: `Error: ${errorMessage}`
			}]);
		} finally {
			setIsLoading(false);
		}
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col rounded-xl border border-border bg-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-foreground",
						children: config.label
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: mode === "collab_edit" ? "default" : "ghost",
							size: "sm",
							className: "h-7 gap-1 text-xs",
							onClick: () => setMode("collab_edit"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3 w-3" }), "Edit"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: mode === "chat_only" ? "default" : "ghost",
							size: "sm",
							className: "h-7 gap-1 text-xs",
							onClick: () => setMode("chat_only"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-3 w-3" }), "Chat"]
						}),
						canUndo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							className: "h-7 gap-1 text-xs",
							onClick: onUndo,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "h-3 w-3" }), "Undo"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 py-2 text-xs text-muted-foreground border-b border-border",
				children: config.helperText
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "flex-1 min-h-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: scrollRef,
					className: "space-y-3 p-4",
					children: [
						messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center justify-center py-8 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-10 w-10 text-muted-foreground/40 mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [
									"Ask me to improve your ",
									artifactType,
									", or use the quick actions below."
								]
							})]
						}),
						messages.map((msg, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`,
							children: [
								msg.role === "assistant" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-3.5 w-3.5 text-primary" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "whitespace-pre-wrap",
										children: msg.content
									})
								}),
								msg.role === "user" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-3.5 w-3.5 text-muted-foreground" })
								})
							]
						}, i)),
						isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-3.5 w-3.5 text-primary" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-lg bg-secondary px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" })
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5 border-t border-border px-4 py-2",
				children: config.quickActions.map((action) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					className: "cursor-pointer hover:bg-secondary transition-colors text-xs",
					onClick: () => !isLoading && handleSend(action.message),
					children: action.label
				}, action.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-border p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: input,
						onChange: (e) => setInput(e.target.value),
						onKeyDown: handleKeyDown,
						placeholder: config.placeholder,
						rows: 2,
						className: "min-h-[60px] resize-none text-sm",
						disabled: isLoading
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => handleSend(),
						disabled: !input.trim() || isLoading,
						size: "icon",
						className: "h-[60px] w-10 shrink-0",
						"aria-label": "Send message",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
					})]
				})
			})
		]
	});
}
//#endregion
export { ArtifactCoachPanel as t };
