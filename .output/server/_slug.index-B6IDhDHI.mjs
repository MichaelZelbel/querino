import { a as __toESM } from "./_runtime.mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./_ssr/skeleton-cOr9hq3l.mjs";
import { An as Calendar, D as Tag, Et as Languages, Gt as GitPullRequest, In as BookOpen, Qt as Files, Vn as ArrowLeft, Xt as FolderPlus, cn as Copy, et as Pencil, kn as Check, ln as CopyPlus, o as UsersRound } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { h as useWorkspace, m as usePremiumCheck, n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { n as format } from "./_libs/date-fns.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./_ssr/tabs-B4ZFfXyf.mjs";
import { t as CommentsSection } from "./_ssr/CommentsSection-BGZ8JMz4.mjs";
import { t as siteOrigin } from "./_ssr/site-jKTsxe7R.mjs";
import { t as DownloadMarkdownButton } from "./_ssr/DownloadMarkdownButton-DBKsRp2M.mjs";
import { t as Route } from "./_slug.index-DUhJH_Ni.mjs";
import { t as SendToLLMButtons } from "./_ssr/SendToLLMButtons-dPxB-1LC.mjs";
import { t as useCloneSkill } from "./_ssr/useCloneSkill-DFMxocr8.mjs";
import { t as useMenerioIntegration } from "./_ssr/useMenerioIntegration-s2hbByPY.mjs";
import { a as MenerioSyncButton, c as SuggestionsTab, d as createReviewsHook, f as isUuid, i as CopyArtifactToTeamModal, l as TranslateModal, m as useSuggestions, n as ActivitySidebar, o as ReviewSection, p as resolveSlugFromId, r as AddToCollectionModal, s as SuggestEditModal, t as AIInsightsPanel, u as createCopyToTeamHook } from "./_ssr/MenerioSyncButton-Bizux33R.mjs";
import { t as useDuplicateArtifact } from "./_ssr/useDuplicateArtifact-Bcg6VDc0.mjs";
import { r as useSimilarSkills, t as SimilarSkillsSection } from "./_ssr/SimilarArtefactsSection-bLQpVPiQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.index-B6IDhDHI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var useSkillReviews = createReviewsHook({
	table: "skill_reviews",
	idColumn: "skill_id"
});
/**
* Skill-specific ReviewSection wrapper that uses useSkillReviews hook
*/
function SkillReviewSection({ skillId, skillSlug, userId, ratingAvg, ratingCount }) {
	const { reviews, userReview, loading, submitting, submitReview, deleteReview } = useSkillReviews(skillId, userId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewSection, {
		itemId: skillId,
		itemType: "skill",
		itemSlug: skillSlug,
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
	table: "skills",
	label: "skill",
	buildInsert: (source, includeMetadata) => ({
		title: source.title,
		content: source.content,
		published: false,
		rating_avg: 0,
		rating_count: 0,
		description: includeMetadata ? source.description || null : null,
		category: includeMetadata ? source.category || null : null,
		tags: includeMetadata ? source.tags || [] : []
	})
});
function useCopySkillToTeam() {
	const { copyToTeam, copying } = useBase();
	return {
		copySkillToTeam: copyToTeam,
		copying
	};
}
function CopySkillToTeamModal({ open, onOpenChange, skill }) {
	const { copySkillToTeam, copying } = useCopySkillToTeam();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyArtifactToTeamModal, {
		open,
		onOpenChange,
		source: skill,
		label: "skill",
		detailPathPrefix: "/skills",
		copyToTeam: copySkillToTeam,
		copying
	});
}
function SkillDetail({ initialSkill = null } = {}) {
	const { slug } = useParams$1();
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const { cloneSkill, cloning } = useCloneSkill();
	const { duplicateArtifact, duplicating } = useDuplicateArtifact();
	const [skill, setSkill] = (0, import_react.useState)(initialSkill);
	const [loading, setLoading] = (0, import_react.useState)(!initialSkill);
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [showCollectionModal, setShowCollectionModal] = (0, import_react.useState)(false);
	const [showSuggestModal, setShowSuggestModal] = (0, import_react.useState)(false);
	const [showCopyToTeamModal, setShowCopyToTeamModal] = (0, import_react.useState)(false);
	const [showTranslateModal, setShowTranslateModal] = (0, import_react.useState)(false);
	const { items: similarSkills, loading: loadingSimilar } = useSimilarSkills(skill?.id);
	const { suggestions, loading: loadingSuggestions, openCount, createSuggestion, reviewSuggestion, requestChanges, updateSuggestionAfterChanges } = useSuggestions("skill", skill?.id || "");
	const isAuthor = skill?.author_id && user?.id === skill.author_id;
	const { hasIntegration: hasMenerio } = useMenerioIntegration(user?.id);
	const { isPremium } = usePremiumCheck();
	const { teams, currentWorkspace } = useWorkspace();
	const isPersonalWorkspace = currentWorkspace === "personal";
	const hasTeams = teams.length > 0;
	const isPersonalSkill = !skill?.team_id;
	const canCopyToTeam = isAuthor && isPremium && hasTeams && isPersonalWorkspace && isPersonalSkill;
	const fetchSkill = (0, import_react.useCallback)(async () => {
		if (!slug) {
			setNotFound(true);
			setLoading(false);
			return;
		}
		if (isUuid(slug)) {
			const canonical = await resolveSlugFromId("skills", slug);
			if (canonical) {
				navigate(`/skills/${canonical}`, { replace: true });
				return;
			}
			setNotFound(true);
			setLoading(false);
			return;
		}
		try {
			const { data, error } = await supabase.from("skills").select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `).eq("slug", slug).maybeSingle();
			if (error) {
				console.error("Error fetching skill:", error);
				setNotFound(true);
			} else if (!data) setNotFound(true);
			else {
				const skillData = {
					...data,
					author: data.profiles || null
				};
				setSkill(skillData);
			}
		} catch (err) {
			console.error("Error fetching skill:", err);
			setNotFound(true);
		} finally {
			setLoading(false);
		}
	}, [slug]);
	(0, import_react.useEffect)(() => {
		fetchSkill();
	}, [fetchSkill]);
	const handleCopy = async () => {
		if (!skill) return;
		try {
			await navigator.clipboard.writeText(skill.content);
			setCopied(true);
			toast.success("Skill content copied!");
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			toast.error("Failed to copy skill");
		}
	};
	const handleApplySuggestion = async (suggestion) => {
		if (!skill) return;
		const updates = { content: suggestion.content };
		if (suggestion.title) updates.title = suggestion.title;
		if (suggestion.description) updates.description = suggestion.description;
		const { error } = await supabase.from("skills").update(updates).eq("id", skill.id);
		if (error) throw error;
		const { data } = await supabase.from("skills").select(`*, profiles:author_id (id, display_name, avatar_url)`).eq("slug", slug).maybeSingle();
		if (data) setSkill({
			...data,
			author: data.profiles || null
		});
	};
	const getAuthorInitials = () => {
		if (skill?.author?.display_name) return skill.author.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
	if (notFound || !skill) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							children: "Skill Not Found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "The skill you're looking for doesn't exist or is no longer available."
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
	`${siteOrigin()}${skill.slug || skill.id}`;
	skill.description || `${skill.title}`;
	skill.title, skill.title, skill.category, skill.language, {
		...skill.created_at && { datePublished: skill.created_at },
		...skill.updated_at && { dateModified: skill.updated_at },
		...skill.author?.display_name && { author: {
			"@type": "Person",
			name: skill.author.display_name
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
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-3 w-3" }), "Skill"]
										}), skill.tags && skill.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: skill.tags.slice(0, 5).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: `/discover?type=skills&tag=${encodeURIComponent(tag)}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												variant: "outline",
												className: "text-sm gap-1 cursor-pointer hover:bg-accent transition-colors",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-3 w-3" }), tag]
											})
										}, tag)) })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "mb-4 text-display-md font-bold text-foreground md:text-display-lg",
										children: skill.title
									}),
									skill.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg text-muted-foreground",
										children: skill.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-6 flex flex-wrap items-center gap-6",
										children: [skill.author && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
											to: `/u/${encodeURIComponent(skill.author.display_name || "")}`,
											className: "flex items-center gap-3 hover:opacity-80 transition-opacity",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
												className: "h-10 w-10",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: skill.author.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
													className: "bg-primary/10 text-primary",
													children: getAuthorInitials()
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium text-foreground hover:text-primary transition-colors",
												children: skill.author.display_name || "Anonymous"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: "Author"
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-sm text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Created ", format(new Date(skill.created_at), "MMM d, yyyy")] })]
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
										children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), "Copied!"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" }), "Copy Skill"] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendToLLMButtons, {
										title: skill.title,
										content: skill.content
									}),
									isAuthor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: `/skills/${skill.slug}/edit`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "lg",
												variant: "outline",
												className: "gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" }), "Edit Skill"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "lg",
											variant: "outline",
											onClick: () => duplicateArtifact("skill", skill, user.id),
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
										onClick: () => cloneSkill(skill, user.id),
										disabled: cloning,
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Files, { className: "h-4 w-4" }), cloning ? "Cloning..." : "Clone Skill"]
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
									isAuthor && hasMenerio && skill && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioSyncButton, {
										artifactType: "skill",
										artifactId: skill.id,
										menerioSynced: skill.menerio_synced || false,
										menerioSyncedAt: skill.menerio_synced_at || null,
										menerioNoteId: skill.menerio_note_id || null,
										onSyncComplete: fetchSkill
									}),
									user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										variant: "outline",
										onClick: () => setShowCollectionModal(true),
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "h-4 w-4" }), "Add to Collection"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadMarkdownButton, {
										title: skill.title,
										type: "skill",
										description: skill.description,
										tags: skill.tags,
										content: skill.content
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mb-4 text-lg font-semibold text-foreground",
									children: "Skill Content"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative rounded-xl border border-border bg-muted/30 p-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: handleCopy,
										className: "absolute top-3 right-3 p-1.5 rounded-md bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors",
										title: "Copy to clipboard",
										children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed",
										children: skill.content
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddToCollectionModal, {
								open: showCollectionModal,
								onOpenChange: setShowCollectionModal,
								itemType: "skill",
								itemId: skill.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestEditModal, {
								open: showSuggestModal,
								onOpenChange: setShowSuggestModal,
								itemType: "skill",
								currentTitle: skill.title,
								currentDescription: skill.description || "",
								currentContent: skill.content,
								onSubmit: createSuggestion
							}),
							canCopyToTeam && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopySkillToTeamModal, {
								open: showCopyToTeamModal,
								onOpenChange: setShowCopyToTeamModal,
								skill
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TranslateModal, {
								open: showTranslateModal,
								onOpenChange: setShowTranslateModal,
								artifactType: "skill",
								sourceLanguage: skill.language || "en",
								title: skill.title,
								description: skill.description || "",
								content: skill.content,
								tags: skill.tags || [],
								category: skill.category || void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillReviewSection, {
								skillId: skill.id,
								skillSlug: skill.slug || void 0,
								userId: user?.id,
								ratingAvg: skill.rating_avg || 0,
								ratingCount: skill.rating_count || 0
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
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SimilarSkillsSection, {
											items: similarSkills,
											loading: loadingSimilar
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-8",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivitySidebar, {
												itemId: skill.id,
												itemType: "skill"
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "comments",
										className: "mt-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentsSection, {
											itemType: "skill",
											itemId: skill.id,
											teamId: skill.team_id
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
										value: "suggestions",
										className: "mt-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuggestionsTab, {
											suggestions,
											loading: loadingSuggestions,
											itemType: "skill",
											itemId: skill.id,
											originalTitle: skill.title,
											originalDescription: skill.description || "",
											originalContent: skill.content,
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
					itemType: "skill",
					itemId: skill.id,
					teamId: skill.team_id
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function RouteComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillDetail, { initialSkill: Route.useLoaderData() });
}
//#endregion
export { RouteComponent as component };
