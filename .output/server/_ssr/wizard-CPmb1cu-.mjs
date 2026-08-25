import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { At as Info, Bn as ArrowRight, cn as Copy, gt as LoaderCircle, ht as Lock, i as WandSparkles, kn as Check } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { m as usePremiumCheck, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { t as getFunctionErrorMessage } from "./functionError-BowYYo7v.mjs";
import { t as useAICreditsGate } from "./useAICreditsGate-CWqt47PK.mjs";
import { n as premiumFeatures } from "./UpsellModal-CEnDkFkf.mjs";
import { n as formatWizardInputForApi, t as FRAMEWORK_OPTIONS } from "./promptGenerator-DM4ousU3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wizard-CPmb1cu-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var llmOptions = [
	{
		value: "ChatGPT",
		label: "ChatGPT"
	},
	{
		value: "Claude",
		label: "Claude"
	},
	{
		value: "Gemini",
		label: "Gemini"
	},
	{
		value: "other",
		label: "Other"
	}
];
function PromptWizard() {
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuthContext();
	const { isPremium } = usePremiumCheck();
	const { checkCredits, hasCredits, isLoading: creditsLoading, credits } = useAICreditsGate();
	const [goal, setGoal] = (0, import_react.useState)("");
	const [targetLlm, setTargetLlm] = (0, import_react.useState)("");
	const [customLlm, setCustomLlm] = (0, import_react.useState)("");
	const [audience, setAudience] = (0, import_react.useState)("");
	const [toneStyle, setToneStyle] = (0, import_react.useState)("");
	const [inputs, setInputs] = (0, import_react.useState)("");
	const [outputFormat, setOutputFormat] = (0, import_react.useState)("");
	const [constraints, setConstraints] = (0, import_react.useState)("");
	const [additionalNotes, setAdditionalNotes] = (0, import_react.useState)("");
	const [framework, setFramework] = (0, import_react.useState)("auto");
	const [generatedPrompt, setGeneratedPrompt] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [goalError, setGoalError] = (0, import_react.useState)("");
	const [isGenerating, setIsGenerating] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate("/auth?redirect=/prompts/wizard", { replace: true });
	}, [
		user,
		authLoading,
		navigate
	]);
	const selectedFrameworkOption = FRAMEWORK_OPTIONS.find((f) => f.value === framework);
	const handleGenerate = async () => {
		if (!checkCredits()) return;
		if (!goal.trim()) {
			setGoalError("Please describe what you want the LLM to do");
			return;
		}
		setGoalError("");
		const formData = {
			goal: goal.trim(),
			targetLlm: targetLlm || "General LLM",
			customLlm: customLlm.trim(),
			audience: audience.trim(),
			toneStyle: toneStyle.trim(),
			inputs: inputs.trim(),
			outputFormat: outputFormat.trim(),
			constraints: constraints.trim(),
			additionalNotes: additionalNotes.trim(),
			framework
		};
		const structuredInput = formatWizardInputForApi(formData);
		setIsGenerating(true);
		try {
			const { data, error } = await supabase.functions.invoke("prompt-wizard", { body: { structured_input: structuredInput } });
			if (error) throw new Error(await getFunctionErrorMessage(error, "Failed to generate prompt"));
			const promptText = (data?.prompt || "").trim();
			if (!promptText) throw new Error("No prompt in response");
			setGeneratedPrompt(promptText);
			toast.success("Prompt generated!");
		} catch (error) {
			console.error("Wizard error:", error);
			const msg = error?.context?.body?.error || error?.message || "Failed to generate prompt";
			toast.error(msg);
		} finally {
			setIsGenerating(false);
		}
	};
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(generatedPrompt);
			setCopied(true);
			toast.success("Copied to clipboard!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy");
		}
	};
	const handleCreatePrompt = () => {
		navigate(`/prompts/new?draft=${encodeURIComponent(generatedPrompt)}`);
	};
	if (authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user) return null;
	if (!isPremium) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-2xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-6 w-6 text-primary" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-display-md font-bold text-foreground",
									children: "Kickstart Template"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-muted-foreground",
									children: "The Kickstart Template uses AI to craft powerful prompts tailored to your needs. It's part of Querino Premium — contact support to learn more."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-8 space-y-2",
							children: premiumFeatures.map(({ icon: Icon, label, description }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-primary" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-foreground",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: description
								})] })]
							}, label))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "mailto:support@querino.ai",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "gap-2",
									children: "Contact Support"
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/library",
								className: "text-sm text-muted-foreground hover:text-foreground",
								children: "← Back to My Library"
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-2xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "h-6 w-6 text-primary" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-display-md font-bold text-foreground",
									children: "Kickstart Template"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-muted-foreground",
									children: "Answer a few questions and let Querino draft a powerful prompt for you."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border bg-card p-6 space-y-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "goal",
											children: "What do you want the LLM to do? *"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											id: "goal",
											value: goal,
											onChange: (e) => setGoal(e.target.value),
											placeholder: "Summarise long-form articles into bullet-point briefs for busy executives.",
											rows: 3,
											className: goalError ? "border-destructive" : ""
										}),
										goalError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-destructive",
											children: goalError
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "framework",
											children: "Prompt Framework"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: framework,
											onValueChange: (v) => setFramework(v),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a framework" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: FRAMEWORK_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: opt.value,
												children: opt.label
											}, opt.value)) })]
										}),
										selectedFrameworkOption && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-4 w-4 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selectedFrameworkOption.description })]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "targetLlm",
											children: "Which LLM or environment is this for?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: targetLlm,
											onValueChange: setTargetLlm,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select target LLM" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: llmOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: opt.value,
												children: opt.label
											}, opt.value)) })]
										}),
										targetLlm === "other" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: customLlm,
											onChange: (e) => setCustomLlm(e.target.value),
											placeholder: "Enter LLM name",
											className: "mt-2"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "audience",
										children: "Who is this for? (optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "audience",
										value: audience,
										onChange: (e) => setAudience(e.target.value),
										placeholder: "Busy executives with little time, who prefer concise language."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "toneStyle",
										children: "Preferred tone & style (optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "toneStyle",
										value: toneStyle,
										onChange: (e) => setToneStyle(e.target.value),
										placeholder: "Concise, expert, non-fluffy. Avoid buzzwords."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "inputs",
										children: "What kind of input will the model receive? (optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "inputs",
										value: inputs,
										onChange: (e) => setInputs(e.target.value),
										placeholder: "Raw transcripts, long-form blog posts, or meeting notes.",
										rows: 2
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "outputFormat",
										children: "How should the output look? (optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "outputFormat",
										value: outputFormat,
										onChange: (e) => setOutputFormat(e.target.value),
										placeholder: "5 bullet points, max 20 words each, plus one short 'Executive Summary' paragraph.",
										rows: 2
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "constraints",
										children: "Constraints / Rules (optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "constraints",
										value: constraints,
										onChange: (e) => setConstraints(e.target.value),
										placeholder: "Never invent facts. Say 'I don't know' when data is missing.",
										rows: 2
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "additionalNotes",
										children: "Additional examples or notes (optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "additionalNotes",
										value: additionalNotes,
										onChange: (e) => setAdditionalNotes(e.target.value),
										placeholder: "Here is an example of an ideal output: …",
										rows: 3
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleGenerate,
									disabled: isGenerating || !creditsLoading && !hasCredits,
									className: "w-full gap-2",
									children: [isGenerating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "h-4 w-4" }), isGenerating ? "Generating..." : "Generate Prompt"]
								}),
								credits && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-center text-xs text-muted-foreground",
									children: hasCredits ? `~${Math.floor(credits.remainingCredits)} AI credits remaining` : "You're out of AI credits — they reset at the start of your next period."
								})
							]
						}),
						generatedPrompt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 rounded-xl border border-border bg-card p-6 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold text-foreground",
									children: "Generated Prompt"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono text-foreground overflow-x-auto",
									children: generatedPrompt
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										onClick: handleCopy,
										className: "gap-2",
										children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), copied ? "Copied!" : "Copy to clipboard"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: handleCreatePrompt,
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" }), "Next Step"]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/library",
								className: "text-sm text-muted-foreground hover:text-foreground",
								children: "← Back to My Library"
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = PromptWizard;
//#endregion
export { SplitComponent as component };
