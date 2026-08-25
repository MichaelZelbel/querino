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
import { Nn as Bot, P as Sparkles, V as Save, Vn as ArrowLeft, gt as LoaderCircle, i as WandSparkles, n as X } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, l as useSearchParams, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { t as moderateContent } from "./moderateContent-Dd1HYPU1.mjs";
import { n as categoryOptions } from "./prompt-C3zowaN0.mjs";
import { n as ModerationBlockDialog, t as LineNumberedEditor } from "./ModerationBlockDialog-DCe6GfCj.mjs";
import { a as SheetTrigger, i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-CmQHWRHQ.mjs";
import { i as promoteDraftSession, o as useIsMobile, r as getOrCreateDraftSessionId, t as LanguageSelect } from "./use-mobile-BpJyCOKD.mjs";
import { t as generateSlug } from "./useGenerateSlug-CCE44gEG.mjs";
import { t as PromptCoachPanel } from "./PromptCoachPanel-Bs9KS7xf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-BIkKqofp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PromptNew() {
	const navigate = useNavigate$1();
	const [searchParams] = useSearchParams();
	const { user, loading: authLoading } = useAuthContext();
	const { currentWorkspace } = useWorkspace();
	const isMobile = useIsMobile();
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)(searchParams.get("title") || "");
	const [shortDescription, setShortDescription] = (0, import_react.useState)(searchParams.get("description") || "");
	const [content, setContent] = (0, import_react.useState)(searchParams.get("content") || searchParams.get("draft") || "");
	const [category, setCategory] = (0, import_react.useState)(searchParams.get("category") || "");
	const [tagInput, setTagInput] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)(searchParams.get("tags")?.split(",").filter(Boolean) || []);
	const [isPublic, setIsPublic] = (0, import_react.useState)(false);
	const [language, setLanguage] = (0, import_react.useState)(searchParams.get("language") || "en");
	const [errors, setErrors] = (0, import_react.useState)({});
	const menerioNoteId = searchParams.get("menerio_note_id");
	const menerioCallback = searchParams.get("menerio_callback");
	const [isGeneratingMetadata, setIsGeneratingMetadata] = (0, import_react.useState)(false);
	const [metadataError, setMetadataError] = (0, import_react.useState)(null);
	const [previousContent, setPreviousContent] = (0, import_react.useState)(null);
	const [moderationBlock, setModerationBlock] = (0, import_react.useState)(null);
	const [showCoachSheet, setShowCoachSheet] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate("/auth?redirect=/prompts/new", { replace: true });
	}, [
		user,
		authLoading,
		navigate
	]);
	const normalizeTag = (tag) => {
		return tag.trim().toLowerCase().replace(/[^a-z0-9\-\s]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
	};
	const handleAddTag = () => {
		const normalizedTag = normalizeTag(tagInput);
		if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 10) {
			setTags([...tags, normalizedTag]);
			setTagInput("");
		}
	};
	const handleRemoveTag = (tagToRemove) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};
	const handleTagKeyDown = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			handleAddTag();
		}
	};
	const handleSuggestMetadata = async () => {
		if (!content.trim()) {
			setMetadataError("Please add some prompt content first.");
			return;
		}
		setIsGeneratingMetadata(true);
		setMetadataError(null);
		try {
			const response = await supabase.functions.invoke("suggest-metadata", { body: {
				prompt_content: content.trim(),
				user_id: user?.id
			} });
			if (response.error) throw new Error(response.error.message);
			const result = response.data;
			if (result.title) setTitle(result.title);
			if (result.description) setShortDescription(result.description);
			if (result.category) {
				const matched = categoryOptions.find((cat) => cat.id.toLowerCase() === result.category.toLowerCase());
				if (matched) setCategory(matched.id);
			}
			if (result.tags && Array.isArray(result.tags)) setTags(result.tags.map((t) => normalizeTag(t)).filter((t) => t).slice(0, 10));
		} catch (error) {
			console.error("Error suggesting metadata:", error);
			setMetadataError("Could not generate suggestions. Please try again.");
		} finally {
			setIsGeneratingMetadata(false);
		}
	};
	const validate = () => {
		const newErrors = {};
		if (!title.trim()) newErrors.title = "Title is required";
		else if (title.length > 100) newErrors.title = "Title must be less than 100 characters";
		if (!shortDescription.trim()) newErrors.shortDescription = "Short description is required";
		else if (shortDescription.length > 2e3) newErrors.shortDescription = "Description must be less than 2000 characters";
		if (!content.trim()) newErrors.content = "Prompt content is required";
		if (!category) newErrors.category = "Please select a category";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	const handleCreate = async () => {
		if (!validate() || !user) return;
		if (isPublic) {
			const result = await moderateContent({
				title,
				description: shortDescription,
				content
			}, "publish", "prompt");
			if (!result.approved) {
				setModerationBlock(result);
				return;
			}
		}
		setIsSubmitting(true);
		try {
			const slug = await generateSlug(title.trim());
			const { data: newPrompt, error } = await supabase.from("prompts").insert({
				title: title.trim(),
				description: shortDescription.trim(),
				content: content.trim(),
				category,
				tags: tags.length > 0 ? tags : null,
				is_public: isPublic,
				author_id: user.id,
				rating_avg: 0,
				rating_count: 0,
				copies_count: 0,
				language,
				slug
			}).select("id, slug").single();
			if (error) {
				console.error("Error creating prompt:", error.message, error.details, error.hint, error.code);
				toast.error(`Failed to create prompt: ${error.message}`);
				return;
			}
			const { error: versionError } = await supabase.from("prompt_versions").insert({
				prompt_id: newPrompt.id,
				version_number: 1,
				title: title.trim(),
				description: shortDescription.trim(),
				content: content.trim(),
				tags: tags.length > 0 ? tags : null,
				change_notes: "Initial version"
			});
			if (versionError) {
				console.error("Error creating initial version:", versionError);
				toast.warning("Prompt created, but the initial version entry could not be saved.");
			}
			promoteDraftSession(currentWorkspace ?? "personal", user.id, newPrompt.id);
			if (menerioNoteId && menerioCallback) try {
				const cbResponse = await supabase.functions.invoke("menerio-link-callback", { body: {
					menerio_callback: menerioCallback,
					menerio_note_id: menerioNoteId,
					prompt_id: newPrompt.id,
					prompt_slug: newPrompt.slug
				} });
				if (cbResponse.error) {
					console.error("Menerio link callback failed:", cbResponse.error);
					toast.error("Prompt created, but Menerio linking failed.");
				} else toast.success("Prompt created and linked to Menerio!");
			} catch (cbErr) {
				console.error("Menerio link callback error:", cbErr);
				toast.error("Prompt created, but Menerio linking failed.");
			}
			else toast.success("Prompt created successfully!");
			navigate(`/prompts/${newPrompt.slug}`);
		} catch (err) {
			console.error("Error creating prompt:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleApplyAIContent = (newContent, _changeNote) => {
		setPreviousContent(content);
		setContent(newContent);
	};
	const handleUndoAI = () => {
		if (previousContent !== null) {
			setContent(previousContent);
			setPreviousContent(null);
			toast.success("AI edit undone.");
		}
	};
	const draftSessionId = user ? getOrCreateDraftSessionId(currentWorkspace ?? "personal", user.id) : "draft";
	const coachPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCoachPanel, {
		isNewPrompt: true,
		artifactId: "draft",
		canvasContent: content,
		onApplyContent: handleApplyAIContent,
		onUndo: handleUndoAI,
		canUndo: previousContent !== null,
		userId: user?.id ?? "",
		workspaceId: currentWorkspace === "personal" ? null : currentWorkspace,
		sessionId: draftSessionId
	});
	if (authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user) return null;
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
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
									to: "/prompts/wizard",
									className: "inline-flex items-center gap-1.5 text-sm text-primary hover:underline",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "h-4 w-4" }), "Kickstart Template"]
								}),
								isMobile && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
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
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Prompt Coach" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full",
											children: coachPanel
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleCreate,
									disabled: isSubmitting,
									className: "gap-2",
									children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Create Prompt"]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 min-w-0 space-y-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border bg-card p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mb-6 text-xl font-semibold text-foreground",
									children: "Create New Prompt"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "content",
													children: "Prompt Content *"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineNumberedEditor, {
													id: "content",
													value: content,
													onChange: setContent,
													placeholder: "Write your prompt here...",
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
													placeholder: "Give your prompt a clear, descriptive title",
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
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "shortDescription",
													children: "Description *"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
													id: "shortDescription",
													value: shortDescription,
													onChange: (e) => setShortDescription(e.target.value),
													placeholder: "Briefly describe what this prompt does",
													rows: 2,
													className: errors.shortDescription ? "border-destructive" : ""
												}),
												errors.shortDescription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-destructive",
													children: errors.shortDescription
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [shortDescription.length, "/2000 characters"]
												})
											]
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
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSelect, {
											value: language,
											onChange: setLanguage
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "tags",
													children: "Tags"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "tags",
														value: tagInput,
														onChange: (e) => setTagInput(e.target.value),
														onKeyDown: handleTagKeyDown,
														placeholder: "Add tags and press Enter",
														disabled: tags.length >= 10
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "secondary",
														onClick: handleAddTag,
														disabled: !tagInput.trim() || tags.length >= 10,
														children: "Add"
													})]
												}),
												tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-wrap gap-2 mt-2",
													children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														variant: "secondary",
														className: "gap-1 pr-1",
														children: [tag, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => handleRemoveTag(tag),
															className: "ml-1 rounded-full p-0.5 hover:bg-muted",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
														})]
													}, tag))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [tags.length, "/10 tags"]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "visibility",
												className: "text-base",
												children: "Make this prompt public"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: isPublic ? "Anyone can discover and use this prompt" : "Only you can see this prompt"
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												id: "visibility",
												checked: isPublic,
												onCheckedChange: setIsPublic
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: handleCreate,
											disabled: isSubmitting,
											className: "w-full gap-2",
											size: "lg",
											children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Create Prompt"]
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
var SplitComponent = PromptNew;
//#endregion
export { SplitComponent as component };
