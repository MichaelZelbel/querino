import { o as __toESM } from "./_runtime.mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Input } from "./_ssr/input-DZABqqwC.mjs";
import { t as Label } from "./_ssr/label-DBD1bRRP.mjs";
import { t as Textarea } from "./_ssr/textarea-C03-A3RU.mjs";
import { t as Switch } from "./_ssr/switch-BXNTxolN.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { Nn as Bot, P as Sparkles, Pt as History, V as Save, Vn as ArrowLeft, b as Trash2, et as Pencil, gt as LoaderCircle, kn as Check, n as X, v as TriangleAlert, vt as ListTree, xt as Link } from "./_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./_ssr/select-Byrv14ho.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./_ssr/alert-dialog-Dt930TVg.mjs";
import { n as categoryOptions } from "./_ssr/prompt-C3zowaN0.mjs";
import { a as SheetTrigger, i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./_ssr/sheet-CmQHWRHQ.mjs";
import { n as deterministicSessionId, o as useIsMobile, t as LanguageSelect } from "./_ssr/use-mobile-BpJyCOKD.mjs";
import { n as useUnsavedChanges, t as SaveStateBadge } from "./_ssr/SaveStateBadge-xDjAgC9q.mjs";
import { t as ArtifactCoachPanel } from "./_ssr/ArtifactCoachPanel-BP0dO9xb.mjs";
import { t as useAICreditsGate } from "./_ssr/useAICreditsGate-CWqt47PK.mjs";
import { n as AlertDescription, t as Alert } from "./_ssr/alert-DeotHHTZ.mjs";
import { r as parsePromptKitItems } from "./_ssr/promptKitParser-zZSbXXfv.mjs";
import { t as generateSlug } from "./_ssr/useGenerateSlug-CCE44gEG.mjs";
import { t as PromptKitRichEditor } from "./_ssr/PromptKitRichEditor-9hiI-Ltw.mjs";
import { t as PromptKitVersionHistoryPanel } from "./_ssr/PromptKitVersionHistoryPanel-opkWA9PL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.edit-BEY6KnAw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useUpdatePromptKitSlug() {
	const [updating, setUpdating] = (0, import_react.useState)(false);
	const updateSlug = async (promptKitId, newSlug, userId) => {
		setUpdating(true);
		try {
			const { data, error } = await supabase.rpc("update_prompt_kit_slug", {
				p_prompt_kit_id: promptKitId,
				p_new_slug: newSlug,
				p_user_id: userId
			});
			if (error) throw error;
			return data;
		} catch (err) {
			console.error("Error updating prompt kit slug:", err);
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
function PromptKitSlugEditor({ promptKitId, currentSlug, userId, onSlugChanged }) {
	const [isEditing, setIsEditing] = (0, import_react.useState)(false);
	const [slugInput, setSlugInput] = (0, import_react.useState)(currentSlug);
	const [error, setError] = (0, import_react.useState)(null);
	const { updateSlug, updating } = useUpdatePromptKitSlug();
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
		const result = await updateSlug(promptKitId, transliterated, userId);
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
										children: "/prompt-kits/"
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
										placeholder: "my-prompt-kit-slug",
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
						children: "/prompt-kits/"
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
				children: "The slug is the URL-friendly identifier for this prompt kit. It won't change when you edit the title."
			})
		]
	});
}
function PromptKitEdit() {
	const { slug } = useParams$1();
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuthContext();
	const { currentWorkspace } = useWorkspace();
	const isMobile = useIsMobile();
	const { checkCredits } = useAICreditsGate();
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [isDeleting, setIsDeleting] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [kit, setKit] = (0, import_react.useState)(null);
	const [versionHistoryOpen, setVersionHistoryOpen] = (0, import_react.useState)(false);
	const [currentSlug, setCurrentSlug] = (0, import_react.useState)("");
	const [showCoachSheet, setShowCoachSheet] = (0, import_react.useState)(false);
	const [previousContent, setPreviousContent] = (0, import_react.useState)(null);
	const [isGeneratingMetadata, setIsGeneratingMetadata] = (0, import_react.useState)(false);
	const [metadataError, setMetadataError] = (0, import_react.useState)(null);
	const [formData, setFormData] = (0, import_react.useState)({
		title: "",
		description: "",
		content: "",
		category: "",
		tags: [],
		isPublic: false,
		language: "en"
	});
	const [tagInput, setTagInput] = (0, import_react.useState)("");
	const kitId = kit?.id;
	const items = parsePromptKitItems(formData.content);
	const { isDirty, savedAt, markSaved } = useUnsavedChanges({
		data: formData,
		isSaving: isSubmitting,
		onSave: () => handleSave()
	});
	const coachSessionId = kitId && user ? deterministicSessionId(currentWorkspace ?? "personal", user.id, kitId) : "draft";
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate(`/auth?redirect=/prompt-kits/${slug}/edit`, { replace: true });
	}, [
		user,
		authLoading,
		navigate,
		slug
	]);
	(0, import_react.useEffect)(() => {
		async function fetchKit() {
			if (!slug || !user) return;
			try {
				const { data, error } = await supabase.from("prompt_kits").select("*").eq("slug", slug).maybeSingle();
				if (error || !data) {
					toast.error("Prompt kit not found");
					navigate("/library");
					return;
				}
				if (data.author_id !== user.id) {
					toast.error("You don't have permission to edit this kit");
					navigate("/library");
					return;
				}
				setKit(data);
				setCurrentSlug(data.slug);
				setFormData({
					title: data.title,
					description: data.description || "",
					content: data.content || "",
					category: data.category || "",
					tags: data.tags || [],
					isPublic: data.published ?? false,
					language: data.language || "en"
				});
				markSaved();
			} catch (err) {
				console.error(err);
				toast.error("Failed to load prompt kit");
				navigate("/library");
			} finally {
				setLoading(false);
			}
		}
		if (user) fetchKit();
	}, [
		slug,
		user,
		navigate
	]);
	const normalizeTag = (tag) => tag.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
	const handleAddTag = (e) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const normalized = normalizeTag(tagInput);
			if (normalized && !formData.tags.includes(normalized)) setFormData({
				...formData,
				tags: [...formData.tags, normalized]
			});
			setTagInput("");
		}
	};
	const handleRemoveTag = (t) => setFormData({
		...formData,
		tags: formData.tags.filter((x) => x !== t)
	});
	const handleApplyAIContent = (content) => {
		setPreviousContent(formData.content);
		setFormData((f) => ({
			...f,
			content
		}));
	};
	const handleUndoAI = () => {
		if (previousContent !== null) {
			setFormData((f) => ({
				...f,
				content: previousContent
			}));
			setPreviousContent(null);
			toast.success("Reverted last AI change");
		}
	};
	const handleSuggestMetadata = async () => {
		if (!checkCredits()) return;
		if (!formData.content.trim()) {
			setMetadataError("Please add some kit content first.");
			return;
		}
		setIsGeneratingMetadata(true);
		setMetadataError(null);
		try {
			const { data: result, error } = await supabase.functions.invoke("suggest-promptkit-metadata", { body: {
				kit_content: formData.content.trim(),
				user_id: user?.id
			} });
			if (error) throw new Error("Failed to generate suggestions");
			const data = result?.output || result;
			if (data?.title) setFormData((prev) => ({
				...prev,
				title: data.title
			}));
			if (data?.description) setFormData((prev) => ({
				...prev,
				description: data.description
			}));
			if (data?.category) {
				const matched = categoryOptions.find((c) => c.id.toLowerCase() === String(data.category).toLowerCase());
				if (matched) setFormData((prev) => ({
					...prev,
					category: matched.id
				}));
			}
			if (data?.tags && Array.isArray(data.tags)) {
				const newTags = data.tags.map((t) => normalizeTag(t)).filter(Boolean).slice(0, 10);
				setFormData((prev) => ({
					...prev,
					tags: newTags
				}));
			}
		} catch {
			setMetadataError("Could not generate suggestions. Please try again.");
		} finally {
			setIsGeneratingMetadata(false);
		}
	};
	const handleSave = async () => {
		if (!user || !kitId || !kit) return;
		if (!formData.title.trim()) {
			toast.error("Title is required");
			return;
		}
		if (!formData.content.trim()) {
			toast.error("Content is required");
			return;
		}
		setIsSubmitting(true);
		try {
			if (kit.title !== formData.title.trim() || (kit.description || "") !== formData.description.trim() || (kit.content || "") !== formData.content.trim() || JSON.stringify(kit.tags || []) !== JSON.stringify(formData.tags)) {
				const { data: latest } = await supabase.from("prompt_kit_versions").select("version_number").eq("prompt_kit_id", kitId).order("version_number", { ascending: false }).limit(1).maybeSingle();
				const nextVersion = (latest?.version_number ?? 0) + 1;
				await supabase.from("prompt_kit_versions").insert({
					prompt_kit_id: kitId,
					version_number: nextVersion,
					title: kit.title,
					description: kit.description,
					content: kit.content,
					tags: kit.tags,
					change_notes: null
				});
			}
			const { error } = await supabase.from("prompt_kits").update({
				title: formData.title.trim(),
				description: formData.description.trim() || null,
				content: formData.content.trim(),
				category: formData.category || null,
				tags: formData.tags.length > 0 ? formData.tags : null,
				published: formData.isPublic,
				language: formData.language
			}).eq("id", kitId);
			if (error) {
				toast.error("Failed to save prompt kit");
				return;
			}
			setKit({
				...kit,
				title: formData.title.trim(),
				description: formData.description.trim() || null,
				content: formData.content.trim(),
				category: formData.category || null,
				tags: formData.tags.length > 0 ? formData.tags : null,
				published: formData.isPublic,
				language: formData.language
			});
			markSaved();
			toast.success("Changes saved!");
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleDelete = async () => {
		if (!kitId) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase.from("prompt_kits").delete().eq("id", kitId);
			if (error) throw error;
			toast.success("Prompt kit deleted");
			navigate("/library");
		} catch {
			toast.error("Failed to delete prompt kit");
		} finally {
			setIsDeleting(false);
		}
	};
	if (authLoading || loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user || !kit) return null;
	const coachPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtifactCoachPanel, {
		artifactType: "prompt_kit",
		artifactId: kitId,
		canvasContent: formData.content,
		onApplyContent: handleApplyAIContent,
		onUndo: handleUndoAI,
		canUndo: previousContent !== null,
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
							children: [
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
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Prompt Kit Coach" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full",
											children: coachPanel
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: () => setVersionHistoryOpen(true),
									className: "gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4" }), "History"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveStateBadge, {
									isDirty,
									isSaving: isSubmitting,
									savedAt,
									className: "mr-1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleSave,
									disabled: isSubmitting,
									className: "gap-2",
									title: "Save (⌘S / Ctrl+S)",
									children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Save Changes"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "destructive",
										size: "icon",
										disabled: isDeleting,
										"aria-label": "Delete prompt kit",
										children: isDeleting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this prompt kit?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This action cannot be undone. Deleting this prompt kit will also remove:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
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
							className: "flex-1 min-w-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border bg-card p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mb-6 text-xl font-semibold text-foreground",
									children: "Edit Prompt Kit"
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
														"Use the",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium text-foreground",
															children: "Insert prompt"
														}),
														" ",
														"button to add copyable prompt blocks. Free text between blocks becomes intro and between-prompt commentary."
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitRichEditor, {
													value: formData.content,
													onChange: (v) => setFormData({
														...formData,
														content: v
													})
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
												disabled: isGeneratingMetadata || !formData.content.trim(),
												className: "gap-1.5",
												children: isGeneratingMetadata ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), "Generating…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), "Suggest title, description, category & tags"] })
											}), metadataError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-destructive",
												children: metadataError
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "title",
												children: "Title *"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "title",
												value: formData.title,
												onChange: (e) => setFormData({
													...formData,
													title: e.target.value
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "description",
												children: "Description"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												id: "description",
												value: formData.description,
												onChange: (e) => setFormData({
													...formData,
													description: e.target.value
												}),
												rows: 2
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "category",
												children: "Category"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: formData.category,
												onValueChange: (v) => setFormData({
													...formData,
													category: v
												}),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a category" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categoryOptions.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: c.id,
													children: c.label
												}, c.id)) })]
											})]
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
												formData.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-wrap gap-2 mt-2",
													children: formData.tags.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
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
											value: formData.language,
											onChange: (v) => setFormData({
												...formData,
												language: v
											})
										}),
										currentSlug && user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitSlugEditor, {
											promptKitId: kitId,
											currentSlug,
											userId: user.id,
											onSlugChanged: (s) => {
												setCurrentSlug(s);
												navigate(`/prompt-kits/${s}/edit`, { replace: true });
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "visibility",
												className: "text-base",
												children: "Make this kit public"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: formData.isPublic ? "Anyone can discover and use this kit" : "Only you can see this kit"
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												id: "visibility",
												checked: formData.isPublic,
												onCheckedChange: (v) => setFormData({
													...formData,
													isPublic: v
												})
											})]
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
								}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "No prompts detected yet."
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			kitId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptKitVersionHistoryPanel, {
				open: versionHistoryOpen,
				onOpenChange: setVersionHistoryOpen,
				promptKitId: kitId,
				currentKit: {
					id: kitId,
					title: formData.title,
					description: formData.description,
					content: formData.content,
					tags: formData.tags
				},
				onRestoreComplete: () => window.location.reload()
			})
		]
	});
}
var SplitComponent = PromptKitEdit;
//#endregion
export { SplitComponent as component };
