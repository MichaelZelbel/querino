import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Switch } from "./switch-BXNTxolN.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { $t as FileText, Nn as Bot, P as Sparkles, V as Save, Vn as ArrowLeft, gt as LoaderCircle, n as X } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, l as useSearchParams, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { t as moderateContent } from "./moderateContent-Dd1HYPU1.mjs";
import { n as categoryOptions } from "./prompt-C3zowaN0.mjs";
import { n as ModerationBlockDialog, t as LineNumberedEditor } from "./ModerationBlockDialog-DCe6GfCj.mjs";
import { a as SheetTrigger, i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-CmQHWRHQ.mjs";
import { i as promoteDraftSession, o as useIsMobile, r as getOrCreateDraftSessionId, t as LanguageSelect } from "./use-mobile-BpJyCOKD.mjs";
import { t as ArtifactCoachPanel } from "./ArtifactCoachPanel-BP0dO9xb.mjs";
import { t as useAICreditsGate } from "./useAICreditsGate-CWqt47PK.mjs";
import { t as generateSlug } from "./useGenerateSlug-CCE44gEG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-aKcrPM4X.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WorkflowNew() {
	const navigate = useNavigate$1();
	const [searchParams] = useSearchParams();
	const { user, loading: authLoading } = useAuthContext();
	const { checkCredits } = useAICreditsGate();
	const { currentWorkspace } = useWorkspace();
	const isMobile = useIsMobile();
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [showCoachSheet, setShowCoachSheet] = (0, import_react.useState)(false);
	const [content, setContent] = (0, import_react.useState)(searchParams.get("content") || "");
	const [previousContent, setPreviousContent] = (0, import_react.useState)(null);
	const [title, setTitle] = (0, import_react.useState)(searchParams.get("title") || "");
	const [description, setDescription] = (0, import_react.useState)(searchParams.get("description") || "");
	const [category, setCategory] = (0, import_react.useState)(searchParams.get("category") || "");
	const [tagInput, setTagInput] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)(searchParams.get("tags")?.split(",").filter(Boolean) || []);
	const [isPublic, setIsPublic] = (0, import_react.useState)(false);
	const [language, setLanguage] = (0, import_react.useState)(searchParams.get("language") || "en");
	const [errors, setErrors] = (0, import_react.useState)({});
	const [moderationBlock, setModerationBlock] = (0, import_react.useState)(null);
	const [isGeneratingMetadata, setIsGeneratingMetadata] = (0, import_react.useState)(false);
	const [metadataError, setMetadataError] = (0, import_react.useState)(null);
	const workspaceScope = currentWorkspace ?? "personal";
	const draftSessionId = user ? getOrCreateDraftSessionId(workspaceScope, user.id, "workflow") : "draft";
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate("/auth?redirect=/workflows/new", { replace: true });
	}, [
		user,
		authLoading,
		navigate
	]);
	const handleApplyAIContent = (newContent) => {
		setPreviousContent(content);
		setContent(newContent);
	};
	const handleUndoAI = () => {
		if (previousContent !== null) {
			setContent(previousContent);
			setPreviousContent(null);
		}
	};
	const normalizeTag = (tag) => {
		return tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
	};
	const handleAddTag = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const normalized = normalizeTag(tagInput);
			if (normalized && !tags.includes(normalized)) setTags([...tags, normalized]);
			setTagInput("");
		}
	};
	const handleRemoveTag = (tagToRemove) => {
		setTags(tags.filter((t) => t !== tagToRemove));
	};
	const validate = () => {
		const newErrors = {};
		if (!content.trim()) newErrors.content = "Workflow content is required";
		if (!title.trim()) newErrors.title = "Title is required";
		if (!category) newErrors.category = "Please select a category";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	const handleSuggestMetadata = async () => {
		if (!checkCredits()) return;
		if (!content.trim()) {
			setMetadataError("Please add some workflow content first.");
			return;
		}
		setIsGeneratingMetadata(true);
		setMetadataError(null);
		try {
			const { data: result, error } = await supabase.functions.invoke("suggest-workflow-metadata", { body: {
				workflow_content: content.trim(),
				user_id: user?.id
			} });
			if (error) throw new Error("Failed to generate suggestions");
			const data = result.output || result;
			if (data.title) setTitle(data.title);
			if (data.description) setDescription(data.description);
			if (data.category) {
				const matched = categoryOptions.find((c) => c.id.toLowerCase() === data.category.toLowerCase());
				if (matched) setCategory(matched.id);
			}
			if (data.tags && Array.isArray(data.tags)) setTags(data.tags.map((t) => normalizeTag(t)).filter(Boolean).slice(0, 10));
			toast.success("Metadata suggestions applied!");
		} catch {
			setMetadataError("Could not generate suggestions. Please try again.");
		} finally {
			setIsGeneratingMetadata(false);
		}
	};
	const handleSubmit = async () => {
		if (!user) return;
		if (!validate()) return;
		if (isPublic) {
			const result = await moderateContent({
				title,
				description,
				content
			}, "publish", "workflow");
			if (!result.approved) {
				setModerationBlock(result);
				return;
			}
		}
		setIsSubmitting(true);
		try {
			const slug = await generateSlug(title.trim());
			const { data: newWorkflow, error } = await supabase.from("workflows").insert({
				title: title.trim(),
				description: description.trim() || null,
				content: content.trim(),
				category,
				tags: tags.length > 0 ? tags : null,
				author_id: user.id,
				published: isPublic,
				language,
				json: {},
				slug
			}).select("id, slug").single();
			if (error) {
				toast.error("Failed to create workflow");
				return;
			}
			if (newWorkflow?.id) promoteDraftSession(workspaceScope, user.id, newWorkflow.id, "workflow");
			toast.success("Workflow created!");
			navigate(`/workflows/${newWorkflow.slug}`);
		} catch {
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
		artifactType: "workflow",
		artifactId: "draft",
		canvasContent: content,
		onApplyContent: handleApplyAIContent,
		onUndo: handleUndoAI,
		canUndo: previousContent !== null,
		isNew: true,
		userId: user.id,
		workspaceId: currentWorkspace === "personal" ? null : currentWorkspace,
		sessionId: draftSessionId
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
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Workflow Coach" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full",
										children: coachPanel
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: handleSubmit,
								disabled: isSubmitting,
								className: "gap-2",
								children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Create Workflow"]
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
									children: "Create New Workflow"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "content",
														children: "Workflow Markdown *"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineNumberedEditor, {
													id: "content",
													value: content,
													onChange: setContent,
													placeholder: `# My Workflow\n\n## Description\nDescribe what this workflow does...\n\n## Steps\n1. First step...\n2. Second step...`,
													error: !!errors.content
												}),
												errors.content && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-destructive",
													children: errors.content
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "Write your workflow instructions in Markdown format."
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
													placeholder: "e.g., Code Review Workflow",
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
												placeholder: "Brief description of what this workflow does...",
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
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categoryOptions.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: cat.id,
														children: cat.label
													}, cat.id)) })]
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
													placeholder: "Press Enter to add tags..."
												}),
												tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-wrap gap-2 mt-2",
													children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														variant: "secondary",
														className: "gap-1",
														children: [tag, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => handleRemoveTag(tag),
															className: "ml-1 hover:text-destructive",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
														})]
													}, tag))
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
												children: "Make this workflow public"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: isPublic ? "Anyone can discover and use this workflow" : "Only you can see this workflow"
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
											children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Create Workflow"]
										})
									]
								})]
							})
						}), !isMobile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-[380px] shrink-0 sticky top-24 self-start",
							style: { height: "calc(100vh - 12rem)" },
							children: coachPanel
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModerationBlockDialog, {
				open: !!moderationBlock,
				onClose: () => setModerationBlock(null),
				category: moderationBlock?.category,
				supportHint: moderationBlock?.support_hint
			})
		]
	});
}
var SplitComponent = WorkflowNew;
//#endregion
export { SplitComponent as component };
