import { o as __toESM } from "./_runtime.mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./_ssr/skeleton-cOr9hq3l.mjs";
import { $t as FileText, An as Calendar, D as Tag, Et as Languages, Gt as GitPullRequest, On as ChevronDown, Qt as Files, Vn as ArrowLeft, Xt as FolderPlus, cn as Copy, et as Pencil, kn as Check, ln as CopyPlus, o as UsersRound, r as Workflow } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { h as useWorkspace, m as usePremiumCheck, n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { n as format } from "./_libs/date-fns.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./_ssr/tabs-B4ZFfXyf.mjs";
import { t as CommentsSection } from "./_ssr/CommentsSection-BGZ8JMz4.mjs";
import { t as siteOrigin } from "./_ssr/site-jKTsxe7R.mjs";
import { t as DownloadMarkdownButton } from "./_ssr/DownloadMarkdownButton-DBKsRp2M.mjs";
import { t as SendToLLMButtons } from "./_ssr/SendToLLMButtons-dPxB-1LC.mjs";
import { t as useMenerioIntegration } from "./_ssr/useMenerioIntegration-s2hbByPY.mjs";
import { a as MenerioSyncButton, c as SuggestionsTab, d as createReviewsHook, f as isUuid, i as CopyArtifactToTeamModal, l as TranslateModal, m as useSuggestions, n as ActivitySidebar, o as ReviewSection, p as resolveSlugFromId, r as AddToCollectionModal, s as SuggestEditModal, t as AIInsightsPanel, u as createCopyToTeamHook } from "./_ssr/MenerioSyncButton-Bizux33R.mjs";
import { t as useDuplicateArtifact } from "./_ssr/useDuplicateArtifact-Bcg6VDc0.mjs";
import { i as useSimilarWorkflows, n as SimilarWorkflowsSection } from "./_ssr/SimilarArtefactsSection-bLQpVPiQ.mjs";
import { t as Route } from "./_slug.index-BUURXrNp.mjs";
import { t as useCloneWorkflow } from "./_ssr/useCloneWorkflow-B88fLWz6.mjs";
import { n as CollapsibleTrigger$1, r as Root, t as CollapsibleContent$1 } from "./_libs/@radix-ui/react-collapsible+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.index-DmMKoqp4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Collapsible = Root;
var CollapsibleTrigger = CollapsibleTrigger$1;
var CollapsibleContent = CollapsibleContent$1;
var useWorkflowReviews = createReviewsHook({
	table: "workflow_reviews",
	idColumn: "workflow_id"
});
/**
* Workflow-specific ReviewSection wrapper that uses useWorkflowReviews hook
*/
function WorkflowReviewSection({ workflowId, workflowSlug, userId, ratingAvg, ratingCount }) {
	const { reviews, userReview, loading, submitting, submitReview, deleteReview } = useWorkflowReviews(workflowId, userId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
		itemId: workflowId,
		itemType: "workflow",
		itemSlug: workflowSlug,
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
	table: "workflows",
	label: "workflow",
	buildInsert: (source, includeMetadata) => ({
		title: source.title,
		content: source.content || null,
		json: source.json || {},
		published: false,
		rating_avg: 0,
		rating_count: 0,
		description: includeMetadata ? source.description || null : null,
		category: includeMetadata ? source.category || null : null,
		tags: includeMetadata ? source.tags || [] : [],
		filename: includeMetadata ? source.filename || null : null,
		scope: includeMetadata ? source.scope || "workspace" : "workspace"
	})
});
function useCopyWorkflowToTeam() {
	const { copyToTeam, copying } = useBase();
	return {
		copyWorkflowToTeam: copyToTeam,
		copying
	};
}
function CopyWorkflowToTeamModal({ open, onOpenChange, workflow }) {
	const { copyWorkflowToTeam, copying } = useCopyWorkflowToTeam();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyArtifactToTeamModal, {
		open,
		onOpenChange,
		source: workflow,
		label: "workflow",
		detailPathPrefix: "/workflows",
		copyToTeam: copyWorkflowToTeam,
		copying
	});
}
function WorkflowDetail({ initialWorkflow = null } = {}) {
	const { slug } = useParams$1();
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const { cloneWorkflow, cloning } = useCloneWorkflow();
	const { duplicateArtifact, duplicating } = useDuplicateArtifact();
	const [workflow, setWorkflow] = (0, import_react.useState)(initialWorkflow);
	const [loading, setLoading] = (0, import_react.useState)(!initialWorkflow);
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [isContentOpen, setIsContentOpen] = (0, import_react.useState)(true);
	const [showCollectionModal, setShowCollectionModal] = (0, import_react.useState)(false);
	const [showSuggestModal, setShowSuggestModal] = (0, import_react.useState)(false);
	const [showCopyToTeamModal, setShowCopyToTeamModal] = (0, import_react.useState)(false);
	const [showTranslateModal, setShowTranslateModal] = (0, import_react.useState)(false);
	const { items: similarWorkflows, loading: loadingSimilar } = useSimilarWorkflows(workflow?.id);
	const { suggestions, loading: loadingSuggestions, openCount, createSuggestion, reviewSuggestion, requestChanges, updateSuggestionAfterChanges } = useSuggestions("workflow", workflow?.id || "");
	const isAuthor = workflow?.author_id && user?.id === workflow.author_id;
	const { hasIntegration: hasMenerio } = useMenerioIntegration(user?.id);
	const { isPremium } = usePremiumCheck();
	const { teams, currentWorkspace } = useWorkspace();
	const isPersonalWorkspace = currentWorkspace === "personal";
	const hasTeams = teams.length > 0;
	const isPersonalWorkflow = !workflow?.team_id;
	const canCopyToTeam = isAuthor && isPremium && hasTeams && isPersonalWorkspace && isPersonalWorkflow;
	const fetchWorkflow = (0, import_react.useCallback)(async () => {
		if (!slug) {
			setNotFound(true);
			setLoading(false);
			return;
		}
		if (isUuid(slug)) {
			const canonical = await resolveSlugFromId("workflows", slug);
			if (canonical) {
				navigate(`/workflows/${canonical}`, { replace: true });
				return;
			}
			setNotFound(true);
			setLoading(false);
			return;
		}
		try {
			const { data, error } = await supabase.from("workflows").select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `).eq("slug", slug).maybeSingle();
			if (error) {
				console.error("Error fetching workflow:", error);
				setNotFound(true);
			} else if (!data) setNotFound(true);
			else {
				const workflowData = {
					...data,
					author: data.profiles || null
				};
				setWorkflow(workflowData);
			}
		} catch (err) {
			console.error("Error fetching workflow:", err);
			setNotFound(true);
		} finally {
			setLoading(false);
		}
	}, [slug]);
	(0, import_react.useEffect)(() => {
		fetchWorkflow();
	}, [fetchWorkflow]);
	const getWorkflowContent = () => {
		if (!workflow) return "";
		if (workflow.content) return workflow.content;
		if (workflow.json) return typeof workflow.json === "string" ? workflow.json : JSON.stringify(workflow.json, null, 2);
		return "";
	};
	const workflowContent = getWorkflowContent();
	const handleCopy = async () => {
		if (!workflow) return;
		try {
			await navigator.clipboard.writeText(workflowContent);
			setCopied(true);
			toast.success("Workflow content copied!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy workflow");
		}
	};
	const handleApplySuggestion = async (suggestion) => {
		if (!workflow) return;
		const updates = { content: suggestion.content };
		if (suggestion.title) updates.title = suggestion.title;
		if (suggestion.description) updates.description = suggestion.description;
		const { error } = await supabase.from("workflows").update(updates).eq("id", workflow.id);
		if (error) throw error;
		const { data } = await supabase.from("workflows").select(`*, profiles:author_id (id, display_name, avatar_url)`).eq("slug", slug).maybeSingle();
		if (data) setWorkflow({
			...data,
			author: data.profiles || null
		});
	};
	const getAuthorInitials = () => {
		if (workflow?.author?.display_name) return workflow.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (notFound || !workflow) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							children: "Workflow Not Found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "The workflow you're looking for doesn't exist or is no longer available."
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
	`${siteOrigin()}${workflow.slug || workflow.id}`;
	workflow.description || `${workflow.title}`;
	workflow.title, workflow.title, workflow.category, workflow.language, {
		...workflow.created_at && { datePublished: workflow.created_at },
		...workflow.updated_at && { dateModified: workflow.updated_at },
		...workflow.author?.display_name && { author: {
			"@type": "Person",
			name: workflow.author.display_name
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
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "secondary",
											className: "text-sm gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-3 w-3" }), "Workflow"]
										}), workflow.tags && workflow.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: workflow.tags.slice(0, 5).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: `/discover?type=workflows&tag=${encodeURIComponent(tag)}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												variant: "outline",
												className: "text-sm gap-1 cursor-pointer hover:bg-accent transition-colors",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-3 w-3" }), tag]
											})
										}, tag)) })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "mb-4 text-display-md font-bold text-foreground md:text-display-lg",
										children: workflow.title
									}),
									workflow.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg text-muted-foreground",
										children: workflow.description
									}),
									workflow.filename && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex items-center gap-2 text-sm text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "font-mono bg-muted px-2 py-0.5 rounded",
											children: workflow.filename
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-6 flex flex-wrap items-center gap-6",
										children: [workflow.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
											to: `/u/${encodeURIComponent(workflow.author.display_name || "")}`,
											className: "flex items-center gap-3 hover:opacity-80 transition-opacity",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
												className: "h-10 w-10",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: workflow.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
													className: "bg-primary/10 text-primary",
													children: getAuthorInitials()
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium text-foreground hover:text-primary transition-colors",
												children: workflow.author.display_name || "Anonymous"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Author"
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-sm text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Created",
												" ",
												format(new Date(workflow.created_at), "MMM d, yyyy")
											] })]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-6 flex flex-wrap gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: copied ? "success" : "default",
										onClick: handleCopy,
										className: "gap-2",
										children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), "Copied!"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), "Copy Content"] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendToLLMButtons, {
										title: workflow.title,
										content: getWorkflowContent()
									}),
									isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: `/workflows/${workflow.slug}/edit`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "lg",
												variant: "outline",
												className: "gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" }), "Edit Workflow"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "lg",
											variant: "outline",
											onClick: () => duplicateArtifact("workflow", workflow, user.id),
											disabled: duplicating,
											className: "gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyPlus, { className: "h-4 w-4" }), "Duplicate"]
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
										onClick: () => cloneWorkflow(workflow, user.id),
										disabled: cloning,
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, { className: "h-4 w-4" }), cloning ? "Cloning..." : "Clone Workflow"]
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
										onClick: () => setShowTranslateModal(true),
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Languages, { className: "h-4 w-4" }), "Translate"]
									}),
									isAuthor && hasMenerio && workflow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioSyncButton, {
										artifactType: "workflow",
										artifactId: workflow.id,
										menerioSynced: workflow.menerio_synced || false,
										menerioSyncedAt: workflow.menerio_synced_at || null,
										menerioNoteId: workflow.menerio_note_id || null,
										onSyncComplete: fetchWorkflow
									}),
									user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										onClick: () => setShowCollectionModal(true),
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "h-4 w-4" }), "Add to Collection"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadMarkdownButton, {
										title: workflow.title,
										type: "workflow",
										description: workflow.description,
										tags: workflow.tags,
										content: workflowContent
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Collapsible, {
									open: isContentOpen,
									onOpenChange: setIsContentOpen,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											className: "w-full justify-between mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-lg font-semibold",
												children: "Workflow Content"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `h-4 w-4 transition-transform ${isContentOpen ? "rotate-180" : ""}` })]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative rounded-xl border border-border bg-muted/30 p-6 max-h-[500px] overflow-auto",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: handleCopy,
											className: "absolute top-3 right-3 z-10 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors",
											title: "Copy to clipboard",
											children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
											className: "whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed",
											children: workflowContent
										})]
									}) })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddToCollectionModal, {
								open: showCollectionModal,
								onOpenChange: setShowCollectionModal,
								itemType: "workflow",
								itemId: workflow.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestEditModal, {
								open: showSuggestModal,
								onOpenChange: setShowSuggestModal,
								itemType: "workflow",
								currentTitle: workflow.title,
								currentDescription: workflow.description || "",
								currentContent: workflowContent,
								onSubmit: createSuggestion
							}),
							canCopyToTeam && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyWorkflowToTeamModal, {
								open: showCopyToTeamModal,
								onOpenChange: setShowCopyToTeamModal,
								workflow
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TranslateModal, {
								open: showTranslateModal,
								onOpenChange: setShowTranslateModal,
								artifactType: "workflow",
								sourceLanguage: workflow.language || "en",
								title: workflow.title,
								description: workflow.description || "",
								content: workflowContent,
								tags: workflow.tags || [],
								category: workflow.category || void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowReviewSection, {
								workflowId: workflow.id,
								workflowSlug: workflow.slug || void 0,
								userId: user?.id,
								ratingAvg: workflow.rating_avg || 0,
								ratingCount: workflow.rating_count || 0
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
										value: "details",
										className: "mt-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SimilarWorkflowsSection, {
											items: similarWorkflows,
											loading: loadingSimilar
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-8",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivitySidebar, {
												itemId: workflow.id,
												itemType: "workflow"
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "comments",
										className: "mt-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSection, {
											itemType: "workflow",
											itemId: workflow.id,
											teamId: workflow.team_id
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "suggestions",
										className: "mt-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestionsTab, {
											suggestions,
											loading: loadingSuggestions,
											itemType: "workflow",
											itemId: workflow.id,
											originalTitle: workflow.title,
											originalDescription: workflow.description || "",
											originalContent: workflowContent,
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
					itemType: "workflow",
					itemId: workflow.id,
					teamId: workflow.team_id
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function RouteComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowDetail, { initialWorkflow: Route.useLoaderData() });
}
//#endregion
export { RouteComponent as component };
