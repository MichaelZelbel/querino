import { a as __toESM } from "./_runtime.mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Skeleton } from "./_ssr/skeleton-cOr9hq3l.mjs";
import { Hn as Activity, In as BookOpen, P as Sparkles, Ut as Globe, Wt as Github, _ as Twitter, c as UserPlus, r as Workflow } from "./_libs/lucide-react.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./_ssr/tabs-B4ZFfXyf.mjs";
import { r as PromptCard } from "./_ssr/PromptCard-CVKouFhA.mjs";
import { n as WorkflowCard, t as SkillCard } from "./_ssr/WorkflowCard-TJ4_k22S.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_username.index-DMrvnVu4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function UserProfile() {
	const { username } = useParams$1();
	const { user } = useAuthContext();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [prompts, setPrompts] = (0, import_react.useState)([]);
	const [skills, setSkills] = (0, import_react.useState)([]);
	const [workflows, setWorkflows] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("prompts");
	(0, import_react.useEffect)(() => {
		async function fetchProfile() {
			if (!username) {
				setNotFound(true);
				setLoading(false);
				return;
			}
			try {
				const { data: profileData, error: profileError } = await supabase.from("profiles").select("id, display_name, avatar_url, bio, website, twitter, github").or(`display_name.ilike.${username}`).maybeSingle();
				if (profileError || !profileData) {
					setNotFound(true);
					setLoading(false);
					return;
				}
				setProfile(profileData);
				const [promptsRes, skillsRes, workflowsRes] = await Promise.all([
					supabase.from("prompts").select("*").eq("author_id", profileData.id).eq("is_public", true).order("created_at", { ascending: false }),
					supabase.from("skills").select("*").eq("author_id", profileData.id).eq("published", true).order("created_at", { ascending: false }),
					supabase.from("workflows").select("*").eq("author_id", profileData.id).eq("published", true).order("created_at", { ascending: false })
				]);
				setPrompts(promptsRes.data ?? []);
				setSkills(skillsRes.data || []);
				setWorkflows(workflowsRes.data || []);
			} catch (err) {
				console.error("Error fetching profile:", err);
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		}
		fetchProfile();
	}, [username]);
	const getInitials = () => {
		if (profile?.display_name) return profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
		return "U";
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-5xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-24 rounded-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-48" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-96" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-64" })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-full mb-6" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
							children: [
								1,
								2,
								3
							].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64" }, i))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (notFound || !profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							children: "Creator Not Found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "The creator you're looking for doesn't exist or hasn't published anything yet."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/discover",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { children: "Browse Discover" })
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
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-5xl px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "h-24 w-24 border-4 border-background shadow-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: profile.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "bg-primary text-primary-foreground text-2xl",
									children: getInitials()
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 text-center sm:text-left",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "mb-2 text-display-sm font-bold text-foreground",
										children: profile.display_name || "Anonymous Creator"
									}),
									profile.bio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mb-4 text-muted-foreground max-w-xl",
										children: profile.bio
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center justify-center gap-3 sm:justify-start",
										children: [
											profile.website && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: profile.website.startsWith("http") ? profile.website : `https://${profile.website}`,
												target: "_blank",
												rel: "noopener noreferrer",
												className: "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4" }), profile.website.replace(/^https?:\/\//, "")]
											}),
											profile.twitter && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: `https://x.com/${profile.twitter.replace("@", "")}`,
												target: "_blank",
												rel: "noopener noreferrer",
												className: "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Twitter, { className: "h-4 w-4" }),
													"@",
													profile.twitter.replace("@", "")
												]
											}),
											profile.github && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: `https://github.com/${profile.github}`,
												target: "_blank",
												rel: "noopener noreferrer",
												className: "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-4 w-4" }), profile.github]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									className: "gap-2",
									disabled: true,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "h-4 w-4" }), "Follow (coming soon)"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: `/u/${encodeURIComponent(username || "")}/activity`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4 w-4" }), "Activity"]
									})
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						value: activeTab,
						onValueChange: setActiveTab,
						className: "w-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
								className: "grid w-full grid-cols-3 mb-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
										value: "prompts",
										className: "gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }),
											"Prompts (",
											prompts.length,
											")"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
										value: "skills",
										className: "gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-4 w-4" }),
											"Skills (",
											skills.length,
											")"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
										value: "workflows",
										className: "gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-4 w-4" }),
											"Workflows (",
											workflows.length,
											")"
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "prompts",
								children: prompts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "py-12 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "This creator has not published any prompts yet."
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
									children: prompts.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptCard, {
										prompt,
										currentUserId: user?.id,
										showAuthorInfo: false
									}, prompt.id))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "skills",
								children: skills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "py-12 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "This creator has not published any skills yet."
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
									children: skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillCard, {
										skill,
										currentUserId: user?.id
									}, skill.id))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
								value: "workflows",
								children: workflows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "py-12 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "This creator has not published any workflows yet."
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
									children: workflows.map((workflow) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowCard, {
										workflow,
										currentUserId: user?.id
									}, workflow.id))
								})
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = UserProfile;
//#endregion
export { SplitComponent as component };
