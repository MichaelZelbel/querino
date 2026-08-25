import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as CardContent, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { At as Info, Dn as ChevronLeft, En as ChevronRight, Et as Languages, Gt as GitPullRequest, Hn as Activity, J as Plus, M as Star, P as Sparkles, W as RefreshCw, Yt as Folder, _n as CloudUpload, a as Users, b as Trash2, en as Eye, gt as LoaderCircle, ht as Lock, kn as Check, lt as MessageSquare, n as X, nn as ExternalLink, on as Crown, s as User, tt as Pen, wn as CircleAlert } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, i as useAuth, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { a as TooltipProvider, h as useWorkspace, i as TooltipContent, o as TooltipTrigger, r as Tooltip } from "./Footer-ClUC5jzd.mjs";
import { n as format, t as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { n as useActivityEvents, t as ActivityTimeline } from "./ActivityTimeline-DTJ1Wotr.mjs";
import { t as Checkbox } from "./checkbox-B00mezr5.mjs";
import { t as Markdown } from "../_libs/react-markdown+[...].mjs";
import { t as ScrollArea } from "./scroll-area-D0AShDWm.mjs";
import { a as useCreateCollection, i as useCollections, t as useAddToCollection } from "./useCollections-BePFdUZR.mjs";
import { t as CommentsSection } from "./CommentsSection-BGZ8JMz4.mjs";
import { t as LANGUAGES } from "./languages-CEVYo2p3.mjs";
import { t as getFunctionErrorMessage } from "./functionError-BowYYo7v.mjs";
import { t as useAICreditsGate } from "./useAICreditsGate-CWqt47PK.mjs";
import { t as generateSlug } from "./useGenerateSlug-CCE44gEG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/MenerioSyncButton-Bizux33R.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** True when a `:slug` route param is actually a legacy UUID id. */
function isUuid(value) {
	return !!value && UUID_RE.test(value);
}
/**
* Legacy /<route>/<uuid> URLs are still indexed by Google from before slugs
* existed. Detail pages look artifacts up by slug only, so those URLs render
* the not-found branch and Google reports them as Soft 404. Resolve the id to
* its current slug and redirect instead.
*
* Returns the canonical slug, or null when the artifact is gone / has no slug.
*/
async function resolveSlugFromId(table, id) {
	const { data } = await supabase.from(table).select("slug").eq("id", id).maybeSingle();
	return data?.slug ?? null;
}
/**
* Shared copy-to-team hook. The four per-type hooks differed only in table
* name and insert-field mapping; they now delegate here.
*/
function createCopyToTeamHook(config) {
	return function useCopyArtifactToTeam() {
		const [copying, setCopying] = (0, import_react.useState)(false);
		const copyToTeam = async (source, teamId, teamName, userId, options = { includeMetadata: true }) => {
			setCopying(true);
			try {
				const insertData = {
					...config.buildInsert(source, options.includeMetadata !== false),
					author_id: userId,
					team_id: teamId
				};
				const { data, error } = await supabase.from(config.table).insert(insertData).select("id, slug").single();
				if (error) {
					console.error(`Error copying ${config.label} to team:`, error);
					toast.error(`Failed to copy ${config.label} to team`);
					return null;
				}
				return {
					id: data.id,
					slug: data.slug,
					teamName
				};
			} catch (err) {
				console.error(`Error copying ${config.label} to team:`, err);
				toast.error(`Failed to copy ${config.label} to team`);
				return null;
			} finally {
				setCopying(false);
			}
		};
		return {
			copyToTeam,
			copying
		};
	};
}
/**
* Shared copy-to-team dialog. The four per-type modals were ~97% identical
* copies; the per-type wrappers now just bind their hook + labels.
*/
function CopyArtifactToTeamModal({ open, onOpenChange, source, label, detailPathPrefix, copyToTeam, copying }) {
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const { teams, switchWorkspace } = useWorkspace();
	const [selectedTeamId, setSelectedTeamId] = (0, import_react.useState)(teams[0]?.id || "");
	const [includeMetadata, setIncludeMetadata] = (0, import_react.useState)(true);
	const [copiedResult, setCopiedResult] = (0, import_react.useState)(null);
	const selectedTeam = teams.find((t) => t.id === selectedTeamId);
	const handleCopy = async () => {
		if (!user || !selectedTeamId || !selectedTeam) return;
		const result = await copyToTeam(source, selectedTeamId, selectedTeam.name, user.id, { includeMetadata });
		if (result) {
			setCopiedResult({
				slug: result.slug,
				teamName: result.teamName,
				teamId: selectedTeamId
			});
			toast.success(`Copied to ${result.teamName}`);
		}
	};
	const handleOpenInTeam = () => {
		if (!copiedResult) return;
		switchWorkspace(copiedResult.teamId);
		navigate(`${detailPathPrefix}/${copiedResult.slug}`);
		onOpenChange(false);
		setCopiedResult(null);
	};
	const handleClose = () => {
		onOpenChange(false);
		setCopiedResult(null);
	};
	if (copiedResult) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: handleClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5 text-primary" }), "Copied Successfully"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
				"Your ",
				label,
				" has been copied to",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: copiedResult.teamName }),
				"."
			] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
				className: "flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: handleClose,
					children: "Done"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: handleOpenInTeam,
					className: "gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" }), "Open in team workspace"]
				})]
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: handleClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5 text-primary" }), "Copy to team"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					"Create a copy of \"",
					source.title,
					"\" in a team workspace."
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "team-select",
								children: "Team"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: selectedTeamId,
								onValueChange: setSelectedTeamId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "team-select",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select a team" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: teams.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: team.id,
									children: team.name
								}, team.id)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center space-x-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
								id: "include-metadata",
								checked: includeMetadata,
								onCheckedChange: (checked) => setIncludeMetadata(checked === true)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "include-metadata",
								className: "text-sm font-normal",
								children: "Include current tags, category, and description"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 h-4 w-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "This creates a copy. Future edits won't sync automatically between the original and the team copy." })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: handleClose,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleCopy,
					disabled: copying || !selectedTeamId,
					children: copying ? "Copying..." : "Create team copy"
				})] })
			]
		})
	});
}
var useSuggestions = (itemType, itemId) => {
	const { user } = useAuth();
	const [suggestions, setSuggestions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const fetchSuggestions = (0, import_react.useCallback)(async () => {
		if (!itemId) return;
		setLoading(true);
		setError(null);
		try {
			const { data, error: fetchError } = await supabase.from("suggestions").select(`
          *,
          author:profiles!suggestions_author_id_fkey(id, display_name, avatar_url),
          reviewer:profiles!suggestions_reviewer_id_fkey(id, display_name, avatar_url)
        `).eq("item_type", itemType).eq("item_id", itemId).order("created_at", { ascending: false });
			if (fetchError) throw fetchError;
			setSuggestions(data || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [itemType, itemId]);
	(0, import_react.useEffect)(() => {
		fetchSuggestions();
	}, [fetchSuggestions]);
	const createSuggestion = async (data) => {
		if (!user) throw new Error("Must be logged in to suggest edits");
		const { data: suggestion, error: createError } = await supabase.from("suggestions").insert({
			item_type: itemType,
			item_id: itemId,
			author_id: user.id,
			title: data.title || null,
			description: data.description || null,
			content: data.content,
			status: "open"
		}).select().single();
		if (createError) throw createError;
		await supabase.from("activity_events").insert({
			actor_id: user.id,
			action: "suggestion_created",
			item_type: itemType,
			item_id: itemId,
			metadata: { suggestionId: suggestion.id }
		});
		await fetchSuggestions();
		return suggestion;
	};
	const reviewSuggestion = async (suggestionId, status, reviewComment) => {
		if (!user) throw new Error("Must be logged in to review");
		const { error: updateError } = await supabase.from("suggestions").update({
			status,
			reviewer_id: user.id,
			review_comment: reviewComment || null,
			requested_changes: null
		}).eq("id", suggestionId);
		if (updateError) throw updateError;
		await supabase.from("activity_events").insert({
			actor_id: user.id,
			action: status === "accepted" ? "suggestion_accepted" : "suggestion_rejected",
			item_type: itemType,
			item_id: itemId,
			metadata: { suggestionId }
		});
		await fetchSuggestions();
	};
	const requestChanges = async (suggestionId, requestedChanges, reviewComment) => {
		if (!user) throw new Error("Must be logged in to request changes");
		const { error: updateError } = await supabase.from("suggestions").update({
			status: "changes_requested",
			reviewer_id: user.id,
			review_comment: reviewComment || null,
			requested_changes: requestedChanges
		}).eq("id", suggestionId);
		if (updateError) throw updateError;
		await supabase.from("activity_events").insert({
			actor_id: user.id,
			action: "suggestion_changes_requested",
			item_type: itemType,
			item_id: itemId,
			metadata: {
				suggestionId,
				requestedChanges
			}
		});
		if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("changes-requested", { detail: { suggestionId } }));
		await fetchSuggestions();
	};
	const updateSuggestionAfterChanges = async (suggestionId, data) => {
		if (!user) throw new Error("Must be logged in to update suggestion");
		const { error: updateError } = await supabase.from("suggestions").update({
			title: data.title || null,
			description: data.description || null,
			content: data.content,
			status: "open",
			reviewer_id: null,
			review_comment: null,
			requested_changes: null
		}).eq("id", suggestionId).eq("author_id", user.id);
		if (updateError) throw updateError;
		await supabase.from("activity_events").insert({
			actor_id: user.id,
			action: "suggestion_updated_after_changes_requested",
			item_type: itemType,
			item_id: itemId,
			metadata: { suggestionId }
		});
		await fetchSuggestions();
	};
	const deleteSuggestion = async (suggestionId) => {
		if (!user) throw new Error("Must be logged in to delete");
		const { error: deleteError } = await supabase.from("suggestions").delete().eq("id", suggestionId).eq("author_id", user.id);
		if (deleteError) throw deleteError;
		await fetchSuggestions();
	};
	return {
		suggestions,
		loading,
		error,
		openCount: suggestions.filter((s) => s.status === "open").length,
		changesRequestedCount: suggestions.filter((s) => s.status === "changes_requested").length,
		createSuggestion,
		reviewSuggestion,
		requestChanges,
		updateSuggestionAfterChanges,
		deleteSuggestion,
		refetch: fetchSuggestions
	};
};
function SuggestEditModal({ open, onOpenChange, itemType, currentTitle, currentDescription, currentContent, onSubmit }) {
	const [title, setTitle] = (0, import_react.useState)(currentTitle);
	const [description, setDescription] = (0, import_react.useState)(currentDescription);
	const [content, setContent] = (0, import_react.useState)(currentContent);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const handleOpenChange = (newOpen) => {
		if (newOpen) {
			setTitle(currentTitle);
			setDescription(currentDescription);
			setContent(currentContent);
		}
		onOpenChange(newOpen);
	};
	const handleSubmit = async () => {
		if (!content.trim()) {
			toast.error("Content is required");
			return;
		}
		setIsSubmitting(true);
		try {
			await onSubmit({
				title: title !== currentTitle ? title : void 0,
				description: description !== currentDescription ? description : void 0,
				content
			});
			toast.success("Edit suggestion submitted");
			onOpenChange(false);
		} catch (err) {
			toast.error(err.message || "Failed to submit suggestion");
		} finally {
			setIsSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: handleOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitPullRequest, { className: "h-5 w-5" }),
						"Suggest Edit to",
						" ",
						itemType.charAt(0).toUpperCase() + itemType.slice(1)
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					"Propose changes to this ",
					itemType,
					". The owner will review your suggestions."
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "suggest-title",
								children: "Title"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "suggest-title",
								value: title,
								onChange: (e) => setTitle(e.target.value),
								placeholder: "Suggested title"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "suggest-description",
								children: "Description"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "suggest-description",
								value: description,
								onChange: (e) => setDescription(e.target.value),
								placeholder: "Suggested description",
								rows: 2
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "suggest-content",
								children: "Content *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "suggest-content",
								value: content,
								onChange: (e) => setContent(e.target.value),
								placeholder: "Suggested content",
								rows: 12,
								className: "font-mono text-sm"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => onOpenChange(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: handleSubmit,
					disabled: isSubmitting,
					children: [isSubmitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Submit Suggestion"]
				})] })
			]
		})
	});
}
function computeSimpleDiff(original, suggested) {
	const originalLines = original.split("\n");
	const suggestedLines = suggested.split("\n");
	const left = [];
	const right = [];
	const maxLines = Math.max(originalLines.length, suggestedLines.length);
	for (let i = 0; i < maxLines; i++) {
		const origLine = originalLines[i] ?? "";
		const suggLine = suggestedLines[i] ?? "";
		if (i >= originalLines.length) {
			left.push({
				type: "unchanged",
				content: "",
				lineNumber: i + 1
			});
			right.push({
				type: "added",
				content: suggLine,
				lineNumber: i + 1
			});
		} else if (i >= suggestedLines.length) {
			left.push({
				type: "removed",
				content: origLine,
				lineNumber: i + 1
			});
			right.push({
				type: "unchanged",
				content: "",
				lineNumber: i + 1
			});
		} else if (origLine !== suggLine) {
			left.push({
				type: "removed",
				content: origLine,
				lineNumber: i + 1
			});
			right.push({
				type: "added",
				content: suggLine,
				lineNumber: i + 1
			});
		} else {
			left.push({
				type: "unchanged",
				content: origLine,
				lineNumber: i + 1
			});
			right.push({
				type: "unchanged",
				content: suggLine,
				lineNumber: i + 1
			});
		}
	}
	return {
		left,
		right
	};
}
function SuggestionReviewModal({ open, onOpenChange, suggestion, originalTitle, originalDescription, originalContent, isOwner, onAccept, onReject, onRequestChanges }) {
	const [reviewComment, setReviewComment] = (0, import_react.useState)("");
	const [requestedChangesText, setRequestedChangesText] = (0, import_react.useState)("");
	const [isAccepting, setIsAccepting] = (0, import_react.useState)(false);
	const [isRejecting, setIsRejecting] = (0, import_react.useState)(false);
	const [isRequestingChanges, setIsRequestingChanges] = (0, import_react.useState)(false);
	const [showRequestChangesPanel, setShowRequestChangesPanel] = (0, import_react.useState)(false);
	suggestion.title;
	suggestion.description;
	const suggestedContent = suggestion.content;
	const contentDiff = computeSimpleDiff(originalContent, suggestedContent);
	const handleAccept = async () => {
		setIsAccepting(true);
		try {
			await onAccept(reviewComment || void 0);
			toast.success("Suggestion accepted and applied");
			onOpenChange(false);
		} catch (err) {
			toast.error(err.message || "Failed to accept suggestion");
		} finally {
			setIsAccepting(false);
		}
	};
	const handleReject = async () => {
		setIsRejecting(true);
		try {
			await onReject(reviewComment || void 0);
			toast.success("Suggestion rejected");
			onOpenChange(false);
		} catch (err) {
			toast.error(err.message || "Failed to reject suggestion");
		} finally {
			setIsRejecting(false);
		}
	};
	const handleRequestChanges = async () => {
		if (!requestedChangesText.trim()) {
			toast.error("Please specify what changes you would like");
			return;
		}
		setIsRequestingChanges(true);
		try {
			await onRequestChanges(requestedChangesText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0), reviewComment || void 0);
			toast.success("Changes requested");
			onOpenChange(false);
		} catch (err) {
			toast.error(err.message || "Failed to request changes");
		} finally {
			setIsRequestingChanges(false);
		}
	};
	const isProcessing = isAccepting || isRejecting || isRequestingChanges;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: isOwner ? "Review Suggestion" : "View Suggestion" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
							className: "h-5 w-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: suggestion.author?.avatar_url || "" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-3 w-3" }) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: suggestion.author?.display_name || "Anonymous" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "•"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: format(new Date(suggestion.created_at), "MMM d, yyyy")
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-hidden space-y-4",
					children: [
						(suggestion.title || suggestion.description) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 p-3 bg-muted/50 rounded-lg",
							children: [suggestion.title && suggestion.title !== originalTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground",
								children: "Title Change"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 items-center text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "line-through text-muted-foreground",
										children: originalTitle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: suggestion.title
									})
								]
							})] }), suggestion.description && suggestion.description !== originalDescription && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground",
								children: "Description Change"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "line-through text-muted-foreground",
									children: originalDescription || "(empty)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: suggestion.description
								})]
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground mb-2 block",
								children: "Content Changes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2 h-[250px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border rounded-lg overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "bg-muted px-3 py-1.5 text-xs font-medium border-b",
										children: "Original"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
										className: "h-[218px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-2 font-mono text-xs",
											children: contentDiff.left.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `px-2 py-0.5 ${line.type === "removed" ? "bg-destructive/20 text-destructive" : ""}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground mr-2 select-none w-6 inline-block",
													children: line.lineNumber
												}), line.content || " "]
											}, i))
										})
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border rounded-lg overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "bg-muted px-3 py-1.5 text-xs font-medium border-b",
										children: "Suggested"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
										className: "h-[218px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-2 font-mono text-xs",
											children: contentDiff.right.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `px-2 py-0.5 ${line.type === "added" ? "bg-green-500/20 text-green-700 dark:text-green-400" : ""}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground mr-2 select-none w-6 inline-block",
													children: line.lineNumber
												}), line.content || " "]
											}, i))
										})
									})]
								})]
							})]
						}),
						isOwner && showRequestChangesPanel && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "requested-changes",
								className: "text-sm font-medium",
								children: "Requested Changes (one per line)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "requested-changes",
								value: requestedChangesText,
								onChange: (e) => setRequestedChangesText(e.target.value),
								placeholder: "Clarify the input/output section\nAdd a role definition\nRemove redundant constraints",
								rows: 4,
								className: "font-mono text-sm"
							})]
						}),
						isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "review-comment",
								children: "Review Comment (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "review-comment",
								value: reviewComment,
								onChange: (e) => setReviewComment(e.target.value),
								placeholder: "Add a comment about your decision...",
								rows: 2
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2 flex-wrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => onOpenChange(false),
						disabled: isProcessing,
						children: isOwner ? "Cancel" : "Close"
					}), isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						!showRequestChangesPanel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => setShowRequestChangesPanel(true),
							disabled: isProcessing,
							className: "border-orange-500/50 text-orange-600 hover:bg-orange-500/10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "mr-1 h-4 w-4" }), "Request Changes"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: handleRequestChanges,
							disabled: isProcessing || !requestedChangesText.trim(),
							className: "border-orange-500/50 text-orange-600 hover:bg-orange-500/10",
							children: [
								isRequestingChanges && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "mr-1 h-4 w-4" }),
								"Submit Change Request"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "destructive",
							onClick: handleReject,
							disabled: isProcessing,
							children: [
								isRejecting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mr-1 h-4 w-4" }),
								"Reject"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: handleAccept,
							disabled: isProcessing,
							children: [
								isAccepting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mr-1 h-4 w-4" }),
								"Accept & Apply"
							]
						})
					] })]
				})
			]
		})
	});
}
function UpdateSuggestionModal({ open, onOpenChange, suggestion, onSubmit }) {
	const [title, setTitle] = (0, import_react.useState)(suggestion.title || "");
	const [description, setDescription] = (0, import_react.useState)(suggestion.description || "");
	const [content, setContent] = (0, import_react.useState)(suggestion.content);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const handleSubmit = async () => {
		if (!content.trim()) {
			toast.error("Content is required");
			return;
		}
		setIsSubmitting(true);
		try {
			await onSubmit({
				title: title.trim() || void 0,
				description: description.trim() || void 0,
				content: content.trim()
			});
			toast.success("Suggestion updated successfully");
			onOpenChange(false);
		} catch (err) {
			toast.error(err.message || "Failed to update suggestion");
		} finally {
			setIsSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-hidden flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Update Suggestion" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Revise your suggestion based on the requested changes." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-auto space-y-4",
					children: [
						suggestion.requested_changes && suggestion.requested_changes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-4 w-4 text-orange-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium text-orange-600",
										children: "Requested Changes"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "list-disc list-inside text-sm space-y-1",
									children: suggestion.requested_changes.map((change, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "text-muted-foreground",
										children: change
									}, i))
								}),
								suggestion.review_comment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted-foreground mt-2 italic",
									children: [
										"\"",
										suggestion.review_comment,
										"\""
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "title",
								children: "Title (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "title",
								value: title,
								onChange: (e) => setTitle(e.target.value),
								placeholder: "Suggested title change"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "description",
								children: "Description (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "description",
								value: description,
								onChange: (e) => setDescription(e.target.value),
								placeholder: "Suggested description change",
								rows: 2
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "content",
								children: "Content *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "content",
								value: content,
								onChange: (e) => setContent(e.target.value),
								placeholder: "Your improved suggestion...",
								rows: 12,
								className: "font-mono text-sm"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => onOpenChange(false),
						disabled: isSubmitting,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: handleSubmit,
						disabled: isSubmitting || !content.trim(),
						children: [isSubmitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Submit Updated Suggestion"]
					})]
				})
			]
		})
	});
}
var statusColors = {
	open: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
	changes_requested: "bg-orange-500/10 text-orange-600 border-orange-500/20",
	accepted: "bg-green-500/10 text-green-600 border-green-500/20",
	rejected: "bg-destructive/10 text-destructive border-destructive/20"
};
var statusLabels = {
	open: "Open",
	changes_requested: "Changes Requested",
	accepted: "Accepted",
	rejected: "Rejected"
};
function SuggestionsTab({ suggestions, loading, itemType, itemId, originalTitle, originalDescription, originalContent, isOwner, onReviewSuggestion, onRequestChanges, onUpdateSuggestion, onApplySuggestion }) {
	const { user } = useAuth();
	const [selectedSuggestion, setSelectedSuggestion] = (0, import_react.useState)(null);
	const [updateSuggestion, setUpdateSuggestion] = (0, import_react.useState)(null);
	const [expandedComments, setExpandedComments] = (0, import_react.useState)(null);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-4",
		children: [
			1,
			2,
			3
		].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-8 rounded-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-32" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-3 w-24" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-16" })
				]
			})
		}) }, i))
	});
	if (suggestions.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-center py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitPullRequest, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-medium mb-2",
				children: "No suggestions yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-muted-foreground",
				children: [
					"Be the first to suggest improvements to this ",
					itemType,
					"."
				]
			})
		]
	});
	const handleAccept = async (reviewComment) => {
		if (!selectedSuggestion) return;
		await onApplySuggestion(selectedSuggestion);
		await onReviewSuggestion(selectedSuggestion.id, "accepted", reviewComment);
	};
	const handleReject = async (reviewComment) => {
		if (!selectedSuggestion) return;
		await onReviewSuggestion(selectedSuggestion.id, "rejected", reviewComment);
	};
	const handleRequestChanges = async (requestedChanges, reviewComment) => {
		if (!selectedSuggestion) return;
		await onRequestChanges(selectedSuggestion.id, requestedChanges, reviewComment);
	};
	const handleUpdateSubmit = async (data) => {
		if (!updateSuggestion) return;
		await onUpdateSuggestion(updateSuggestion.id, data);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			suggestions.map((suggestion) => {
				const canUpdate = user?.id === suggestion.author_id && suggestion.status === "changes_requested";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "h-8 w-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: suggestion.author?.avatar_url || "" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }) })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 flex-wrap",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium",
												children: suggestion.author?.display_name || "Anonymous"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground text-sm",
												children: format(new Date(suggestion.created_at), "MMM d, yyyy")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: statusColors[suggestion.status],
												children: statusLabels[suggestion.status]
											})
										]
									}),
									suggestion.title && suggestion.title !== originalTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Title: "
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: suggestion.title
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted-foreground mt-1 line-clamp-2",
										children: [suggestion.content.slice(0, 200), suggestion.content.length > 200 && "..."]
									}),
									suggestion.status === "changes_requested" && suggestion.requested_changes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 mb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-4 w-4 text-orange-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-sm font-medium text-orange-600",
													children: [
														"Changes requested by",
														" ",
														suggestion.reviewer?.display_name || "Reviewer"
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "list-disc list-inside text-sm space-y-1",
												children: suggestion.requested_changes.map((change, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
													className: "text-muted-foreground",
													children: change
												}, i))
											}),
											suggestion.review_comment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-muted-foreground mt-2 italic",
												children: [
													"\"",
													suggestion.review_comment,
													"\""
												]
											})
										]
									}),
									suggestion.status !== "open" && suggestion.status !== "changes_requested" && suggestion.review_comment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 p-2 bg-muted rounded text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-medium",
												children: [suggestion.reviewer?.display_name || "Reviewer", ":"]
											}),
											" ",
											suggestion.review_comment
										]
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								canUpdate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									onClick: () => setUpdateSuggestion(suggestion),
									className: "bg-orange-500 hover:bg-orange-600",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-4 w-4 mr-1" }), "Update"]
								}),
								isOwner && suggestion.status === "open" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									onClick: () => setSelectedSuggestion(suggestion),
									children: "Review"
								}),
								!isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => setSelectedSuggestion(suggestion),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4 mr-1" }), "View"]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 pt-3 border-t",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => setExpandedComments(expandedComments === suggestion.id ? null : suggestion.id),
							children: [
								expandedComments === suggestion.id ? "Hide" : "Show",
								" ",
								"Comments"
							]
						}), expandedComments === suggestion.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSection, {
								itemType: "suggestion",
								itemId: suggestion.id
							})
						})]
					})]
				}) }, suggestion.id);
			}),
			selectedSuggestion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestionReviewModal, {
				open: !!selectedSuggestion,
				onOpenChange: (open) => !open && setSelectedSuggestion(null),
				suggestion: selectedSuggestion,
				originalTitle,
				originalDescription,
				originalContent,
				isOwner,
				onAccept: handleAccept,
				onReject: handleReject,
				onRequestChanges: handleRequestChanges
			}),
			updateSuggestion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpdateSuggestionModal, {
				open: !!updateSuggestion,
				onOpenChange: (open) => !open && setUpdateSuggestion(null),
				suggestion: updateSuggestion,
				onSubmit: handleUpdateSubmit
			})
		]
	});
}
/**
* Shared reviews hook. The four per-type review hooks were byte-for-byte
* copies apart from table/column names (and had already drifted in their
* log strings); they now delegate here.
*/
function createReviewsHook(config) {
	return function useArtifactReviews(itemId, userId) {
		const [reviews, setReviews] = (0, import_react.useState)([]);
		const [userReview, setUserReview] = (0, import_react.useState)(null);
		const [loading, setLoading] = (0, import_react.useState)(true);
		const [submitting, setSubmitting] = (0, import_react.useState)(false);
		const fetchReviews = (0, import_react.useCallback)(async () => {
			if (!itemId) {
				setLoading(false);
				return;
			}
			try {
				const { data, error } = await supabase.from(config.table).select(`
            *,
            profiles:user_id (
              id,
              display_name,
              avatar_url
            )
          `).eq(config.idColumn, itemId).order("created_at", { ascending: false });
				if (error) {
					console.error(`Error fetching ${config.table}:`, error);
					return;
				}
				const transformedReviews = data.map((item) => ({
					...item,
					prompt_id: item[config.idColumn],
					user: item.profiles || null,
					profiles: void 0
				}));
				setReviews(transformedReviews);
				if (userId) {
					const found = transformedReviews.find((r) => r.user_id === userId);
					setUserReview(found || null);
				}
			} catch (err) {
				console.error(`Error fetching ${config.table}:`, err);
			} finally {
				setLoading(false);
			}
		}, [itemId, userId]);
		(0, import_react.useEffect)(() => {
			fetchReviews();
		}, [fetchReviews]);
		const submitReview = async (rating, comment) => {
			if (!itemId || !userId) return { error: /* @__PURE__ */ new Error("Missing item or user ID") };
			setSubmitting(true);
			try {
				if (userReview) {
					const { error } = await supabase.from(config.table).update({
						rating,
						comment: comment?.trim() || null
					}).eq("id", userReview.id);
					if (error) {
						console.error(`Error updating ${config.table} review:`, error);
						return { error: new Error(error.message) };
					}
				} else {
					const { error } = await supabase.from(config.table).insert({
						[config.idColumn]: itemId,
						user_id: userId,
						rating,
						comment: comment?.trim() || null
					});
					if (error) {
						console.error(`Error creating ${config.table} review:`, error);
						return { error: new Error(error.message) };
					}
				}
				await fetchReviews();
				return { error: null };
			} catch (err) {
				console.error(`Error submitting ${config.table} review:`, err);
				return { error: err instanceof Error ? err : /* @__PURE__ */ new Error("Unknown error") };
			} finally {
				setSubmitting(false);
			}
		};
		const deleteReview = async () => {
			if (!userReview) return { error: /* @__PURE__ */ new Error("No review to delete") };
			setSubmitting(true);
			try {
				const { error } = await supabase.from(config.table).delete().eq("id", userReview.id);
				if (error) {
					console.error(`Error deleting ${config.table} review:`, error);
					return { error: new Error(error.message) };
				}
				await fetchReviews();
				return { error: null };
			} catch (err) {
				console.error(`Error deleting ${config.table} review:`, err);
				return { error: err instanceof Error ? err : /* @__PURE__ */ new Error("Unknown error") };
			} finally {
				setSubmitting(false);
			}
		};
		return {
			reviews,
			userReview,
			loading,
			submitting,
			submitReview,
			deleteReview,
			refetch: fetchReviews
		};
	};
}
function StarRating({ rating, onRate, size = "md", readonly = false, showValue = false }) {
	const [hoverRating, setHoverRating] = (0, import_react.useState)(0);
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6"
	};
	const handleClick = (index) => {
		if (!readonly && onRate) onRate(index);
	};
	const displayRating = hoverRating || rating;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center",
			children: [
				1,
				2,
				3,
				4,
				5
			].map((index) => {
				const isFilled = index <= displayRating;
				const isHalf = !isFilled && index - .5 <= displayRating;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: readonly,
					onClick: () => handleClick(index),
					onMouseEnter: () => !readonly && setHoverRating(index),
					onMouseLeave: () => !readonly && setHoverRating(0),
					className: cn("transition-colors", !readonly && "cursor-pointer hover:scale-110", readonly && "cursor-default"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn(sizeClasses[size], "transition-colors", isFilled ? "fill-warning text-warning" : isHalf ? "fill-warning/50 text-warning" : "text-muted-foreground/30") })
				}, index);
			})
		}), showValue && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "ml-1 text-sm font-medium text-foreground",
			children: Number(rating).toFixed(1)
		})]
	});
}
function ReviewSection({ itemId, itemType, itemSlug, userId, ratingAvg, ratingCount, reviews, userReview, loading, submitting, onSubmitReview, onDeleteReview }) {
	const navigate = useNavigate$1();
	const [selectedRating, setSelectedRating] = (0, import_react.useState)(0);
	const [comment, setComment] = (0, import_react.useState)("");
	const [showForm, setShowForm] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (userReview) {
			setSelectedRating(userReview.rating);
			setComment(userReview.comment || "");
		}
	}, [userReview]);
	const getAuthRedirectPath = () => {
		const slug = itemSlug || itemId;
		switch (itemType) {
			case "prompt": return `/auth?redirect=/prompts/${slug}`;
			case "skill": return `/auth?redirect=/skills/${slug}`;
			case "workflow": return `/auth?redirect=/workflows/${slug}`;
			case "prompt_kit": return `/auth?redirect=/prompt-kits/${slug}`;
			default: return `/auth`;
		}
	};
	const handleRatingClick = (rating) => {
		if (!userId) {
			navigate(getAuthRedirectPath());
			return;
		}
		setSelectedRating(rating);
		setShowForm(true);
	};
	const handleSubmit = async () => {
		if (selectedRating === 0) {
			toast.error("Please select a rating");
			return;
		}
		const { error } = await onSubmitReview(selectedRating, comment);
		if (error) toast.error("Failed to submit review");
		else {
			toast.success(userReview ? "Review updated!" : "Review submitted!");
			setShowForm(false);
		}
	};
	const handleDelete = async () => {
		const { error } = await onDeleteReview();
		if (error) toast.error("Failed to delete review");
		else {
			toast.success("Review deleted");
			setSelectedRating(0);
			setComment("");
			setShowForm(false);
		}
	};
	const getInitials = (name) => {
		if (!name) return "U";
		return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
	};
	const displayReviews = reviews.filter((r) => r.user_id !== userId).slice(0, 5);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-border bg-card p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-3xl font-bold text-foreground",
								children: Number(ratingAvg || 0).toFixed(1)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground text-sm",
								children: "/5"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarRating, {
								rating: ratingAvg || 0,
								readonly: true,
								size: "sm"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground mt-0.5",
								children: [
									ratingCount || 0,
									" ",
									ratingCount === 1 ? "review" : "reviews"
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-px bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1",
						children: !userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => navigate(getAuthRedirectPath()),
							className: "text-xs",
							children: "Sign in to rate"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground whitespace-nowrap",
								children: userReview ? "Your rating:" : "Rate it:"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarRating, {
								rating: selectedRating || userReview?.rating || 0,
								onRate: handleRatingClick,
								size: "md"
							})]
						})
					})
				]
			}), userId && (showForm || userReview) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 pt-4 border-t border-border space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					placeholder: "Share your thoughts (optional)...",
					value: comment,
					onChange: (e) => setComment(e.target.value),
					rows: 2,
					className: "resize-none text-sm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: handleSubmit,
							disabled: submitting || selectedRating === 0,
							size: "sm",
							children: [submitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), userReview ? "Update" : "Submit"]
						}),
						!userReview && showForm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => {
								setShowForm(false);
								setSelectedRating(0);
								setComment("");
							},
							children: "Cancel"
						}),
						userReview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: handleDelete,
							disabled: submitting,
							className: "text-destructive hover:text-destructive",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
						})
					]
				})]
			})]
		}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
		}) : reviews.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				userReview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewCard, {
					review: userReview,
					isOwn: true,
					getInitials
				}),
				displayReviews.map((review) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewCard, {
					review,
					getInitials
				}, review.id)),
				reviews.length > 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground text-center pt-1",
					children: [
						"+ ",
						reviews.length - 5,
						" more reviews"
					]
				})
			]
		}) : null]
	});
}
function ReviewCard({ review, isOwn, getInitials }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-lg border border-border bg-card p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
				className: "h-8 w-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: review.user?.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
					className: "text-xs bg-muted",
					children: getInitials(review.user?.display_name || null)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 flex-wrap",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-sm text-foreground",
								children: review.user?.display_name || "Anonymous"
							}),
							isOwn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-primary bg-primary/10 px-2 py-0.5 rounded",
								children: "You"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: format(new Date(review.created_at), "MMM d, yyyy")
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarRating, {
							rating: review.rating,
							readonly: true,
							size: "sm"
						})
					}),
					review.comment && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: review.comment
					})
				]
			})]
		})
	});
}
function AddToCollectionModal({ open, onOpenChange, itemType, itemId }) {
	const navigate = useNavigate$1();
	const { user } = useAuth();
	const { data: collections, isLoading } = useCollections(user?.id);
	const addToCollection = useAddToCollection();
	const createCollection = useCreateCollection();
	const [showNewForm, setShowNewForm] = (0, import_react.useState)(false);
	const [newTitle, setNewTitle] = (0, import_react.useState)("");
	const [addingTo, setAddingTo] = (0, import_react.useState)(null);
	const handleAddToCollection = async (collectionId) => {
		setAddingTo(collectionId);
		try {
			await addToCollection.mutateAsync({
				collection_id: collectionId,
				item_type: itemType,
				item_id: itemId
			});
			onOpenChange(false);
		} finally {
			setAddingTo(null);
		}
	};
	const handleCreateAndAdd = async () => {
		if (!newTitle.trim() || !user) return;
		try {
			const collection = await createCollection.mutateAsync({
				title: newTitle.trim(),
				is_public: false,
				owner_id: user.id
			});
			await addToCollection.mutateAsync({
				collection_id: collection.id,
				item_type: itemType,
				item_id: itemId
			});
			onOpenChange(false);
			setNewTitle("");
			setShowNewForm(false);
		} catch (error) {
			console.error("Error creating collection:", error);
		}
	};
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add to Collection" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center py-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground mb-4",
				children: "Sign in to create collections"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => navigate(`/auth?redirect=${window.location.pathname}`),
				children: "Sign In"
			})]
		})] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add to Collection" }) }), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					showNewForm ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Collection name",
							value: newTitle,
							onChange: (e) => setNewTitle(e.target.value),
							autoFocus: true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								className: "flex-1",
								onClick: () => {
									setShowNewForm(false);
									setNewTitle("");
								},
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "flex-1",
								onClick: handleCreateAndAdd,
								disabled: !newTitle.trim() || createCollection.isPending,
								children: createCollection.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Create & Add"
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "w-full justify-start gap-2",
						onClick: () => setShowNewForm(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "Create new collection"]
					}),
					collections && collections.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
						className: "max-h-[300px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: collections.map((collection) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								className: "w-full justify-start gap-2",
								onClick: () => handleAddToCollection(collection.id),
								disabled: addingTo === collection.id,
								children: [
									addingTo === collection.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-4 w-4" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1 text-left truncate",
										children: collection.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [collection.item_count || 0, " items"]
									})
								]
							}, collection.id))
						})
					}),
					collections && collections.length === 0 && !showNewForm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-sm text-muted-foreground py-4",
						children: "No collections yet. Create one above!"
					})
				]
			})]
		})
	});
}
function ActivitySidebar({ itemId, itemType }) {
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useActivityEvents({
		itemId,
		itemType,
		limit: 10
	});
	const events = data?.pages.flat() || [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-border rounded-lg bg-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 p-4 border-b border-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold text-foreground",
				children: "Activity"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-[400px] overflow-y-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityTimeline, {
				events,
				isLoading,
				isFetchingNextPage,
				hasNextPage: hasNextPage ?? false,
				fetchNextPage,
				showItemLink: false,
				emptyMessage: "No activity for this item yet"
			})
		})]
	});
}
function useLogActivity() {
	const { user } = useAuth();
	const { currentWorkspace } = useWorkspace();
	return { logActivity: (0, import_react.useCallback)(async ({ itemType, itemId, action, metadata = {}, teamId }) => {
		if (!user) return;
		const effectiveTeamId = teamId !== void 0 ? teamId : currentWorkspace !== "personal" ? currentWorkspace : null;
		try {
			const { error } = await supabase.from("activity_events").insert({
				actor_id: user.id,
				team_id: effectiveTeamId,
				item_type: itemType,
				item_id: itemId,
				action,
				metadata
			});
			if (error) console.error("Failed to log activity:", error);
		} catch (err) {
			console.error("Error logging activity:", err);
		}
	}, [user, currentWorkspace]) };
}
function useAIInsights(itemType, itemId) {
	const [insights, setInsights] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [generating, setGenerating] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const { logActivity } = useLogActivity();
	const fetchCachedInsights = (0, import_react.useCallback)(async () => {
		try {
			const { data, error: fetchError } = await supabase.from("ai_insights").select("*").eq("item_type", itemType).eq("item_id", itemId).maybeSingle();
			if (fetchError) throw fetchError;
			if (data) setInsights({
				...data,
				item_type: data.item_type,
				tags: data.tags || [],
				recommendations: data.recommendations || [],
				quality: data.quality || null
			});
			return data;
		} catch (err) {
			console.error("Error fetching cached insights:", err);
			return null;
		}
	}, [itemType, itemId]);
	const fetchArtefact = (0, import_react.useCallback)(async () => {
		try {
			if (itemType === "prompt") {
				const { data, error } = await supabase.from("prompts").select("title, description, content, tags").eq("id", itemId).single();
				if (error || !data) return null;
				return {
					title: data.title,
					description: data.description,
					content: data.content,
					tags: data.tags
				};
			} else if (itemType === "skill") {
				const { data, error } = await supabase.from("skills").select("title, description, content, tags").eq("id", itemId).single();
				if (error || !data) return null;
				return {
					title: data.title,
					description: data.description,
					content: data.content,
					tags: data.tags
				};
			} else if (itemType === "workflow") {
				const { data, error } = await supabase.from("workflows").select("title, description, content, tags").eq("id", itemId).single();
				if (error || !data) return null;
				return {
					title: data.title,
					description: data.description,
					content: data.content || "",
					tags: data.tags
				};
			} else if (itemType === "prompt_kit") {
				const { data, error } = await supabase.from("prompt_kits").select("title, description, content, tags").eq("id", itemId).single();
				if (error || !data) return null;
				return {
					title: data.title,
					description: data.description,
					content: data.content || "",
					tags: data.tags
				};
			}
			return null;
		} catch {
			return null;
		}
	}, [itemType, itemId]);
	const generateInsights = (0, import_react.useCallback)(async (isRefresh = false) => {
		setGenerating(true);
		setError(null);
		try {
			const { data: { user } } = await supabase.auth.getUser();
			const artefact = await fetchArtefact();
			if (!artefact) throw new Error("Failed to fetch artefact data");
			const { data: response, error: fnError } = await supabase.functions.invoke("ai-insights", { body: {
				item_type: itemType,
				title: artefact.title,
				description: artefact.description || "",
				content: artefact.content,
				tags: artefact.tags || [],
				metadata: { id: itemId },
				user_id: user?.id
			} });
			if (fnError) {
				console.error("Edge function error:", fnError);
				throw new Error(await getFunctionErrorMessage(fnError, "Failed to generate insights"));
			}
			const insightData = {
				item_type: itemType,
				item_id: itemId,
				summary: response.summary || null,
				tags: response.tags || [],
				recommendations: response.recommendations || [],
				quality: response.quality || null,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			};
			const { data: upserted, error: upsertError } = await supabase.from("ai_insights").upsert(insightData, { onConflict: "item_type,item_id" }).select().single();
			if (upsertError) throw upsertError;
			setInsights({
				...upserted,
				item_type: upserted.item_type,
				tags: upserted.tags || [],
				recommendations: upserted.recommendations || [],
				quality: upserted.quality || null
			});
			await logActivity({
				action: isRefresh ? "ai_insights_refreshed" : "ai_insights_generated",
				itemType,
				itemId
			});
		} catch (err) {
			console.error("Error generating insights:", err);
			setError(err instanceof Error ? err.message : "Failed to generate insights");
		} finally {
			setGenerating(false);
		}
	}, [
		itemType,
		itemId,
		fetchArtefact,
		logActivity
	]);
	const refreshInsights = (0, import_react.useCallback)(async () => {
		await supabase.from("ai_insights").delete().eq("item_type", itemType).eq("item_id", itemId);
		setInsights(null);
		await generateInsights(true);
	}, [
		itemType,
		itemId,
		generateInsights
	]);
	(0, import_react.useEffect)(() => {
		let mounted = true;
		const init = async () => {
			setLoading(true);
			await fetchCachedInsights();
			if (mounted) setLoading(false);
		};
		init();
		return () => {
			mounted = false;
		};
	}, [fetchCachedInsights]);
	return {
		insights,
		loading,
		generating,
		error,
		generateInsights: () => generateInsights(false),
		refreshInsights,
		hasInsights: !!insights
	};
}
function AIInsightsPanel({ itemType, itemId, teamId }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(true);
	const { user, profile } = useAuthContext();
	const { insights, loading, generating, error, generateInsights, refreshInsights, hasInsights } = useAIInsights(itemType, itemId);
	const { checkCredits } = useAICreditsGate();
	const isPremium = profile?.plan_type === "premium";
	const handleGenerate = () => {
		if (!checkCredits()) return;
		generateInsights();
	};
	const handleRefresh = () => {
		if (!checkCredits()) return;
		refreshInsights();
	};
	if (!user) return null;
	if (!isOpen) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: "sm",
		onClick: () => setIsOpen(true),
		className: "fixed right-0 top-1/2 -translate-y-1/2 rounded-l-lg rounded-r-none border-r-0 z-40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" }), isPremium ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" })]
	});
	if (!isPremium) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-80 border-l bg-card flex flex-col h-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-4 border-b flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold text-sm",
						children: "AI Insights"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "secondary",
						className: "text-xs gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-3 w-3" }), "Premium"]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				className: "h-7 w-7",
				onClick: () => setIsOpen(false),
				"aria-label": "Close insights",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-3.5 w-3.5" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 flex flex-col items-center justify-center p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-8 w-8 text-primary" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "font-semibold text-foreground mb-2",
					children: "Premium Feature"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mb-6 leading-relaxed",
					children: "AI Insights is a Premium feature. Contact support to learn more."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "mailto:support@querino.ai",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "gap-2",
						children: "Contact Support"
					})
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-80 border-l bg-card flex flex-col h-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-4 border-b flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-semibold text-sm",
					children: "AI Insights"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "h-7 w-7",
					onClick: hasInsights ? handleRefresh : handleGenerate,
					disabled: generating,
					"aria-label": hasInsights ? "Refresh insights" : "Generate insights",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("h-3.5 w-3.5", generating && "animate-spin") })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "h-7 w-7",
					onClick: () => setIsOpen(false),
					"aria-label": "Close insights",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-3.5 w-3.5" })
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 overflow-y-auto",
			children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-3/4" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-1/2" })
				]
			}) : !hasInsights ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-10 w-10 mx-auto text-muted-foreground mb-3" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mb-4",
						children: ["Generate AI-powered insights for this ", itemType]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleGenerate,
						disabled: generating,
						size: "sm",
						children: generating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "Generating..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 mr-2" }), "Generate Insights"] })
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-destructive mt-3",
						children: error
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "h-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-4",
					children: insights?.summary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm space-y-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-muted-foreground [&_li]:my-1 [&_strong]:text-foreground [&_strong]:font-medium [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { children: insights.summary })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground italic",
						children: "No insights available"
					})
				})
			}), generating && hasInsights && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-6 w-6 mx-auto animate-spin text-primary mb-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Refreshing insights..."
				})]
			})]
		})]
	});
}
var NEW_ROUTES = {
	prompt: "/prompts/new",
	skill: "/skills/new",
	workflow: "/workflows/new",
	prompt_kit: "/prompt-kits/new"
};
function TranslateModal({ open, onOpenChange, artifactType, sourceLanguage, title, description, content, tags, category }) {
	const navigate = useNavigate$1();
	const { checkCredits, hasCredits, isLoading: creditsLoading, credits } = useAICreditsGate();
	const { user } = useAuth();
	const [targetLanguage, setTargetLanguage] = (0, import_react.useState)("");
	const [isTranslating, setIsTranslating] = (0, import_react.useState)(false);
	const availableLanguages = LANGUAGES.filter((l) => l.code !== sourceLanguage);
	const handleTranslate = async () => {
		if (!targetLanguage) {
			toast.error("Please select a target language");
			return;
		}
		if (!checkCredits()) return;
		setIsTranslating(true);
		try {
			const { data, error } = await supabase.functions.invoke("translate-artifact", { body: {
				artifactType,
				title,
				description,
				content,
				tags,
				sourceLanguage,
				targetLanguage,
				user_id: user?.id
			} });
			if (error) throw new Error(await getFunctionErrorMessage(error, "Failed to translate"));
			if (data?.error) throw new Error(data.error);
			const translatedSlug = data.title ? await generateSlug(data.title) : "";
			const params = new URLSearchParams();
			if (data.title) params.set("title", data.title);
			if (data.description) params.set("description", data.description);
			if (data.content) params.set("content", data.content);
			if (data.tags && Array.isArray(data.tags)) params.set("tags", data.tags.join(","));
			if (category) params.set("category", category);
			params.set("language", targetLanguage);
			if (translatedSlug) params.set("slug", translatedSlug);
			onOpenChange(false);
			toast.success("Translation complete! Creating new artifact…");
			navigate(`${NEW_ROUTES[artifactType]}?${params.toString()}`);
		} catch (err) {
			console.error("Translation error:", err);
			const message = err instanceof Error ? err.message : "Translation failed";
			toast.error(message);
		} finally {
			setIsTranslating(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, { className: "h-5 w-5" }),
						"Translate",
						" ",
						artifactType.charAt(0).toUpperCase() + artifactType.slice(1)
					]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							"Translate this ",
							artifactType,
							" into another language. A new prefilled \"",
							artifactType,
							"\" will be created with the translated content."
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Target Language" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: targetLanguage,
							onValueChange: setTargetLanguage,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select target language" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: availableLanguages.map((lang) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: lang.code,
								children: lang.label
							}, lang.code)) })]
						})]
					})]
				}),
				credits && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: hasCredits ? `~${Math.floor(credits.remainingCredits)} AI credits remaining` : "You're out of AI credits — they reset at the start of your next period."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => onOpenChange(false),
					disabled: isTranslating,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleTranslate,
					disabled: isTranslating || !targetLanguage || !creditsLoading && !hasCredits,
					className: "gap-2",
					children: isTranslating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Translating…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, { className: "h-4 w-4" }), "Translate"] })
				})] })
			]
		})
	});
}
function MenerioSyncButton({ artifactType, artifactId, menerioSynced, menerioSyncedAt, menerioNoteId, onSyncComplete }) {
	const [syncing, setSyncing] = (0, import_react.useState)(false);
	const handleSync = async () => {
		setSyncing(true);
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				toast.error("Please log in");
				return;
			}
			const { data, error } = await supabase.functions.invoke("render-for-menerio", { body: {
				artifact_type: artifactType,
				artifact_id: artifactId
			} });
			if (error) {
				toast.error(data?.error || error.message || "Sync failed");
				return;
			}
			if (data?.error) {
				toast.error(data.error);
				return;
			}
			toast.success("Successfully synced to Menerio");
			onSyncComplete?.();
		} catch (err) {
			toast.error("Sync failed");
		} finally {
			setSyncing(false);
		}
	};
	const syncedAgo = menerioSyncedAt ? formatDistanceToNow(new Date(menerioSyncedAt), { addSuffix: true }) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center gap-1",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "lg",
				variant: "outline",
				onClick: handleSync,
				disabled: syncing,
				className: "gap-2",
				children: [
					syncing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : menerioSynced ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "h-4 w-4" }),
					menerioSynced ? "Re-sync" : "Sync to Menerio",
					menerioSynced && !syncing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5 text-green-500" })
				]
			})
		}), menerioSynced && syncedAgo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Last synced: ", syncedAgo] }), menerioNoteId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs text-muted-foreground",
			children: ["Note ID: ", menerioNoteId]
		})] })] })
	}) });
}
//#endregion
export { MenerioSyncButton as a, SuggestionsTab as c, createReviewsHook as d, isUuid as f, CopyArtifactToTeamModal as i, TranslateModal as l, useSuggestions as m, ActivitySidebar as n, ReviewSection as o, resolveSlugFromId as p, AddToCollectionModal as r, SuggestEditModal as s, AIInsightsPanel as t, createCopyToTeamHook as u };
