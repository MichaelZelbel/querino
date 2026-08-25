import { a as __toESM } from "./_runtime.mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Input } from "./_ssr/input-DZABqqwC.mjs";
import { t as Label } from "./_ssr/label-DBD1bRRP.mjs";
import { t as Textarea } from "./_ssr/textarea-C03-A3RU.mjs";
import { t as Switch } from "./_ssr/switch-BXNTxolN.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { $t as FileText, Jt as GitBranch, Nn as Bot, P as Sparkles, Pt as History, V as Save, Vn as ArrowLeft, b as Trash2, gt as LoaderCircle, n as X } from "./_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./_ssr/select-Byrv14ho.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./_ssr/alert-dialog-Dt930TVg.mjs";
import { t as moderateContent } from "./_ssr/moderateContent-Dd1HYPU1.mjs";
import { n as categoryOptions } from "./_ssr/prompt-C3zowaN0.mjs";
import { n as ModerationBlockDialog, t as LineNumberedEditor } from "./_ssr/ModerationBlockDialog-DCe6GfCj.mjs";
import { a as SheetTrigger, i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./_ssr/sheet-CmQHWRHQ.mjs";
import { t as VersionHistoryPanel } from "./_ssr/VersionHistoryPanel-Ba812uju.mjs";
import { t as DownloadMarkdownButton } from "./_ssr/DownloadMarkdownButton-DBKsRp2M.mjs";
import { t as ImportMarkdownButton } from "./_ssr/ImportMarkdownButton-D1LM1233.mjs";
import { n as deterministicSessionId, o as useIsMobile, t as LanguageSelect } from "./_ssr/use-mobile-BpJyCOKD.mjs";
import { n as useUnsavedChanges, t as SaveStateBadge } from "./_ssr/SaveStateBadge-xDjAgC9q.mjs";
import { t as ArtifactCoachPanel } from "./_ssr/ArtifactCoachPanel-BP0dO9xb.mjs";
import { t as useAICreditsGate } from "./_ssr/useAICreditsGate-CWqt47PK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.edit-BCNHK8Mg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WORKFLOW_VERSIONS_CONFIG = {
	versionsTable: "workflow_versions",
	idColumn: "workflow_id",
	artifactTable: "workflows"
};
function WorkflowEdit() {
	const { slug } = useParams$1();
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuthContext();
	const { checkCredits } = useAICreditsGate();
	const { currentWorkspace } = useWorkspace();
	const isMobile = useIsMobile();
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [isSavingVersion, setIsSavingVersion] = (0, import_react.useState)(false);
	const [isDeleting, setIsDeleting] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [workflow, setWorkflow] = (0, import_react.useState)(null);
	const [showCoachSheet, setShowCoachSheet] = (0, import_react.useState)(false);
	const [showVersionPanel, setShowVersionPanel] = (0, import_react.useState)(false);
	const [changeNotes, setChangeNotes] = (0, import_react.useState)("");
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
	const [moderationBlock, setModerationBlock] = (0, import_react.useState)(null);
	const workflowId = workflow?.id;
	const { isDirty, savedAt, markSaved } = useUnsavedChanges({
		data: formData,
		isSaving: isSubmitting,
		onSave: () => handleSaveChanges()
	});
	const coachSessionId = workflowId && user ? deterministicSessionId(currentWorkspace ?? "personal", user.id, workflowId) : "draft";
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate(`/auth?redirect=/workflows/${slug}/edit`, { replace: true });
	}, [
		user,
		authLoading,
		navigate,
		slug
	]);
	(0, import_react.useEffect)(() => {
		async function fetchWorkflow() {
			if (!slug || !user) return;
			try {
				const { data, error } = await supabase.from("workflows").select("*").eq("slug", slug).maybeSingle();
				if (error || !data) {
					toast.error("Workflow not found");
					navigate("/library");
					return;
				}
				if (data.author_id !== user.id) {
					toast.error("You don't have permission to edit this workflow");
					navigate("/library");
					return;
				}
				setWorkflow(data);
				let workflowContent = data.content || "";
				if (!workflowContent && data.json) workflowContent = typeof data.json === "string" ? data.json : JSON.stringify(data.json, null, 2);
				setFormData({
					title: data.title,
					description: data.description || "",
					content: workflowContent,
					category: data.category || "",
					tags: data.tags || [],
					isPublic: data.published ?? false,
					language: data.language || "en"
				});
				markSaved();
			} catch (err) {
				console.error("Error fetching workflow:", err);
				toast.error("Failed to load workflow");
				navigate("/library");
			} finally {
				setLoading(false);
			}
		}
		if (user) fetchWorkflow();
	}, [
		slug,
		user,
		navigate
	]);
	const handleApplyAIContent = (newContent) => {
		setPreviousContent(formData.content);
		setFormData((prev) => ({
			...prev,
			content: newContent
		}));
	};
	const handleUndoAI = () => {
		if (previousContent !== null) {
			setFormData((prev) => ({
				...prev,
				content: previousContent
			}));
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
			if (normalized && !formData.tags.includes(normalized)) setFormData({
				...formData,
				tags: [...formData.tags, normalized]
			});
			setTagInput("");
		}
	};
	const handleRemoveTag = (tagToRemove) => {
		setFormData({
			...formData,
			tags: formData.tags.filter((t) => t !== tagToRemove)
		});
	};
	const handleSuggestMetadata = async () => {
		if (!checkCredits()) return;
		if (!formData.content.trim()) {
			setMetadataError("Please add some workflow content first.");
			return;
		}
		setIsGeneratingMetadata(true);
		setMetadataError(null);
		try {
			const { data: result, error } = await supabase.functions.invoke("suggest-workflow-metadata", { body: {
				workflow_content: formData.content.trim(),
				user_id: user?.id
			} });
			if (error) throw new Error("Failed to generate suggestions");
			const data = result.output || result;
			if (data.title) setFormData((prev) => ({
				...prev,
				title: data.title
			}));
			if (data.description) setFormData((prev) => ({
				...prev,
				description: data.description
			}));
			if (data.category) {
				const matched = categoryOptions.find((c) => c.id.toLowerCase() === data.category.toLowerCase());
				if (matched) setFormData((prev) => ({
					...prev,
					category: matched.id
				}));
			}
			if (data.tags && Array.isArray(data.tags)) {
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
	const handleSaveChanges = async () => {
		if (!user || !workflowId) return;
		if (!formData.title.trim()) {
			toast.error("Title is required");
			return;
		}
		if (!formData.content.trim()) {
			toast.error("Workflow content is required");
			return;
		}
		if (formData.isPublic) {
			const result = await moderateContent({
				title: formData.title,
				description: formData.description,
				content: formData.content
			}, "edit_public", "workflow", workflowId);
			if (!result.approved) {
				setModerationBlock(result);
				return;
			}
		}
		setIsSubmitting(true);
		try {
			const { error } = await supabase.from("workflows").update({
				title: formData.title.trim(),
				description: formData.description.trim() || null,
				content: formData.content.trim(),
				category: formData.category || null,
				tags: formData.tags.length > 0 ? formData.tags : null,
				published: formData.isPublic,
				language: formData.language
			}).eq("id", workflowId);
			if (error) {
				toast.error("Failed to update workflow");
				return;
			}
			markSaved();
			toast.success("Changes saved!");
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleSaveAsNewVersion = async () => {
		if (!user || !workflowId) return;
		if (!formData.title.trim()) {
			toast.error("Title is required");
			return;
		}
		if (!formData.content.trim()) {
			toast.error("Workflow content is required");
			return;
		}
		if (formData.isPublic) {
			const result = await moderateContent({
				title: formData.title,
				description: formData.description,
				content: formData.content
			}, "edit_public", "workflow", workflowId);
			if (!result.approved) {
				setModerationBlock(result);
				return;
			}
		}
		setIsSavingVersion(true);
		try {
			const { data: latest } = await supabase.from("workflow_versions").select("version_number").eq("workflow_id", workflowId).order("version_number", { ascending: false }).limit(1).maybeSingle();
			const nextVersionNumber = (latest?.version_number ?? 0) + 1;
			const { error: versionError } = await supabase.from("workflow_versions").insert({
				workflow_id: workflowId,
				version_number: nextVersionNumber,
				title: formData.title.trim(),
				description: formData.description.trim() || null,
				content: formData.content.trim(),
				tags: formData.tags.length > 0 ? formData.tags : null,
				change_notes: changeNotes.trim() || null
			});
			if (versionError) {
				console.error("Error creating workflow version:", versionError);
				toast.error("Failed to create new version");
				return;
			}
			const { error: updateError } = await supabase.from("workflows").update({
				title: formData.title.trim(),
				description: formData.description.trim() || null,
				content: formData.content.trim(),
				category: formData.category || null,
				tags: formData.tags.length > 0 ? formData.tags : null,
				published: formData.isPublic,
				language: formData.language
			}).eq("id", workflowId);
			if (updateError) {
				toast.error("Version created but failed to update workflow");
				return;
			}
			setChangeNotes("");
			markSaved();
			toast.success(`Version ${nextVersionNumber} created!`);
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSavingVersion(false);
		}
	};
	const handleRestoreComplete = async () => {
		if (!workflowId) return;
		const { data } = await supabase.from("workflows").select("*").eq("id", workflowId).maybeSingle();
		if (data) {
			setWorkflow(data);
			let workflowContent = data.content || "";
			if (!workflowContent && data.json) workflowContent = typeof data.json === "string" ? data.json : JSON.stringify(data.json, null, 2);
			setFormData({
				title: data.title,
				description: data.description || "",
				content: workflowContent,
				category: data.category || "",
				tags: data.tags || [],
				isPublic: data.published ?? false,
				language: data.language || "en"
			});
			markSaved();
		}
	};
	const handleDelete = async () => {
		if (!workflowId) return;
		setIsDeleting(true);
		try {
			const { error } = await supabase.from("workflows").delete().eq("id", workflowId);
			if (error) throw error;
			toast.success("Workflow deleted");
			navigate("/library");
		} catch {
			toast.error("Failed to delete workflow");
		} finally {
			setIsDeleting(false);
		}
	};
	const handleImportMarkdown = (data) => {
		setFormData({
			title: data.frontmatter.title || formData.title,
			description: data.frontmatter.description || "",
			content: data.content,
			category: formData.category,
			tags: data.frontmatter.tags || [],
			isPublic: formData.isPublic,
			language: formData.language
		});
	};
	if (authLoading || loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user || !workflow) return null;
	const coachPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtifactCoachPanel, {
		artifactType: "workflow",
		artifactId: workflowId,
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
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportMarkdownButton, {
									type: "workflow",
									size: "sm",
									variant: "outline",
									label: "Import .md",
									onImport: handleImportMarkdown,
									isEditorMode: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadMarkdownButton, {
									title: formData.title || "Untitled Workflow",
									type: "workflow",
									description: formData.description,
									tags: formData.tags,
									content: formData.content,
									size: "sm",
									variant: "outline"
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
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Workflow Coach" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full",
											children: coachPanel
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveStateBadge, {
									isDirty,
									isSaving: isSubmitting,
									savedAt,
									className: "mr-1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleSaveChanges,
									disabled: isSubmitting || isSavingVersion,
									className: "gap-2",
									title: "Save (⌘S / Ctrl+S)",
									children: [isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Save Changes"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleSaveAsNewVersion,
									disabled: isSubmitting || isSavingVersion,
									variant: "secondary",
									className: "gap-2",
									children: [isSavingVersion ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, { className: "h-4 w-4" }), "Save as New Version"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									className: "gap-2",
									onClick: () => setShowVersionPanel(true),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4" }), "Version History"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "destructive",
										size: "icon",
										disabled: isDeleting,
										"aria-label": "Delete workflow",
										children: isDeleting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete this workflow?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This action cannot be undone. Deleting this workflow will also remove:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
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
									children: "Edit Workflow"
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
													value: formData.content,
													onChange: (val) => setFormData({
														...formData,
														content: val
													}),
													placeholder: `# My Workflow\n\n## Description\nDescribe what this workflow does...\n\n## Steps\n1. First step...\n2. Second step...`
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
												}),
												placeholder: "e.g., Code Review Workflow"
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
												placeholder: "Brief description of what this workflow does...",
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
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a category" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categoryOptions.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: cat.id,
													children: cat.label
												}, cat.id)) })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageSelect, {
											value: formData.language,
											onChange: (v) => setFormData({
												...formData,
												language: v
											})
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
												formData.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-wrap gap-2 mt-2",
													children: formData.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
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
											value: formData.language,
											onChange: (v) => setFormData({
												...formData,
												language: v
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "visibility",
												className: "text-base",
												children: "Make this workflow public"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: formData.isPublic ? "Anyone can discover and use this workflow" : "Only you can see this workflow"
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												id: "visibility",
												checked: formData.isPublic,
												onCheckedChange: (checked) => setFormData({
													...formData,
													isPublic: checked
												})
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
			}),
			workflowId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionHistoryPanel, {
				open: showVersionPanel,
				onOpenChange: setShowVersionPanel,
				promptId: workflowId,
				currentPrompt: {
					id: workflowId,
					title: formData.title,
					description: formData.description,
					content: formData.content,
					tags: formData.tags.length > 0 ? formData.tags : null
				},
				onRestoreComplete: handleRestoreComplete,
				tableConfig: WORKFLOW_VERSIONS_CONFIG
			})
		]
	});
}
var SplitComponent = WorkflowEdit;
//#endregion
export { SplitComponent as component };
