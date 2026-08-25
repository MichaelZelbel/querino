import { o as __toESM } from "./_runtime.mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Label } from "./_ssr/label-DBD1bRRP.mjs";
import { t as Textarea } from "./_ssr/textarea-C03-A3RU.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./_ssr/skeleton-cOr9hq3l.mjs";
import { An as Calendar, Bn as ArrowRight, D as Tag, Et as Languages, Fn as BookmarkCheck, Gt as GitPullRequest, P as Sparkles, Pn as Bookmark, Pt as History, Q as PinOff, Qt as Files, V as Save, Vn as ArrowLeft, Xt as FolderPlus, Z as Pin, a as Users, cn as Copy, et as Pencil, gt as LoaderCircle, ht as Lock, kn as Check, ln as CopyPlus, o as UsersRound } from "./_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./_ssr/select-Byrv14ho.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./_ssr/dialog-s-1huv4W.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { h as useWorkspace, m as usePremiumCheck, n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { n as format } from "./_libs/date-fns.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./_ssr/tabs-B4ZFfXyf.mjs";
import { t as moderateContent } from "./_ssr/moderateContent-Dd1HYPU1.mjs";
import { t as CommentsSection } from "./_ssr/CommentsSection-BGZ8JMz4.mjs";
import { t as siteOrigin } from "./_ssr/site-jKTsxe7R.mjs";
import { t as VersionHistoryPanel } from "./_ssr/VersionHistoryPanel-Ba812uju.mjs";
import { t as DownloadMarkdownButton } from "./_ssr/DownloadMarkdownButton-DBKsRp2M.mjs";
import { t as getFunctionErrorMessage } from "./_ssr/functionError-BowYYo7v.mjs";
import { t as useAICreditsGate } from "./_ssr/useAICreditsGate-CWqt47PK.mjs";
import { t as SendToLLMButtons } from "./_ssr/SendToLLMButtons-dPxB-1LC.mjs";
import { t as useMenerioIntegration } from "./_ssr/useMenerioIntegration-s2hbByPY.mjs";
import { a as MenerioSyncButton, c as SuggestionsTab, d as createReviewsHook, f as isUuid, i as CopyArtifactToTeamModal, l as TranslateModal, m as useSuggestions, n as ActivitySidebar, o as ReviewSection$1, p as resolveSlugFromId, r as AddToCollectionModal, s as SuggestEditModal, t as AIInsightsPanel, u as createCopyToTeamHook } from "./_ssr/MenerioSyncButton-Bizux33R.mjs";
import { t as useDuplicateArtifact } from "./_ssr/useDuplicateArtifact-Bcg6VDc0.mjs";
import { t as Route } from "./_slug.index-BdxPuJ38.mjs";
import { t as useClonePrompt } from "./_ssr/useClonePrompt-DyUgLCDb.mjs";
import { t as usePinnedPrompts } from "./_ssr/usePinnedPrompts-DDaPyuEo.mjs";
import { t as UpsellModal } from "./_ssr/UpsellModal-CEnDkFkf.mjs";
import { t as FRAMEWORK_OPTIONS } from "./_ssr/promptGenerator-DM4ousU3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.index-CimP_yWT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useSavedPrompts() {
	const { user } = useAuthContext();
	const [savedPromptIds, setSavedPromptIds] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [loading, setLoading] = (0, import_react.useState)(false);
	const fetchSavedPrompts = (0, import_react.useCallback)(async () => {
		if (!user) {
			setSavedPromptIds(/* @__PURE__ */ new Set());
			return;
		}
		setLoading(true);
		try {
			const { data, error } = await supabase.from("user_saved_prompts").select("prompt_id").eq("user_id", user.id);
			if (error) {
				console.error("Error fetching saved prompts:", error);
				return;
			}
			setSavedPromptIds(new Set(data?.map((row) => row.prompt_id) || []));
		} catch (err) {
			console.error("Error fetching saved prompts:", err);
		} finally {
			setLoading(false);
		}
	}, [user]);
	(0, import_react.useEffect)(() => {
		fetchSavedPrompts();
	}, [fetchSavedPrompts]);
	const isPromptSaved = (0, import_react.useCallback)((promptId) => savedPromptIds.has(promptId), [savedPromptIds]);
	const savePrompt = (0, import_react.useCallback)(async (promptId) => {
		if (!user) return { error: /* @__PURE__ */ new Error("Not authenticated") };
		try {
			const { data: promptData } = await supabase.from("prompts").select("author_id").eq("id", promptId).maybeSingle();
			if (promptData?.author_id === user.id) return { error: /* @__PURE__ */ new Error("Cannot save your own prompt") };
			const { error } = await supabase.from("user_saved_prompts").insert({
				user_id: user.id,
				prompt_id: promptId
			});
			if (error) {
				if (error.code === "23505") return { error: null };
				return { error };
			}
			setSavedPromptIds((prev) => /* @__PURE__ */ new Set([...prev, promptId]));
			return { error: null };
		} catch (err) {
			return { error: err };
		}
	}, [user]);
	const unsavePrompt = (0, import_react.useCallback)(async (promptId) => {
		if (!user) return { error: /* @__PURE__ */ new Error("Not authenticated") };
		try {
			const { error } = await supabase.from("user_saved_prompts").delete().eq("user_id", user.id).eq("prompt_id", promptId);
			if (error) return { error };
			setSavedPromptIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(promptId);
				return newSet;
			});
			return { error: null };
		} catch (err) {
			return { error: err };
		}
	}, [user]);
	return {
		savedPromptIds,
		loading,
		isPromptSaved,
		savePrompt,
		unsavePrompt,
		toggleSave: (0, import_react.useCallback)(async (promptId) => {
			if (isPromptSaved(promptId)) return unsavePrompt(promptId);
			else return savePrompt(promptId);
		}, [
			isPromptSaved,
			savePrompt,
			unsavePrompt
		]),
		refetch: fetchSavedPrompts
	};
}
var usePromptReviews = createReviewsHook({
	table: "prompt_reviews",
	idColumn: "prompt_id"
});
/**
* Prompt-specific ReviewSection wrapper that uses usePromptReviews hook
*/
function ReviewSection({ promptId, userId, ratingAvg, ratingCount }) {
	const { reviews, userReview, loading, submitting, submitReview, deleteReview } = usePromptReviews(promptId, userId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection$1, {
		itemId: promptId,
		itemType: "prompt",
		userId,
		ratingAvg,
		ratingCount,
		reviews,
		userReview,
		loading,
		submitting,
		onSubmitReview: submitReview,
		onDeleteReview: deleteReview
	});
}
var useBase = createCopyToTeamHook({
	table: "prompts",
	label: "prompt",
	buildInsert: (source, includeMetadata) => ({
		title: source.title,
		content: source.content,
		is_public: false,
		rating_avg: 0,
		rating_count: 0,
		copies_count: 0,
		description: includeMetadata ? source.description : "",
		category: includeMetadata ? source.category : "writing",
		tags: includeMetadata ? source.tags || [] : []
	})
});
function useCopyPromptToTeam() {
	const { copyToTeam, copying } = useBase();
	return {
		copyPromptToTeam: copyToTeam,
		copying
	};
}
function CopyToTeamModal({ open, onOpenChange, prompt }) {
	const { copyPromptToTeam, copying } = useCopyPromptToTeam();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyArtifactToTeamModal, {
		open,
		onOpenChange,
		source: prompt,
		label: "prompt",
		detailPathPrefix: "/prompts",
		copyToTeam: copyPromptToTeam,
		copying
	});
}
function RefinePromptModal({ isOpen, onClose, promptContent, promptTitle, promptId, isPublic, onApplyRefinedPrompt, onPromptUpdated, userId }) {
	const [framework, setFramework] = (0, import_react.useState)("auto");
	const [isRefining, setIsRefining] = (0, import_react.useState)(false);
	const [isUpdating, setIsUpdating] = (0, import_react.useState)(false);
	const [refinedPrompt, setRefinedPrompt] = (0, import_react.useState)(null);
	const [explanation, setExplanation] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const { checkCredits, hasCredits, isLoading: creditsLoading, credits } = useAICreditsGate();
	const handleRefine = async () => {
		if (!checkCredits()) return;
		setIsRefining(true);
		setRefinedPrompt(null);
		setExplanation(null);
		try {
			const { data, error } = await supabase.functions.invoke("refine-prompt", { body: {
				prompt: promptContent,
				framework,
				goal: promptTitle || "",
				user_id: userId
			} });
			if (error) {
				console.error("Edge function error:", error);
				throw new Error(await getFunctionErrorMessage(error, "Failed to refine prompt"));
			}
			if (!data?.refinedPrompt) throw new Error("No refined prompt in response");
			setRefinedPrompt(data.refinedPrompt);
			setExplanation(data.explanation || null);
		} catch (error) {
			console.error("Error refining prompt:", error);
			toast.error("Failed to refine prompt. Please try again.");
		} finally {
			setIsRefining(false);
		}
	};
	const handleCopy = async () => {
		if (!refinedPrompt) return;
		try {
			await navigator.clipboard.writeText(refinedPrompt);
			setCopied(true);
			toast.success("Refined prompt copied to clipboard!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy");
		}
	};
	const handleApply = () => {
		if (refinedPrompt && onApplyRefinedPrompt) {
			onApplyRefinedPrompt(refinedPrompt);
			toast.success("Refined prompt applied!");
			handleClose();
		}
	};
	const handleUpdatePrompt = async () => {
		if (!refinedPrompt || !promptId) return;
		setIsUpdating(true);
		try {
			if (isPublic) {
				const result = await moderateContent({
					title: promptTitle,
					content: refinedPrompt
				}, "edit_public", "prompt", promptId);
				if (!result.approved) {
					toast.error(result.reason || "This content was blocked by moderation and cannot be saved to a public prompt.");
					return;
				}
			}
			const { error } = await supabase.from("prompts").update({
				content: refinedPrompt,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", promptId);
			if (error) {
				console.error("Error updating prompt:", error);
				throw new Error(error.message);
			}
			toast.success("Prompt updated successfully!");
			onPromptUpdated?.();
			handleClose();
		} catch (error) {
			console.error("Error updating prompt:", error);
			toast.error("Failed to update prompt. Please try again.");
		} finally {
			setIsUpdating(false);
		}
	};
	const handleClose = () => {
		setRefinedPrompt(null);
		setExplanation(null);
		setFramework("auto");
		onClose();
	};
	const selectedFrameworkOption = FRAMEWORK_OPTIONS.find((f) => f.value === framework);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: isOpen,
		onOpenChange: handleClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5 text-primary" }), "Refine Prompt"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Querino will rewrite this prompt using best practices and the chosen framework." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-sm font-medium",
								children: "Current Prompt"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: promptContent,
								readOnly: true,
								className: "h-32 resize-none bg-muted/50 font-mono text-sm"
							})]
						}),
						!refinedPrompt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-sm font-medium",
									children: "Prompt Framework"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: framework,
									onValueChange: (v) => setFramework(v),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: FRAMEWORK_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: option.value,
										children: option.label
									}, option.value)) })]
								}),
								selectedFrameworkOption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: selectedFrameworkOption.description
								})
							]
						}),
						refinedPrompt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-sm font-medium text-primary",
										children: "Refined Prompt"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: ["Framework: ", selectedFrameworkOption?.label || framework]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: refinedPrompt,
									readOnly: true,
									className: "h-48 resize-none bg-primary/5 border-primary/20 font-mono text-sm"
								})]
							}), explanation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-muted/30 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
									children: "What was improved"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-foreground",
									children: explanation
								})]
							})]
						})
					]
				}),
				credits && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: hasCredits ? `~${Math.floor(credits.remainingCredits)} AI credits remaining` : "You're out of AI credits — they reset at the start of your next period."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: handleClose,
						children: "Cancel"
					}), !refinedPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleRefine,
						disabled: isRefining || !creditsLoading && !hasCredits,
						className: "gap-2",
						children: isRefining ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Refining your prompt…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "Refine"] })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: handleCopy,
							className: "gap-2",
							children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), "Copied!"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), "Copy Refined Prompt"] })
						}),
						onApplyRefinedPrompt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: handleApply,
							className: "gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" }), "Replace in Editor"]
						}),
						promptId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleUpdatePrompt,
							disabled: isUpdating,
							className: "gap-2",
							children: isUpdating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Updating…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Update Prompt"] })
						})
					] })]
				})
			]
		})
	});
}
function PromptDetail({ initialPrompt = null } = {}) {
	const { slug } = useParams$1();
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const { isPromptSaved, toggleSave } = useSavedPrompts();
	const { clonePrompt, cloning } = useClonePrompt();
	const { duplicateArtifact, duplicating } = useDuplicateArtifact();
	const { isPromptPinned, togglePin } = usePinnedPrompts();
	const [prompt, setPrompt] = (0, import_react.useState)(initialPrompt);
	const [loading, setLoading] = (0, import_react.useState)(!initialPrompt);
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [pinning, setPinning] = (0, import_react.useState)(false);
	const [showRefineModal, setShowRefineModal] = (0, import_react.useState)(false);
	const [showUpsellModal, setShowUpsellModal] = (0, import_react.useState)(false);
	const [showCopyToTeamModal, setShowCopyToTeamModal] = (0, import_react.useState)(false);
	const [showCollectionModal, setShowCollectionModal] = (0, import_react.useState)(false);
	const [showSuggestModal, setShowSuggestModal] = (0, import_react.useState)(false);
	const [showVersionHistory, setShowVersionHistory] = (0, import_react.useState)(false);
	const [showTranslateModal, setShowTranslateModal] = (0, import_react.useState)(false);
	const { suggestions, loading: loadingSuggestions, openCount, createSuggestion, reviewSuggestion, requestChanges, updateSuggestionAfterChanges, refetch: refetchSuggestions } = useSuggestions("prompt", prompt?.id || "");
	const isSaved = prompt?.id ? isPromptSaved(prompt.id) : false;
	const isPinned = prompt?.id ? isPromptPinned(prompt.id) : false;
	const isAuthor = prompt?.author_id && user?.id === prompt.author_id;
	const { hasIntegration: hasMenerio } = useMenerioIntegration(user?.id);
	const { isPremium } = usePremiumCheck();
	const { teams, currentWorkspace } = useWorkspace();
	const isPersonalWorkspace = currentWorkspace === "personal";
	const hasTeams = teams.length > 0;
	const isPersonalPrompt = !prompt?.team_id;
	const canCopyToTeam = isAuthor && isPremium && hasTeams && isPersonalWorkspace && isPersonalPrompt;
	const fetchPrompt = async () => {
		if (!slug) {
			setNotFound(true);
			setLoading(false);
			return;
		}
		if (isUuid(slug)) {
			const canonical = await resolveSlugFromId("prompts", slug);
			if (canonical) {
				navigate(`/prompts/${canonical}`, { replace: true });
				return;
			}
			setNotFound(true);
			setLoading(false);
			return;
		}
		try {
			const { data, error } = await supabase.from("prompts").select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `).eq("slug", slug).maybeSingle();
			if (error) {
				console.error("Error fetching prompt:", error);
				setNotFound(true);
			} else if (!data) {
				const { data: redirect } = await supabase.from("prompt_slug_redirects").select("prompt_id").eq("old_slug", slug).maybeSingle();
				if (redirect?.prompt_id) {
					const { data: currentPrompt } = await supabase.from("prompts").select("slug").eq("id", redirect.prompt_id).maybeSingle();
					if (currentPrompt?.slug) {
						navigate(`/prompts/${currentPrompt.slug}`, { replace: true });
						return;
					}
				}
				setNotFound(true);
			} else {
				const promptData = {
					...data,
					author: data.profiles || null
				};
				setPrompt(promptData);
			}
		} catch (err) {
			console.error("Error fetching prompt:", err);
			setNotFound(true);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchPrompt();
	}, [slug]);
	const handleCopy = async () => {
		if (!prompt) return;
		try {
			await navigator.clipboard.writeText(prompt.content);
			setCopied(true);
			toast.success("Prompt copied to clipboard!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy prompt");
		}
	};
	const handleSaveToLibrary = async () => {
		if (!prompt?.id) return;
		if (!user) {
			navigate(`/auth?redirect=/prompts/${prompt.slug}`);
			return;
		}
		if (isAuthor) {
			toast.info("That one's already yours 🙂");
			return;
		}
		setSaving(true);
		const { error } = await toggleSave(prompt.id);
		setSaving(false);
		if (error) {
			toast.error("Failed to update library");
			return;
		}
		if (isSaved) toast.success("Removed from library");
		else toast.success("Saved to library!");
	};
	const handleTogglePin = async () => {
		if (!prompt?.id) return;
		if (!user) {
			navigate(`/auth?redirect=/prompts/${prompt.slug}`);
			return;
		}
		setPinning(true);
		const { error } = await togglePin(prompt.id);
		setPinning(false);
		if (error) {
			toast.error("Failed to update pin");
			return;
		}
		if (isPinned) toast.success("Unpinned");
		else toast.success("Pinned!");
	};
	const handleApplySuggestion = async (suggestion) => {
		if (!prompt) return;
		const updates = { content: suggestion.content };
		if (suggestion.title) updates.title = suggestion.title;
		if (suggestion.description) updates.description = suggestion.description;
		if (prompt.is_public) {
			const result = await moderateContent({
				title: updates.title ?? prompt.title,
				description: updates.description ?? prompt.description,
				content: updates.content
			}, "edit_public", "prompt", prompt.id);
			if (!result.approved) {
				toast.error(result.reason || "This suggestion was blocked by moderation and cannot be applied to a public prompt.");
				return;
			}
		}
		const { error } = await supabase.from("prompts").update(updates).eq("id", prompt.id);
		if (error) throw error;
		const { data } = await supabase.from("prompts").select(`*, profiles:author_id (id, display_name, avatar_url)`).eq("slug", slug).maybeSingle();
		if (data) setPrompt({
			...data,
			author: data.profiles || null
		});
	};
	const getAuthorInitials = () => {
		if (prompt?.author?.display_name) return prompt.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
		return "U";
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-4 h-8 w-48" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-8 h-12 w-3/4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-4 h-6 w-24" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mb-8 h-24 w-full" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (notFound || !prompt) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							children: "The prompt you're looking for doesn't exist or is no longer available."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/discover",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Discover"]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	`${siteOrigin()}${prompt.slug}`;
	prompt.summary || prompt.description || `${prompt.title}`;
	prompt.title, prompt.title, prompt.category, prompt.language, {
		...prompt.created_at && { datePublished: prompt.created_at },
		...prompt.updated_at && { dateModified: prompt.updated_at },
		...prompt.author?.display_name && { author: {
			"@type": "Person",
			name: prompt.author.display_name
		} }
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 py-12",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "container mx-auto max-w-4xl px-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => navigate(-1),
								className: "mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-4 flex flex-wrap items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "secondary",
												className: "text-sm capitalize",
												children: prompt.category
											}),
											!prompt.is_public && isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												variant: "outline",
												className: "gap-1 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3 w-3" }), "Private"]
											}),
											prompt.tags && prompt.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: prompt.tags.slice(0, 5).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
												to: `/discover?tag=${encodeURIComponent(tag)}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
													variant: "outline",
													className: "text-sm gap-1 cursor-pointer hover:bg-accent transition-colors",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-3 w-3" }), tag]
												})
											}, tag)) })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "mb-4 text-display-md font-bold text-foreground md:text-display-lg",
										children: prompt.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg text-muted-foreground",
										children: prompt.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-6 flex flex-wrap items-center gap-6",
										children: [
											prompt.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: `/u/${encodeURIComponent(prompt.author.display_name || "")}`,
												className: "flex items-center gap-3 hover:opacity-80 transition-opacity",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
													className: "h-10 w-10",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: prompt.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
														className: "bg-primary/10 text-primary",
														children: getAuthorInitials()
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-medium text-foreground hover:text-primary transition-colors",
													children: prompt.author.display_name || "Anonymous"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "Author"
												})] })]
											}),
											prompt.published_at && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-sm text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													"Published",
													" ",
													format(new Date(prompt.published_at), "MMM d, yyyy")
												] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-sm text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [prompt.copies_count.toLocaleString(), " copies"] })]
											})
										]
									})
								]
							}),
							prompt.summary && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-8 rounded-xl border border-border bg-card p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mb-3 text-lg font-semibold text-foreground",
									children: "Summary"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground",
									children: prompt.summary
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-6 flex flex-wrap gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: copied ? "success" : "default",
										onClick: handleCopy,
										className: "gap-2",
										children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), "Copied!"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), "Copy Prompt"] })
									}),
									!isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: isSaved ? "secondary" : "outline",
										onClick: handleSaveToLibrary,
										disabled: saving,
										className: "gap-2",
										children: isSaved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkCheck, { className: "h-4 w-4" }), "Saved ✓"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "h-4 w-4" }), "Save to My Library"] })
									}),
									user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: isPinned ? "secondary" : "outline",
										onClick: handleTogglePin,
										disabled: pinning,
										className: "gap-2",
										children: isPinned ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinOff, { className: "h-4 w-4" }), "Unpin"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-4 w-4" }), "Pin"] })
									}),
									isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: `/library/${prompt.slug}/edit`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "lg",
												variant: "outline",
												className: "gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" }), "Edit Prompt"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "lg",
											variant: "outline",
											onClick: () => duplicateArtifact("prompt", prompt, user.id),
											disabled: duplicating,
											className: "gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyPlus, { className: "h-4 w-4" }), "Duplicate"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "lg",
											variant: "outline",
											onClick: () => setShowVersionHistory(true),
											className: "gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4" }), "Version History"]
										}),
										canCopyToTeam && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "lg",
											variant: "outline",
											onClick: () => setShowCopyToTeamModal(true),
											className: "gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsersRound, { className: "h-4 w-4" }), "Copy to team…"]
										})
									] }),
									user && !isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										onClick: () => clonePrompt(prompt, user.id),
										disabled: cloning,
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, { className: "h-4 w-4" }), cloning ? "Cloning..." : "Clone Prompt"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										onClick: () => setShowSuggestModal(true),
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitPullRequest, { className: "h-4 w-4" }), "Suggest Edit"]
									})] }),
									user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										onClick: () => isPremium ? setShowRefineModal(true) : setShowUpsellModal(true),
										className: "gap-2",
										children: [isPremium ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }), "Refine with AI"]
									}),
									user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										onClick: () => setShowTranslateModal(true),
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, { className: "h-4 w-4" }), "Translate"]
									}),
									isAuthor && hasMenerio && prompt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioSyncButton, {
										artifactType: "prompt",
										artifactId: prompt.id,
										menerioSynced: prompt.menerio_synced || false,
										menerioSyncedAt: prompt.menerio_synced_at || null,
										menerioNoteId: prompt.menerio_note_id || null,
										onSyncComplete: fetchPrompt
									}),
									user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										onClick: () => setShowCollectionModal(true),
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "h-4 w-4" }), "Add to Collection"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadMarkdownButton, {
										title: prompt.title,
										type: "prompt",
										description: prompt.description,
										tags: prompt.tags,
										content: prompt.content
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-6 rounded-xl border border-border bg-card p-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendToLLMButtons, {
									title: prompt.title,
									content: prompt.content
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mb-4 text-lg font-semibold text-foreground",
									children: "Prompt"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative rounded-xl border border-border bg-muted/30 p-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handleCopy,
										className: "absolute top-3 right-3 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors",
										title: "Copy to clipboard",
										children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed",
										children: prompt.content
									})]
								})]
							}),
							prompt.example_output && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mb-4 text-lg font-semibold text-foreground",
									children: "Example Output"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-xl border border-border bg-card p-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "whitespace-pre-wrap font-mono text-sm text-muted-foreground leading-relaxed",
										children: prompt.example_output
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefinePromptModal, {
								isOpen: showRefineModal,
								onClose: () => setShowRefineModal(false),
								promptContent: prompt.content,
								promptTitle: prompt.title,
								promptId: prompt.id,
								isPublic: prompt.is_public,
								onPromptUpdated: fetchPrompt,
								userId: user?.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpsellModal, {
								open: showUpsellModal,
								onOpenChange: setShowUpsellModal,
								feature: "Refine with AI"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddToCollectionModal, {
								open: showCollectionModal,
								onOpenChange: setShowCollectionModal,
								itemType: "prompt",
								itemId: prompt.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TranslateModal, {
								open: showTranslateModal,
								onOpenChange: setShowTranslateModal,
								artifactType: "prompt",
								sourceLanguage: prompt.language || "en",
								title: prompt.title,
								description: prompt.description,
								content: prompt.content,
								tags: prompt.tags || [],
								category: prompt.category
							}),
							canCopyToTeam && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyToTeamModal, {
								open: showCopyToTeamModal,
								onOpenChange: setShowCopyToTeamModal,
								prompt
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestEditModal, {
								open: showSuggestModal,
								onOpenChange: setShowSuggestModal,
								itemType: "prompt",
								currentTitle: prompt.title,
								currentDescription: prompt.description,
								currentContent: prompt.content,
								onSubmit: createSuggestion
							}),
							isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionHistoryPanel, {
								open: showVersionHistory,
								onOpenChange: setShowVersionHistory,
								promptId: prompt.id,
								currentPrompt: {
									id: prompt.id,
									title: prompt.title,
									description: prompt.description,
									content: prompt.content,
									tags: prompt.tags
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
								promptId: prompt.id,
								userId: user?.id,
								ratingAvg: prompt.rating_avg,
								ratingCount: prompt.rating_count
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
								defaultValue: "details",
								className: "mt-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "details",
											children: "Details"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "comments",
											children: "Comments"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
											value: "suggestions",
											className: "gap-2",
											children: ["Suggestions", openCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "secondary",
												className: "ml-1 h-5 px-1.5 text-xs",
												children: openCount
											})]
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "details",
										className: "mt-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-8",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivitySidebar, {
												itemId: prompt.id,
												itemType: "prompt"
											})
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "comments",
										className: "mt-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSection, {
											itemType: "prompt",
											itemId: prompt.id,
											teamId: prompt.team_id
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "suggestions",
										className: "mt-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestionsTab, {
											suggestions,
											loading: loadingSuggestions,
											itemType: "prompt",
											itemId: prompt.id,
											originalTitle: prompt.title,
											originalDescription: prompt.description,
											originalContent: prompt.content,
											isOwner: !!isAuthor,
											onReviewSuggestion: reviewSuggestion,
											onRequestChanges: requestChanges,
											onUpdateSuggestion: updateSuggestionAfterChanges,
											onApplySuggestion: handleApplySuggestion
										})
									})
								]
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIInsightsPanel, {
					itemType: "prompt",
					itemId: prompt.id,
					teamId: prompt.team_id
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function RouteComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptDetail, { initialPrompt: Route.useLoaderData() });
}
//#endregion
export { RouteComponent as component };
