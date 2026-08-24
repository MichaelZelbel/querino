import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Switch } from "./switch-BXNTxolN.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { Nn as Bot, P as Sparkles, V as Save, Vn as ArrowLeft, gt as LoaderCircle, n as X, vt as ListTree } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, l as useSearchParams, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { n as categoryOptions } from "./prompt-C3zowaN0.mjs";
import { a as SheetTrigger, i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-CmQHWRHQ.mjs";
import { i as promoteDraftSession, o as useIsMobile, r as getOrCreateDraftSessionId, t as LanguageSelect } from "./use-mobile-BpJyCOKD.mjs";
import { t as ArtifactCoachPanel } from "./ArtifactCoachPanel-BP0dO9xb.mjs";
import { t as useAICreditsGate } from "./useAICreditsGate-CWqt47PK.mjs";
import { r as parsePromptKitItems } from "./promptKitParser-zZSbXXfv.mjs";
import { t as generateSlug } from "./useGenerateSlug-CCE44gEG.mjs";
import { t as PromptKitRichEditor } from "./PromptKitRichEditor-9hiI-Ltw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-CvTg392t.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_TEMPLATE = `# My Prompt Kit

A short intro explaining what this kit is for and how to use it.

## How to use this kit

Walk readers through when to run each prompt and what to expect.

## Prompt: My first prompt

Write your prompt here…
`;
function PromptKitNew() {
	const navigate = useNavigate$1();
	const [searchParams] = useSearchParams();
	const { user, loading: authLoading } = useAuthContext();
	const { currentWorkspace } = useWorkspace();
	const isMobile = useIsMobile();
	const { checkCredits } = useAICreditsGate();
	(0, import_react.useRef)(null);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [showCoachSheet, setShowCoachSheet] = (0, import_react.useState)(false);
	const [content, setContent] = (0, import_react.useState)(searchParams.get("content") || DEFAULT_TEMPLATE);
	const [title, setTitle] = (0, import_react.useState)(searchParams.get("title") || "");
	const [description, setDescription] = (0, import_react.useState)(searchParams.get("description") || "");
	const [category, setCategory] = (0, import_react.useState)(searchParams.get("category") || "");
	const [tagInput, setTagInput] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)(searchParams.get("tags")?.split(",").filter(Boolean) || []);
	const [isPublic, setIsPublic] = (0, import_react.useState)(false);
	const [language, setLanguage] = (0, import_react.useState)(searchParams.get("language") || "en");
	const [errors, setErrors] = (0, import_react.useState)({});
	const [previousContent, setPreviousContent] = (0, import_react.useState)(null);
	const [isGeneratingMetadata, setIsGeneratingMetadata] = (0, import_react.useState)(false);
	const [metadataError, setMetadataError] = (0, import_react.useState)(null);
	const workspaceScope = currentWorkspace ?? "personal";
	const coachSessionId = user ? getOrCreateDraftSessionId(workspaceScope, user.id, "prompt_kit") : "draft";
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate("/auth?redirect=/prompt-kits/new", { replace: true });
	}, [
		user,
		authLoading,
		navigate
	]);
	const items = parsePromptKitItems(content);
	const normalizeTag = (tag) => tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
	const handleAddTag = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const normalized = normalizeTag(tagInput);
			if (normalized && !tags.includes(normalized)) setTags([...tags, normalized]);
			setTagInput("");
		}
	};
	const handleRemoveTag = (t) => setTags(tags.filter((x) => x !== t));
	const handleApplyAIContent = (newContent) => {
		setPreviousContent(content);
		setContent(newContent);
	};
	const handleUndoAI = () => {
		if (previousContent !== null) {
			setContent(previousContent);
			setPreviousContent(null);
			toast.success("Reverted last AI change");
		}
	};
	const handleSuggestMetadata = async () => {
		if (!checkCredits()) return;
		if (!content.trim()) {
			setMetadataError("Please add some kit content first.");
			return;
		}
		setIsGeneratingMetadata(true);
		setMetadataError(null);
		try {
			const { data: result, error } = await supabase.functions.invoke("suggest-promptkit-metadata", { body: {
				kit_content: content.trim(),
				user_id: user?.id
			} });
			if (error) throw new Error("Failed to generate suggestions");
			const data = result?.output || result;
			if (data?.title) setTitle(data.title);
			if (data?.description) setDescription(data.description);
			if (data?.category) {
				const matched = categoryOptions.find((c) => c.id.toLowerCase() === String(data.category).toLowerCase());
				if (matched) setCategory(matched.id);
			}
			if (data?.tags && Array.isArray(data.tags)) {
				const newTags = data.tags.map((t) => normalizeTag(t)).filter(Boolean).slice(0, 10);
				setTags(newTags);
			}
		} catch {
			setMetadataError("Could not generate suggestions. Please try again.");
		} finally {
			setIsGeneratingMetadata(false);
		}
	};
	const validate = () => {
		const e = {};
		if (!content.trim()) e.content = "Content is required";
		if (!title.trim()) e.title = "Title is required";
		if (!category) e.category = "Please select a category";
		setErrors(e);
		return Object.keys(e).length === 0;
	};
	const handleSubmit = async () => {
		if (!user || !validate()) return;
		setIsSubmitting(true);
		try {
			const slug = await generateSlug(title.trim());
			const { data: newKit, error } = await supabase.from("prompt_kits").insert({
				title: title.trim(),
				description: description.trim() || null,
				content: content.trim(),
				category,
				tags: tags.length > 0 ? tags : null,
				author_id: user.id,
				team_id: currentWorkspace !== "personal" ? currentWorkspace : null,
				published: isPublic,
				language,
				slug
			}).select("id, slug").single();
			if (error) {
				console.error(error);
				toast.error("Failed to create prompt kit");
				return;
			}
			toast.success("Prompt Kit created!");
			try {
				if (user) promoteDraftSession(workspaceScope, user.id, newKit.id, "prompt_kit");
			} catch {}
			navigate(`/prompt-kits/${newKit.slug}`);
		} catch (err) {
			console.error(err);
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	};
	if (authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user) return null;
	const coachPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtifactCoachPanel, {
		artifactType: "prompt_kit",
		artifactId: "draft",
		canvasContent: content,
		onApplyContent: handleApplyAIContent,
		onUndo: handleUndoAI,
		canUndo: previousContent !== null,
		isNew: true,
		userId: user.id,
		workspaceId: currentWorkspace === "personal" ? null : currentWorkspace,
		sessionId: coachSessionId
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-[1600px] px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: "/library",
							className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Library"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 flex-wrap",
							children: [isMobile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
								open: showCoachSheet,
								onOpenChange: setShowCoachSheet,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-4 w-4" }), "AI Coach"]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
									side: "bottom",
									className: "h-[80vh] p-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
										className: "sr-only",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Prompt Kit Coach" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full",
										children: coachPanel
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: handleSubmit,
								disabled: isSubmitting,
								className: "gap-2",
								children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Create Prompt Kit"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 min-w-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border bg-card p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mb-6 text-xl font-semibold text-foreground",
									children: "Create New Prompt Kit"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "content",
														children: "Kit Content *"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs text-muted-foreground",
														children: [
															items.length,
															" ",
															items.length === 1 ? "prompt" : "prompts",
															" detected"
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [
														"Write an intro and any commentary as normal text. Use the",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium text-foreground",
															children: "Insert prompt"
														}),
														" ",
														"button to add a copyable prompt block. Each block becomes a ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
															className: "font-mono",
															children: "## Prompt: …"
														}),
														" heading on save."
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitRichEditor, {
													value: content,
													onChange: setContent,
													error: !!errors.content
												}),
												errors.content && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-destructive",
													children: errors.content
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "outline",
												size: "sm",
												onClick: handleSuggestMetadata,
												disabled: isGeneratingMetadata || !content.trim(),
												className: "gap-1.5",
												children: isGeneratingMetadata ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), "Generating…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), "Suggest title, description, category & tags"] })
											}), metadataError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-destructive",
												children: metadataError
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "title",
													children: "Title *"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "title",
													value: title,
													onChange: (e) => setTitle(e.target.value),
													placeholder: "e.g., Cold Outreach Pack",
													className: errors.title ? "border-destructive" : ""
												}),
												errors.title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-destructive",
													children: errors.title
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "description",
												children: "Description"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												id: "description",
												value: description,
												onChange: (e) => setDescription(e.target.value),
												placeholder: "Briefly describe what this kit is for…",
												rows: 2
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "category",
													children: "Category *"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: category,
													onValueChange: setCategory,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
														className: errors.category ? "border-destructive" : "",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a category" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categoryOptions.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: c.id,
														children: c.label
													}, c.id)) })]
												}),
												errors.category && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-destructive",
													children: errors.category
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "tags",
													children: "Tags"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "tags",
													value: tagInput,
													onChange: (e) => setTagInput(e.target.value),
													onKeyDown: handleAddTag,
													placeholder: "Press Enter to add tags…"
												}),
												tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-wrap gap-2 mt-2",
													children: tags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														variant: "secondary",
														className: "gap-1",
														children: [t, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => handleRemoveTag(t),
															className: "ml-1 hover:text-destructive",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
														})]
													}, t))
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSelect, {
											value: language,
											onChange: setLanguage
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "visibility",
												className: "text-base",
												children: "Make this kit public"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: isPublic ? "Anyone can discover and use this kit" : "Only you can see this kit"
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												id: "visibility",
												checked: isPublic,
												onCheckedChange: setIsPublic
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: handleSubmit,
											disabled: isSubmitting,
											className: "w-full gap-2",
											size: "lg",
											children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Create Prompt Kit"]
										})
									]
								})]
							})
						}), !isMobile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-[380px] shrink-0 flex flex-col gap-4 sticky top-24 self-start",
							style: { height: "calc(100vh - 12rem)" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border bg-card p-4 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-3 flex items-center gap-2 text-sm font-medium",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListTree, { className: "h-4 w-4 text-primary" }), "Outline"]
								}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										"No prompts detected yet. Use a",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "font-mono",
											children: "## Prompt:"
										}),
										" heading."
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
									className: "space-y-1.5 max-h-40 overflow-y-auto",
									children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground mr-1.5",
											children: [item.index, "."]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-foreground",
											children: item.title || "Untitled"
										})]
									}, item.index))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 min-h-0",
								children: coachPanel
							})]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = PromptKitNew;
//#endregion
export { SplitComponent as component };
