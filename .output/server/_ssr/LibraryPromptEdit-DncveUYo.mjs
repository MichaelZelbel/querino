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
import { An as Calendar, At as Info, I as ShieldAlert, Jt as GitBranch, Nn as Bot, P as Sparkles, Pt as History, Tt as Layers, Ut as Globe, V as Save, Vn as ArrowLeft, b as Trash2, en as Eye, et as Pencil, gt as LoaderCircle, kn as Check, n as X, v as TriangleAlert, vn as Clock, xt as Link } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { t as useUserRole } from "./useUserRole-B1YhonQE.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { n as format } from "../_libs/date-fns.mjs";
import { n as TabsContent, t as Tabs } from "./tabs-B4ZFfXyf.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
import { t as moderateContent } from "./moderateContent-Dd1HYPU1.mjs";
import { n as categoryOptions } from "./prompt-C3zowaN0.mjs";
import { n as ModerationBlockDialog, t as LineNumberedEditor } from "./ModerationBlockDialog-DCe6GfCj.mjs";
import { a as SheetTrigger, i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-CmQHWRHQ.mjs";
import { t as VersionHistoryPanel } from "./VersionHistoryPanel-Ba812uju.mjs";
import { t as DownloadMarkdownButton } from "./DownloadMarkdownButton-DBKsRp2M.mjs";
import { t as ImportMarkdownButton } from "./ImportMarkdownButton-D1LM1233.mjs";
import { n as deterministicSessionId, o as useIsMobile, t as LanguageSelect } from "./use-mobile-BpJyCOKD.mjs";
import { n as useUnsavedChanges, t as SaveStateBadge } from "./SaveStateBadge-xDjAgC9q.mjs";
import { n as AlertDescription, t as Alert } from "./alert-DeotHHTZ.mjs";
import { t as generateSlug } from "./useGenerateSlug-CCE44gEG.mjs";
import { t as PromptCoachPanel } from "./PromptCoachPanel-Bs9KS7xf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LibraryPromptEdit-DncveUYo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PublishPromptModal({ open, onOpenChange, onPublish, isPublishing }) {
	const [summary, setSummary] = (0, import_react.useState)("");
	const [exampleOutput, setExampleOutput] = (0, import_react.useState)("");
	const [errors, setErrors] = (0, import_react.useState)({});
	const validate = () => {
		const newErrors = {};
		if (!summary.trim()) newErrors.summary = "Summary is required";
		else if (summary.length > 200) newErrors.summary = "Summary must be less than 200 characters";
		if (exampleOutput.length > 1e3) newErrors.exampleOutput = "Example output must be less than 1000 characters";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	const handleSubmit = async () => {
		if (!validate()) return;
		await onPublish({
			summary: summary.trim(),
			exampleOutput: exampleOutput.trim()
		});
	};
	const handleClose = (isOpen) => {
		if (!isPublishing) {
			onOpenChange(isOpen);
			if (!isOpen) {
				setSummary("");
				setExampleOutput("");
				setErrors({});
			}
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: handleClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-6 w-6 text-primary" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-xl",
						children: "Publish Your Prompt"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-base",
						children: "Publishing your prompt makes it discoverable by all users on Querino. Add some details to help others find and understand your prompt."
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									htmlFor: "summary",
									children: ["Summary ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-destructive",
										children: "*"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "summary",
									value: summary,
									onChange: (e) => setSummary(e.target.value),
									placeholder: "A short 1-2 sentence explanation of what this prompt does...",
									rows: 3,
									className: errors.summary ? "border-destructive" : ""
								}),
								errors.summary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-destructive",
									children: errors.summary
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [summary.length, "/200 characters"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									htmlFor: "exampleOutput",
									className: "flex items-center gap-2",
									children: ["Example Output", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-normal text-muted-foreground",
										children: "(recommended)"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									id: "exampleOutput",
									value: exampleOutput,
									onChange: (e) => setExampleOutput(e.target.value),
									placeholder: "Show users an example of what this prompt produces...",
									rows: 4,
									className: errors.exampleOutput ? "border-destructive" : ""
								}),
								errors.exampleOutput && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-destructive",
									children: errors.exampleOutput
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [exampleOutput.length, "/1000 characters"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3 rounded-lg bg-muted/50 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5 text-primary mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-foreground",
									children: "What happens when you publish?"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-1 list-disc list-inside space-y-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Your prompt appears on the Discover page" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Anyone can copy and use your prompt" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You can unpublish anytime from the edit page" })
									]
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => handleClose(false),
					disabled: isPublishing,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleSubmit,
					disabled: isPublishing,
					className: "gap-2",
					children: isPublishing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Publishing..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4" }), "Publish Prompt"] })
				})] })
			]
		})
	});
}
function useUpdatePromptSlug() {
	const [updating, setUpdating] = (0, import_react.useState)(false);
	const updateSlug = async (promptId, newSlug, userId) => {
		setUpdating(true);
		try {
			const { data, error } = await supabase.rpc("update_prompt_slug", {
				p_prompt_id: promptId,
				p_new_slug: newSlug,
				p_user_id: userId
			});
			if (error) throw error;
			return data;
		} catch (err) {
			console.error("Error updating slug:", err);
			return { error: "Failed to update slug. Please try again." };
		} finally {
			setUpdating(false);
		}
	};
	return {
		updateSlug,
		updating
	};
}
function SlugEditor({ promptId, currentSlug, userId, onSlugChanged }) {
	const [isEditing, setIsEditing] = (0, import_react.useState)(false);
	const [slugInput, setSlugInput] = (0, import_react.useState)(currentSlug);
	const [error, setError] = (0, import_react.useState)(null);
	const { updateSlug, updating } = useUpdatePromptSlug();
	const handleStartEdit = () => {
		setSlugInput(currentSlug);
		setError(null);
		setIsEditing(true);
	};
	const handleCancel = () => {
		setSlugInput(currentSlug);
		setError(null);
		setIsEditing(false);
	};
	const handleSave = async () => {
		const trimmed = slugInput.trim();
		if (!trimmed) {
			setError("Slug cannot be empty");
			return;
		}
		setError(null);
		const transliterated = await generateSlug(trimmed);
		if (!transliterated) {
			setError("Invalid slug: becomes empty after normalization");
			return;
		}
		const result = await updateSlug(promptId, transliterated, userId);
		if (result.error) {
			setError(result.error);
			return;
		}
		if (result.changed && result.slug) {
			onSlugChanged(result.slug);
			toast.success(`Slug updated to "${result.slug}"`);
			setSlugInput(result.slug);
		} else if (result.slug) setSlugInput(result.slug);
		setIsEditing(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { className: "h-4 w-4" }), "URL Slug"]
			}),
			isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center rounded-md border border-input bg-background",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-3 text-sm text-muted-foreground whitespace-nowrap border-r border-input bg-muted/50",
										children: "/prompts/"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: slugInput,
										onChange: (e) => {
											setSlugInput(e.target.value);
											setError(null);
										},
										onKeyDown: (e) => {
											if (e.key === "Enter") handleSave();
											if (e.key === "Escape") handleCancel();
										},
										className: "border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
										placeholder: "my-prompt-slug",
										autoFocus: true
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon",
								variant: "default",
								onClick: handleSave,
								disabled: updating,
								"aria-label": "Save slug",
								children: updating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon",
								variant: "outline",
								onClick: handleCancel,
								disabled: updating,
								"aria-label": "Cancel",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
						variant: "default",
						className: "border-warning/50 bg-warning/10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4 text-warning" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDescription, {
							className: "text-sm text-muted-foreground",
							children: "Changing this slug will update the public URL. Old links will redirect automatically."
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-destructive",
						children: error
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 rounded-md border border-input bg-muted/30 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted-foreground",
						children: "/prompts/"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium text-foreground",
						children: currentSlug
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "icon",
					variant: "ghost",
					onClick: handleStartEdit,
					title: "Edit slug",
					"aria-label": "Edit slug",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "The slug is the URL-friendly identifier for this prompt. It won't change when you edit the title."
			})
		]
	});
}
function LibraryPromptEdit() {
	const { slug } = useParams$1();
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuthContext();
	const { currentWorkspace } = useWorkspace();
	const isMobile = useIsMobile();
	const { isAdmin } = useUserRole();
	const [prompt, setPrompt] = (0, import_react.useState)(null);
	const [versions, setVersions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [notAuthorized, setNotAuthorized] = (0, import_react.useState)(false);
	const [isSaving, setIsSaving] = (0, import_react.useState)(false);
	const [isSavingVersion, setIsSavingVersion] = (0, import_react.useState)(false);
	const [isDeleting, setIsDeleting] = (0, import_react.useState)(false);
	const [isPublishing, setIsPublishing] = (0, import_react.useState)(false);
	const [showPublishModal, setShowPublishModal] = (0, import_react.useState)(false);
	const [showVersionDrawer, setShowVersionDrawer] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)("");
	const [shortDescription, setShortDescription] = (0, import_react.useState)("");
	const [content, setContent] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [tagInput, setTagInput] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)([]);
	const [isPublic, setIsPublic] = (0, import_react.useState)(true);
	const [changeNotes, setChangeNotes] = (0, import_react.useState)("");
	const [language, setLanguage] = (0, import_react.useState)("en");
	const [errors, setErrors] = (0, import_react.useState)({});
	const [isGeneratingMetadata, setIsGeneratingMetadata] = (0, import_react.useState)(false);
	const [metadataError, setMetadataError] = (0, import_react.useState)(null);
	const [previousContent, setPreviousContent] = (0, import_react.useState)(null);
	const [showCoachSheet, setShowCoachSheet] = (0, import_react.useState)(false);
	const [showVersionPanel, setShowVersionPanel] = (0, import_react.useState)(false);
	const [moderationBlock, setModerationBlock] = (0, import_react.useState)(null);
	const promptId = prompt?.id;
	const { isDirty, savedAt, markSaved } = useUnsavedChanges({
		data: {
			title,
			shortDescription,
			content,
			category,
			tags,
			isPublic,
			language
		},
		isSaving,
		onSave: () => handleSaveChanges()
	});
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate(`/auth?redirect=/library/${slug}/edit`, { replace: true });
	}, [
		user,
		authLoading,
		navigate,
		slug
	]);
	(0, import_react.useEffect)(() => {
		async function fetchData() {
			if (!slug || !user) return;
			try {
				const { data: promptData, error: promptError } = await supabase.from("prompts").select("*").eq("slug", slug).maybeSingle();
				if (promptError) {
					console.error("Error fetching prompt:", promptError);
					setNotFound(true);
					return;
				}
				if (!promptData) {
					setNotFound(true);
					return;
				}
				if (promptData.author_id !== user.id && !isAdmin) {
					setNotAuthorized(true);
					return;
				}
				const typedPrompt = promptData;
				setPrompt(typedPrompt);
				setTitle(typedPrompt.title);
				setShortDescription(typedPrompt.description);
				setContent(typedPrompt.content);
				setCategory(typedPrompt.category);
				setTags(typedPrompt.tags || []);
				setIsPublic(typedPrompt.is_public);
				setLanguage(typedPrompt.language || "en");
				markSaved();
				const { data: versionsData, error: versionsError } = await supabase.from("prompt_versions").select("*").eq("prompt_id", promptData.id).order("version_number", { ascending: false });
				if (!versionsError && versionsData) setVersions(versionsData);
			} catch (err) {
				console.error("Error fetching data:", err);
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		}
		if (user) fetchData();
	}, [slug, user]);
	const handleRestoreComplete = async () => {
		if (!promptId) return;
		const { data: promptData } = await supabase.from("prompts").select("*").eq("id", promptId).maybeSingle();
		if (promptData) {
			const typedPrompt = promptData;
			setPrompt(typedPrompt);
			setTitle(typedPrompt.title);
			setShortDescription(typedPrompt.description);
			setContent(typedPrompt.content);
			setCategory(typedPrompt.category);
			setTags(typedPrompt.tags || []);
			setIsPublic(typedPrompt.is_public);
			setLanguage(typedPrompt.language || "en");
			markSaved();
		}
		const { data: versionsData } = await supabase.from("prompt_versions").select("*").eq("prompt_id", promptId).order("version_number", { ascending: false });
		if (versionsData) setVersions(versionsData);
	};
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
				const matchedCategory = categoryOptions.find((cat) => cat.id.toLowerCase() === result.category.toLowerCase());
				if (matchedCategory) setCategory(matchedCategory.id);
			}
			if (result.tags && Array.isArray(result.tags)) {
				const newTags = result.tags.map((tag) => normalizeTag(tag)).filter((tag) => tag).slice(0, 10);
				setTags(newTags);
			}
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
	const handleSaveChanges = async () => {
		if (!validate() || !promptId || !user) return;
		if (isPublic) {
			const result = await moderateContent({
				title,
				description: shortDescription,
				content
			}, "edit_public", "prompt", promptId);
			if (!result.approved) {
				setModerationBlock(result);
				return;
			}
		}
		setIsSaving(true);
		try {
			const { error } = await supabase.from("prompts").update({
				title: title.trim(),
				description: shortDescription.trim(),
				content: content.trim(),
				category,
				tags: tags.length > 0 ? tags : null,
				is_public: isPublic,
				language
			}).eq("id", promptId).eq("author_id", user.id);
			if (error) {
				console.error("Error updating prompt:", error);
				toast.error("Failed to save changes. Please try again.");
				return;
			}
			markSaved();
			toast.success("Changes saved successfully!");
		} catch (err) {
			console.error("Error saving:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};
	const handleSaveAsNewVersion = async () => {
		if (!validate() || !promptId || !user) return;
		setIsSavingVersion(true);
		try {
			const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
			const { error: versionError } = await supabase.from("prompt_versions").insert({
				prompt_id: promptId,
				version_number: nextVersionNumber,
				title: title.trim(),
				description: shortDescription.trim(),
				content: content.trim(),
				tags: tags.length > 0 ? tags : null,
				change_notes: changeNotes.trim() || null
			});
			if (versionError) {
				console.error("Error creating version:", versionError);
				toast.error("Failed to create new version. Please try again.");
				return;
			}
			const { error: updateError } = await supabase.from("prompts").update({
				title: title.trim(),
				description: shortDescription.trim(),
				content: content.trim(),
				category,
				tags: tags.length > 0 ? tags : null,
				is_public: isPublic
			}).eq("id", promptId).eq("author_id", user.id);
			if (updateError) {
				console.error("Error updating prompt:", updateError);
				toast.error("Version created but failed to update prompt.");
				return;
			}
			const { data: newVersions } = await supabase.from("prompt_versions").select("*").eq("prompt_id", promptId).order("version_number", { ascending: false });
			if (newVersions) setVersions(newVersions);
			setChangeNotes("");
			toast.success(`Version ${nextVersionNumber} created successfully!`);
		} catch (err) {
			console.error("Error creating version:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSavingVersion(false);
		}
	};
	const handleDelete = async () => {
		if (!promptId || !user) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase.from("prompts").delete().eq("id", promptId).eq("author_id", user.id);
			if (error) {
				console.error("Error deleting prompt:", error);
				toast.error("Failed to delete prompt. Please try again.");
				return;
			}
			toast.success("Prompt deleted successfully!");
			navigate("/library");
		} catch (err) {
			console.error("Error deleting:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsDeleting(false);
		}
	};
	const handlePublish = async (data) => {
		if (!promptId || !user) return;
		setIsPublishing(true);
		try {
			const { error } = await supabase.from("prompts").update({
				is_public: true,
				published_at: (/* @__PURE__ */ new Date()).toISOString(),
				summary: data.summary,
				example_output: data.exampleOutput || null
			}).eq("id", promptId).eq("author_id", user.id);
			if (error) {
				console.error("Error publishing prompt:", error);
				toast.error("Failed to publish prompt. Please try again.");
				return;
			}
			setPrompt((prev) => prev ? {
				...prev,
				is_public: true,
				published_at: (/* @__PURE__ */ new Date()).toISOString(),
				summary: data.summary,
				example_output: data.exampleOutput || null
			} : null);
			setIsPublic(true);
			setShowPublishModal(false);
			toast.success("Prompt published successfully!");
			navigate(`/prompts/${slug}`);
		} catch (err) {
			console.error("Error publishing:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsPublishing(false);
		}
	};
	const handleUnpublish = async () => {
		if (!promptId || !user) return;
		setIsSaving(true);
		try {
			const { error } = await supabase.from("prompts").update({ is_public: false }).eq("id", promptId).eq("author_id", user.id);
			if (error) {
				console.error("Error unpublishing prompt:", error);
				toast.error("Failed to unpublish prompt. Please try again.");
				return;
			}
			setPrompt((prev) => prev ? {
				...prev,
				is_public: false
			} : null);
			setIsPublic(false);
			toast.success("Prompt unpublished. It's now private.");
		} catch (err) {
			console.error("Error unpublishing:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};
	const handleApplyAIContent = async (newContent) => {
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
	const coachSessionId = promptId && user ? deterministicSessionId(currentWorkspace ?? "personal", user.id, promptId) : "draft";
	const coachPanel = promptId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCoachPanel, {
		artifactId: promptId,
		canvasContent: content,
		onApplyContent: handleApplyAIContent,
		onUndo: handleUndoAI,
		canUndo: previousContent !== null,
		userId: user?.id ?? "",
		workspaceId: currentWorkspace === "personal" ? null : currentWorkspace,
		sessionId: coachSessionId
	}) : null;
	if (authLoading || loading && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user) return null;
	if (notFound) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-4 text-display-md font-bold text-foreground",
							children: "Prompt Not Found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "The prompt you're looking for doesn't exist."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/library",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Library"]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (notAuthorized) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4 flex justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-8 w-8 text-destructive" })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-4 text-display-md font-bold text-foreground",
							children: "Not Authorized"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "You don't have permission to edit this prompt."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/library",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Library"]
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
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportMarkdownButton, {
									type: "prompt",
									size: "sm",
									variant: "outline",
									label: "Import .md",
									isEditorMode: true,
									onImport: (parsed) => {
										setTitle(parsed.frontmatter.title || title);
										setShortDescription(parsed.frontmatter.description || shortDescription);
										setContent(parsed.content);
										if (parsed.frontmatter.tags) setTags(parsed.frontmatter.tags);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadMarkdownButton, {
									title,
									type: "prompt",
									description: shortDescription,
									tags,
									content,
									size: "sm",
									variant: "outline"
								}),
								prompt?.is_public ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: `/prompts/${slug}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" }), "View Public Page"]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: handleUnpublish,
									disabled: isSaving,
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4" }), "Unpublish"]
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: () => setShowPublishModal(true),
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4" }), "Publish"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									className: "gap-2",
									onClick: () => setShowVersionPanel(true),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4" }), "Version History"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "icon",
									onClick: () => setShowVersionDrawer(true),
									"aria-label": "Prompt details",
									title: "Prompt details",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-4 w-4" })
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
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveStateBadge, {
									isDirty,
									isSaving,
									savedAt,
									className: "mr-1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleSaveChanges,
									disabled: isSaving || isSavingVersion,
									className: "gap-2",
									title: "Save (⌘S / Ctrl+S)",
									children: [isSaving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Save Changes"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleSaveAsNewVersion,
									disabled: isSaving || isSavingVersion,
									variant: "secondary",
									className: "gap-2",
									children: [isSavingVersion ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, { className: "h-4 w-4" }), "Save as New Version"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "destructive",
										size: "icon",
										disabled: isDeleting,
										"aria-label": "Delete prompt",
										children: isDeleting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this prompt?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This action cannot be undone. Deleting this prompt will also remove:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "list-disc pl-5 text-sm text-muted-foreground space-y-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All saved versions and version history" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All comments, reviews and ratings" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Any edit suggestions submitted by others" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "References from collections it belongs to" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Synced copies in connected GitHub repositories and Menerio" })
											]
										})]
									})
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
									onClick: handleDelete,
									className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
									children: "Delete"
								})] })] })] })
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 min-w-0 space-y-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-border bg-card p-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "mb-6 text-xl font-semibold text-foreground",
											children: "Edit Prompt"
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
												prompt && user && (prompt.author_id === user.id || isAdmin) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlugEditor, {
													promptId: prompt.id,
													currentSlug: prompt.slug,
													userId: user.id,
													onSlugChanged: (newSlug) => {
														setPrompt((prev) => prev ? {
															...prev,
															slug: newSlug
														} : null);
														window.history.replaceState(null, "", `/library/${newSlug}/edit`);
													}
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
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "changeNotes",
															children: "Change Notes (for new version)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
															id: "changeNotes",
															value: changeNotes,
															onChange: (e) => setChangeNotes(e.target.value),
															placeholder: "Optional: Describe what changed in this version",
															rows: 2
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground",
															children: "These notes will be saved when you click \"Save as New Version\""
														})
													]
												})
											]
										})]
									})
								})
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublishPromptModal, {
				open: showPublishModal,
				onOpenChange: setShowPublishModal,
				onPublish: handlePublish,
				isPublishing
			}),
			promptId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionHistoryPanel, {
				open: showVersionPanel,
				onOpenChange: setShowVersionPanel,
				promptId,
				currentPrompt: {
					id: promptId,
					title,
					description: shortDescription,
					content,
					tags: tags.length > 0 ? tags : null
				},
				onRestoreComplete: handleRestoreComplete
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: showVersionDrawer,
				onOpenChange: setShowVersionDrawer,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					className: "w-full sm:max-w-md p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
						className: "px-4 py-4 border-b border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-5 w-5 text-primary" }), "Prompt Details"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
						defaultValue: "details",
						className: "h-[calc(100vh-80px)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "details",
							className: "mt-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-5 w-5 text-muted-foreground mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-foreground",
											children: "Created"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: prompt?.created_at ? format(new Date(prompt.created_at), "MMM d, yyyy 'at' h:mm a") : "—"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-5 w-5 text-muted-foreground mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-foreground",
											children: "Last Updated"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: prompt?.updated_at ? format(new Date(prompt.updated_at), "MMM d, yyyy 'at' h:mm a") : "—"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "h-5 w-5 text-muted-foreground mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-foreground",
											children: "Version Count"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-muted-foreground",
											children: [
												versions.length,
												" version",
												versions.length !== 1 ? "s" : ""
											]
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-5 w-5 text-muted-foreground mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-foreground",
											children: "Visibility"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: isPublic ? "Public" : "Private"
										})] })]
									})
								]
							})
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModerationBlockDialog, {
				open: !!moderationBlock,
				onClose: () => setModerationBlock(null),
				category: moderationBlock?.category,
				supportHint: moderationBlock?.support_hint
			})
		]
	});
}
//#endregion
export { LibraryPromptEdit as t };
