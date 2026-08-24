import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { $t as FileText, B as Search, Bn as ArrowRight, In as BookOpen, Jt as GitBranch, M as Star, P as Sparkles, Pt as History, R as Settings, St as Lightbulb, T as Terminal, Ut as Globe, W as RefreshCw, Zt as FolderOpen, a as Users, at as Package, cn as Copy, gn as Cloud, i as WandSparkles, in as Download, lt as MessageSquare, r as Workflow, rt as PenLine, t as Zap, u as Upload } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/docs-DbJATZZt.js
var import_jsx_runtime = require_jsx_runtime();
function SectionHeader({ icon: Icon, title, id, iconClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 mb-6",
		id,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-2 rounded-lg bg-primary/10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: iconClassName || "h-6 w-6 text-primary" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-2xl font-bold",
			children: title
		})]
	});
}
function Tip({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "bg-primary/5 border border-primary/20 p-4 rounded-lg mt-4 mb-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted-foreground flex items-start gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "h-4 w-4 text-primary mt-0.5 flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children })]
		})
	});
}
function Docs() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "border-b border-border bg-gradient-to-b from-muted/30 to-background py-16",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "container mx-auto px-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "max-w-3xl mx-auto text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "mb-4",
										children: "Documentation"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "text-4xl font-bold tracking-tight text-foreground mb-4",
										children: "Learn to use Querino"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg text-muted-foreground",
										children: "A friendly guide to everything Querino can do for you — from creating your first prompt or prompt kit to building a team library and connecting external AI assistants over MCP."
									})
								]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "py-12 border-b border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "container mx-auto px-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 max-w-5xl mx-auto",
								children: [
									{
										icon: BookOpen,
										label: "Getting Started",
										href: "#getting-started"
									},
									{
										icon: Lightbulb,
										label: "Prompts",
										href: "#prompts"
									},
									{
										icon: Package,
										label: "Prompt Kits",
										href: "#prompt-kits"
									},
									{
										icon: Sparkles,
										label: "Skills",
										href: "#skills"
									},
									{
										icon: Workflow,
										label: "Workflows",
										href: "#workflows"
									},
									{
										icon: FolderOpen,
										label: "Collections",
										href: "#collections"
									},
									{
										icon: Users,
										label: "Teams",
										href: "#teams"
									},
									{
										icon: WandSparkles,
										label: "AI Tools",
										href: "#ai-tools"
									},
									{
										icon: History,
										label: "Versioning",
										href: "#versioning"
									},
									{
										icon: FileText,
										label: "Import & Export",
										href: "#import-export"
									},
									{
										icon: GitBranch,
										label: "GitHub Sync",
										href: "#github-sync"
									},
									{
										icon: Terminal,
										label: "MCP Server",
										href: "#mcp"
									},
									{
										icon: Cloud,
										label: "Menerio",
										href: "#menerio"
									}
								].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: item.href,
									className: "flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium",
										children: item.label
									})]
								}, item.label))
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "container mx-auto px-4 py-12 max-w-4xl space-y-20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: BookOpen,
									title: "Getting Started",
									id: "getting-started"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Querino is your home for AI artifacts — prompts, prompt kits, skills, and workflows. Whether you want to find a great prompt someone else created, build a personal library, or share knowledge with your team, this is the place."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: "mb-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
												className: "text-lg",
												children: "Your first steps"
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
												className: "space-y-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold",
															children: "1"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Browse the Discover page"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm text-muted-foreground",
															children: [
																"Head to",
																" ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
																	to: "/discover",
																	className: "text-primary hover:underline",
																	children: "Discover"
																}),
																" ",
																"and explore what the community has published. You can filter by type, category, or just search for a topic."
															]
														})] })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold",
															children: "2"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Create an account"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-muted-foreground",
															children: "Sign up with your email to unlock saving, creating, and rating artifacts. It only takes a moment."
														})] })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold",
															children: "3"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Create your first artifact"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm text-muted-foreground",
															children: [
																"Use the ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"+ Create\"" }),
																" button in the header to write a prompt, prompt kit, skill, or workflow. Not sure what to write? Try the",
																" ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
																	to: "/prompts/wizard",
																	className: "text-primary hover:underline",
																	children: "Kickstart Template"
																}),
																" ",
																"— it generates a prompt from a short description."
															]
														})] })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold",
															children: "4"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Build your library"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm text-muted-foreground",
															children: [
																"Your",
																" ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
																	to: "/library",
																	className: "text-primary hover:underline",
																	children: "Library"
																}),
																" ",
																"shows everything you've created. Pin your favorites, organize with collections, and iterate over time."
															]
														})] })]
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "What can you do here?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-3 md:grid-cols-2",
											children: [
												{
													icon: Search,
													text: "Search across all artifact types"
												},
												{
													icon: Copy,
													text: "One-click copy any content to clipboard"
												},
												{
													icon: Star,
													text: "Rate and review community artifacts"
												},
												{
													icon: Download,
													text: "Export artifacts as Markdown files"
												},
												{
													icon: Upload,
													text: "Import prompts from Markdown"
												},
												{
													icon: WandSparkles,
													text: "Generate and refine prompts with AI"
												},
												{
													icon: History,
													text: "Track changes with version history"
												},
												{
													icon: Globe,
													text: "Translate artifacts between languages"
												},
												{
													icon: Users,
													text: "Collaborate in team workspaces"
												},
												{
													icon: Cloud,
													text: "Sync to Menerio for a second brain"
												}
											].map((feature) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(feature.icon, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm",
													children: feature.text
												})]
											}, feature.text))
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Lightbulb,
									title: "Prompts",
									id: "prompts"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Prompts are the heart of Querino. A prompt is a set of instructions you give to an AI model — the clearer your prompt, the better the output. Querino helps you write, store, refine, and share them."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Creating a prompt"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"Click ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"+ Create\" → \"Prompt\"" }),
												" in the header. The editor gives you a comfortable writing area with line numbers. Fill in:"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
											className: "space-y-3 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Content" }), " — The actual prompt text. Be specific about what you want the AI to do, include context, and describe the expected output format."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Title & Description" }), " — A clear name and a one-liner so you (and others) can find it later."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Category" }), " — Choose from Writing, Coding, Business, Creative, Research, or Education."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Language" }), " — Indicate the language the prompt is written in."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Tags" }), " — Add a few keywords to make searching easier."] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tip, { children: [
											"Not sure how to fill in the metadata? Click",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Suggest with AI\"" }),
											" while editing — Querino's AI reads your prompt content and proposes a title, description, category, and tags for you."
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Visibility: private vs. public"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"Every new artifact starts out ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "private" }),
												" — only you can see it. When you're happy with it, toggle it to",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "public" }),
												" on the detail page. Public prompts appear on the Discover page for the whole community to find, rate, and clone."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "What you can do with a prompt"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid gap-3 md:grid-cols-2 mb-6",
											children: [
												{
													icon: Copy,
													label: "Copy",
													desc: "Copy the content to your clipboard with one click."
												},
												{
													icon: PenLine,
													label: "Edit",
													desc: "Update content, metadata, and tags at any time."
												},
												{
													icon: History,
													label: "Versions",
													desc: "Browse and compare previous versions."
												},
												{
													icon: Star,
													label: "Rate & Review",
													desc: "Leave a rating and comment on public prompts."
												},
												{
													icon: MessageSquare,
													label: "Comment",
													desc: "Discuss a prompt with the community."
												},
												{
													icon: Copy,
													label: "Clone",
													desc: "Duplicate a prompt into your own library."
												},
												{
													icon: Globe,
													label: "Translate",
													desc: "Translate a prompt to another language using AI."
												},
												{
													icon: Cloud,
													label: "Sync to Menerio",
													desc: "Mirror the prompt as a note in your Menerio."
												}
											].map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3 p-3 rounded-lg border border-border bg-card",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(a.icon, { className: "h-4 w-4 text-primary mt-0.5 flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-medium",
													children: a.label
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: a.desc
												})] })]
											}, a.label))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Tips for writing great prompts"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Be specific about the output format (e.g. \"return a JSON object with…\")" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Provide context and constraints — who is the audience? What length?" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Include examples of desired output when helpful" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Break complex tasks into numbered steps" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Test with multiple AI models to see which works best" })
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Package,
									title: "Prompt Kits",
									id: "prompt-kits"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: [
												"A ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Prompt Kit" }),
												" is a curated bundle of related prompts — a single Markdown article with multiple prompts grouped under one topic. Use kits when several prompts belong together: an onboarding kit, a content production playbook, a research toolkit, etc."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "How a kit is structured"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"Kits use a rich Markdown editor with a familiar toolbar (headings, lists, links, code, quotes, …). Between your prose, you insert dedicated ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "prompt blocks" }),
												". On the storage side this is a single Markdown document where each prompt is introduced by a ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "## Prompt: <title>" }),
												" ",
												"heading, so kits import and export cleanly as plain Markdown."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Creating a kit"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
											className: "space-y-3 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Click ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"+ Create\" → \"Prompt Kit\"" }),
													" in the header."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Write an intro that explains what the kit is for and how to use it." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Click ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Insert prompt\"" }),
													" in the toolbar to add a prompt block, give it a title, and write the prompt body."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Repeat for as many prompts as you need, with explanatory text in between." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Fill in title, description, category, language, and tags — or use ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Suggest with AI\"" }),
													"."
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tip, { children: [
											"Markdown shortcuts work in the editor: type ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "#" }),
											" + space for H1, ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "##" }),
											" for H2, ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "-" }),
											" for a list,",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: ">" }),
											" for a quote, and so on."
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Reading a kit"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"On the detail page a kit renders as an article: your prose flows naturally and each prompt block appears as a card with a one-click ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Copy" }),
												" button — readers can grab any individual prompt without losing the surrounding context."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "When to use a kit instead of a prompt"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"You have ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "multiple prompts" }),
													" that only make sense together."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"You want to share ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "guidance and context" }),
													" ",
													"alongside the prompts themselves."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"You're publishing a",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "playbook, workshop, or template pack" }),
													" rather than a single instruction."
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mt-4",
											children: "Kits support all the same actions as prompts: versioning, ratings and reviews, comments, suggestions, cloning, AI Coach and Insights, translation, Markdown import/export, GitHub Sync, Menerio sync, and team sharing."
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Sparkles,
									title: "Skills",
									id: "skills"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "A skill is a reusable prompt framework — think of it as a \"personality\" or \"role\" you can assign to an AI. Skills are great for system prompts, personas, or structured templates you use over and over."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "When should you create a skill?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "System prompts" }), " — Define an AI's personality, tone, rules, and capabilities. For example: \"You are a senior code reviewer. Always explain your reasoning.\""] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Reusable frameworks" }), " — A structured template for recurring tasks like code reviews, blog post outlines, or meeting summaries."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Parameterized templates" }), " — Skills with placeholder variables that get filled in for each use."] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Skills vs. Prompts"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"A ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "prompt" }),
												" is a specific instruction for a single task (\"Write me a blog post about…\"). A ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "skill" }),
												" ",
												"is a broader definition of how the AI should behave across many tasks. You might use a \"Technical Writer\" skill as the system prompt, and then send individual prompts within that conversation."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, { children: "Skills support Markdown formatting, so you can structure them with headings, bullet points, and code blocks for clarity." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Examples"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-lg border border-border bg-card",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-medium mb-1",
														children: "Technical Writer"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm text-muted-foreground",
														children: "Instructs the AI to write clear, concise documentation. Defines tone, formatting rules, and audience expectations."
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-lg border border-border bg-card",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-medium mb-1",
														children: "Code Reviewer"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm text-muted-foreground",
														children: "A structured framework for analyzing code: security checks, performance, readability, and actionable improvement suggestions."
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-lg border border-border bg-card",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-medium mb-1",
														children: "Friendly Customer Support"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm text-muted-foreground",
														children: "Sets the AI's personality to be warm, empathetic, and solution-oriented when handling customer queries."
													})]
												})
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Workflow,
									title: "Workflows",
									id: "workflows"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Workflows are step-by-step processes documented in Markdown. They describe how to achieve something — an automation recipe, a standard operating procedure, or a multi-step AI pipeline."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "What goes into a workflow?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A clear description of the goal" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Step-by-step instructions, broken into logical phases" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tools, prompts, or skills referenced along the way" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Expected inputs and outputs at each step" })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Example use cases"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-4 rounded-lg border border-border bg-card",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-medium mb-1",
													children: "Content Creation Pipeline"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "1. Research topic → 2. Generate outline → 3. Write draft → 4. Review & edit → 5. Format for publication"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-4 rounded-lg border border-border bg-card",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-medium mb-1",
													children: "Bug Report Triage"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Reproduce → Classify severity → Identify root cause → Write fix plan → Assign"
												})]
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: FolderOpen,
									title: "Collections",
									id: "collections"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Collections let you group related artifacts together — like playlists, but for prompts, skills, and workflows."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "How to use collections"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
											className: "space-y-3 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Go to",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
														to: "/collections",
														className: "text-primary hover:underline",
														children: "Collections"
													}),
													" ",
													"and click \"Create Collection.\""
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Give it a name and description (e.g. \"Marketing prompts\" or \"Onboarding kit for new devs\")." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Add artifacts from your library or from public content. You can mix all artifact types." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Optionally make the collection public so others can discover your curated set." })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Ideas for collections"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Group prompts by project or client" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Create \"starter kits\" for specific roles or tasks" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Curate a \"best of\" list for the community" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Organize team resources by topic or department" })
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Users,
									title: "Teams",
									id: "teams"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Teams let multiple people work in a shared library. Everyone on the team can create, edit, and browse the same set of artifacts — perfect for organizations that want to standardize how they use AI."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Setting up a team"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
											className: "space-y-3 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Click the ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "workspace picker" }),
													" in the header (it shows \"Personal\" by default)."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Select ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Create Team\"" }),
													" and give it a name."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Open ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Team Settings" }),
													" to find the Team ID."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Share the Team ID with your colleagues — they enter it in their",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
														to: "/settings",
														className: "text-primary hover:underline",
														children: "Settings"
													}),
													" ",
													"to join."
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Team roles"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-3 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Owner" }),
													" — Full control. Can delete the team and manage all settings.",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block text-sm mt-1 text-muted-foreground/80",
														children: "Automatically assigned to whoever creates the team."
													})
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Admin" }),
													" — Can manage members (change roles, remove people) and team settings.",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block text-sm mt-1 text-muted-foreground/80",
														children: "Promoted by the Owner via Team Settings."
													})
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Member" }),
													" — Can create, edit, and view team artifacts.",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block text-sm mt-1 text-muted-foreground/80",
														children: "Default role when joining via Team ID."
													})
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Switching workspaces"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground",
											children: "Use the workspace picker in the header to switch between your personal library and any team workspace. Anything you create belongs to the workspace you currently have selected."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, { children: "You can copy personal artifacts to a team workspace directly from the artifact detail page — handy for sharing your best work with colleagues." })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: WandSparkles,
									title: "AI-Powered Tools",
									id: "ai-tools"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Querino includes a suite of AI tools to help you create better artifacts faster. These features use AI credits from your account."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-6",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
													className: "text-base flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-4 w-4 text-primary" }), "Kickstart Template (Prompt Wizard)"]
												}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Describe what you need in a few words — e.g. \"a prompt that helps me write better emails\" — and the Wizard generates a full, well-structured prompt for you. It's the fastest way to get started."
												}) })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
													className: "text-base flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-primary" }), "Suggest with AI"]
												}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Available on every edit form. Click \"Suggest with AI\" and Querino reads your content, then proposes a title, description, category, and tags. You can accept, modify, or discard each suggestion."
												}) })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
													className: "text-base flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4 text-primary" }), "Prompt Refinement"]
												}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Already have a prompt but feel it could be better? The Refinement tool takes your existing prompt and improves it — making it clearer, more detailed, or more effective. You describe what you'd like to change, and the AI does the rest."
												}) })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
													className: "text-base flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4 text-primary" }), "AI Coach"]
												}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Get interactive feedback on the quality of your prompts, skills, or workflows. The Coach analyzes structure, clarity, and completeness, then offers specific tips for improvement."
												}) })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
													className: "text-base flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-primary" }), "AI Insights"]
												}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "A deeper analysis of any artifact. Insights provides quality scores, identifies strengths and weaknesses, recommends improvements, and suggests relevant tags — all powered by AI."
												}) })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
													className: "text-base flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4 text-primary" }), "AI Translation"]
												}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Translate any artifact — title, description, content, and tags — into another language. The translation preserves formatting and technical terms. A translated copy is created in your library so the original stays untouched."
												}) })] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tip, { children: [
											"AI features consume credits. You can see your remaining credits in",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
												to: "/settings",
												className: "text-primary hover:underline",
												children: "Settings"
											}),
											"."
										] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: History,
									title: "Version History",
									id: "versioning"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Every time you save changes to an artifact, Querino keeps a snapshot of the previous version. This means you can always look back, compare, and even restore an older version if needed."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "How it works"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Open any artifact you own and click",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Version History\"" }),
													" in the sidebar."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You'll see a timeline of all saved versions, each with a timestamp and optional change notes." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Click on any version to see its full content." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Use the ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "compare view" }),
													" to see a side-by-side diff between two versions."
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tip, { children: [
											"When saving, you can add a short ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "change note" }),
											" ",
											"(e.g. \"Added error handling section\") to make it easier to understand what changed later."
										] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: FileText,
									title: "Import & Export",
									id: "import-export"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: [
												"Querino uses Markdown as its universal format. You can export your artifacts to ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: ".md" }),
												" files and import them back — making it easy to back up, share, or move between tools."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Exporting"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"On any artifact detail page, click the ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Download" }),
												" ",
												"button. The exported file includes YAML frontmatter (title, description, tags, category, language) followed by the full content."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Importing"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"When creating a new prompt, click",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Import from Markdown\"" }),
												" and select a",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: ".md" }),
												" file. Querino reads the frontmatter to pre-fill metadata and loads the content into the editor."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "GitHub Sync"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"Need automated backups instead of one-off downloads? Querino can push your entire library to a GitHub repository as Markdown files. See the dedicated",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "#github-sync",
													className: "text-primary hover:underline",
													children: "GitHub Sync"
												}),
												" ",
												"section below for setup instructions."
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: GitBranch,
									title: "GitHub Sync",
									id: "github-sync"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "GitHub Sync mirrors your Querino artifacts to a GitHub repository as Markdown files. Use it for off-site backups, version control in Git, parallel editing in your IDE, or to feed your prompts into other tooling."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "How it works"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "list-disc pl-6 space-y-2 text-muted-foreground mb-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Automatic on save and delete" }), " — every time you create, update, or delete a prompt, prompt kit, skill or workflow, the change is queued and pushed to GitHub within ~30 seconds. No button click required."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "One-way sync" }), " — Querino → GitHub. Edits made directly on GitHub are not pulled back and will be overwritten on the next save."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Markdown with YAML frontmatter" }), " — same format as Import & Export, so files stay readable in any editor."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Organized by type" }), " — prompts, prompt kits, skills and workflows are written to subfolders inside your chosen folder."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Deduplicated & rename-safe" }), " — each artifact has a stable filename derived from its slug. If you rename an artifact, the old file is removed and the new one is created in the same commit cycle."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Workspace-aware" }), " — your personal workspace and each team workspace have independent configurations and push to their own repositories."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Stats updates are ignored" }), " — purely cosmetic changes like rating averages or copy counts do not trigger a sync, so your repo stays free of noise commits."] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "When does sync run?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-4",
											children: "Whenever you save or delete an artifact, Querino writes a small entry to an internal queue. A background worker runs every ~30 seconds, picks up pending entries, and applies them to GitHub. In practice this means a commit usually appears in your repo within a minute of your save. If multiple quick saves happen in the same window, only the latest version is pushed — older queue entries are collapsed."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"If GitHub Sync is not configured (no token, sync disabled, or no repository set), the queue entry is silently marked as",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "skipped" }),
												". Once you configure GitHub later, only changes from that point on will be pushed automatically — use the manual",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sync now" }),
												" button in Settings to push everything that already exists as a one-time backfill."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Setup"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
											className: "list-decimal pl-6 space-y-3 text-muted-foreground mb-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Create a Personal Access Token (Classic)" }),
													" on GitHub at",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: "https://github.com/settings/tokens/new?scopes=repo&description=Querino%20Sync",
														target: "_blank",
														rel: "noopener noreferrer",
														className: "text-primary hover:underline",
														children: "github.com/settings/tokens"
													}),
													". The only scope you need is ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "repo" }),
													". Copy the token immediately — GitHub only shows it once."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Create or pick a target repository." }), " It can be public or private. Make sure the branch you want to push to already exists."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Open",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
														to: "/settings",
														className: "text-primary hover:underline",
														children: "Settings → Integrations → GitHub Sync"
													}),
													" ",
													"and paste your token."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Fill in the ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "repository" }),
													" in",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "owner/name" }),
													" format (e.g.",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "jane-doe/my-prompts" }),
													"), the ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "branch" }),
													" ",
													"(default ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "main" }),
													"), and an optional",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "folder path" }),
													" like ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "querino" }),
													" if you want everything nested under a subfolder."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"Click ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Test Connection" }),
													". If it turns green, click ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Enable GitHub Sync" }),
													" and then",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Save GitHub Settings" }),
													"."
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tip, { children: [
											"Use a token ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "fine-grained" }),
											" only to the target repository if you prefer least-privilege access — make sure to grant ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Contents: Read & Write" }),
											"."
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Personal vs. Team sync"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-4",
											children: "Each workspace has its own sync settings:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "list-disc pl-6 space-y-2 text-muted-foreground mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Personal workspace" }), " — only you push, using your own token."] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Team workspace" }), " — the team's owner or an admin configures the shared repository. Members with editor access (or higher) can trigger syncs using a token they store on their own profile, scoped to that team."] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-4",
											children: "Switch workspaces with the workspace picker in the header before opening Settings — the GitHub Sync card always reflects the active workspace."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Repository layout"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-4",
											children: "Inside the folder you configured, Querino creates one subfolder per artifact type:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
											className: "bg-muted p-4 rounded-lg text-sm overflow-x-auto",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: `<your-folder>/
├── prompts/
│   └── my-research-prompt.md
├── prompt-kits/
│   └── product-launch-kit.md
├── skills/
│   └── code-review.md
└── workflows/
    └── content-pipeline.md` })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Troubleshooting"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "list-disc pl-6 space-y-2 text-muted-foreground mb-6",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Repository not found\"" }),
													" — double-check the",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "owner/name" }),
													" format and that your token has access to that repo."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Bad credentials\"" }), " — the token expired or was revoked. Generate a new one and paste it again."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Push fails on a protected branch" }), " — either point Querino at an unprotected branch or relax your branch protection rules for the token's user."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Nothing happens after saving" }),
													" — make sure the",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Enable GitHub Sync" }),
													" switch is on and a valid token + repository are saved. Without it, queue entries are marked",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "skipped" }),
													" and never reach GitHub."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "My change isn't on GitHub yet" }), " — sync runs every ~30 seconds in the background, so allow up to a minute. If it still doesn't appear, check Settings → GitHub Sync for any error message on the most recent attempt."] })
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: MessageSquare,
									title: "Community Features",
									id: "community"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: "Querino is more than a personal tool — it's a community. Here's how you can interact with other users' work."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Ratings & Reviews"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-4",
											children: "Found a great prompt? Give it a star rating (1–5) and optionally leave a short review. Ratings help surface the best content in search results and on the Discover page."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Comments"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-4",
											children: "Every public artifact has a comment section. Ask questions, share how you've used a prompt, or give feedback. Comments support threaded replies, so conversations stay organized."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Suggestions"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"Think a public artifact could be improved? Submit a",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "suggestion" }),
												" — you write your proposed content change and the author can review and accept it, similar to a pull request. It's a respectful way to contribute to someone else's work."
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Terminal,
									title: "MCP Server",
									id: "mcp"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: [
												"Querino exposes its full library over the",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Model Context Protocol (MCP)" }),
												". Connect an external AI assistant — Claude Desktop, Claude Code, Cursor, or any MCP-aware client — and it can read, search, create, update and delete your prompts, prompt kits, skills, workflows and collections directly."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Connection details"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Endpoint:" }),
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "https://mcp.querino.ai" })
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Transport:" }), " MCP Streamable HTTP (JSON-RPC 2.0 over POST; SSE responses supported)"] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Auth:" }),
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "Authorization: Bearer <your-token>" })
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Personal API tokens"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"Authenticate with a long-lived",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Querino MCP token" }),
												" (prefix ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "qrn_mcp_" }),
												"). Generate one in",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
													to: "/settings",
													className: "text-primary hover:underline",
													children: "Settings → MCP Tokens"
												}),
												". Tokens don't expire after an hour like a session — they remain valid until you revoke them (or until an optional expiry date you set)."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, { children: "Treat MCP tokens like passwords. You can have several tokens at once (one per device or assistant) and revoke any of them individually." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "What an assistant can do"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-4",
											children: "Once connected, your assistant gets a full toolset to manage your library:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Prompts, Prompt Kits, Skills, Workflows" }), " — list, search, get, create, update, delete."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Collections" }), " — list, get with items, create, delete."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Profile" }), " — read and update your own profile."] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Setup"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground",
											children: [
												"Open",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
													to: "/settings",
													className: "text-primary hover:underline",
													children: "Settings → MCP Setup"
												}),
												" ",
												"for ready-to-paste configuration snippets and a generated onboarding prompt you can hand to your assistant — it includes the endpoint, headers, your token placeholder, and a description of every tool."
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Cloud,
									title: "Menerio Integration",
									id: "menerio"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "https://menerio.app",
													target: "_blank",
													rel: "noopener noreferrer",
													className: "text-primary hover:underline",
													children: "Menerio"
												}),
												" ",
												"is a personal knowledge management app — your \"second brain.\" The Querino–Menerio integration mirrors your artifacts as searchable notes in Menerio, so you can find them alongside your other knowledge."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Connecting your account"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
											className: "space-y-3 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"In Menerio, go to ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Settings → Connections" }),
													" and generate a ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Connection Key" }),
													" for Querino."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"In Querino, open",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
														to: "/settings",
														className: "text-primary hover:underline",
														children: "Settings"
													}),
													" ",
													"and find the ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Menerio" }),
													" section."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Paste the Connection Key and click ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Connect.\"" })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"If everything checks out, you'll see a green",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Connected\"" }),
													" badge with your Menerio display name."
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Syncing artifacts"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mb-2",
											children: "Once connected, you have three ways to sync:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-3 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Manual sync" }),
													" — On any artifact detail page, click the ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Sync to Menerio\"" }),
													" button. A small cloud icon indicates the current sync status."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Automatic sync" }),
													" — Enable",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Auto-Sync" }),
													" in the Menerio settings. Whenever you update an already-synced artifact, the changes are pushed to Menerio automatically within about a minute."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Bulk sync" }),
													" — In the Menerio settings section, click ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Sync all\"" }),
													" to sync every artifact in your library at once. A progress bar shows how it's going."
												] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Sync status indicators"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground mb-4",
											children: [
												"In your library and list views, synced artifacts show a small",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "cloud icon" }),
												" next to their title. You can also filter by sync status to quickly see which artifacts are synced and which aren't."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "Disconnecting"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground",
											children: "You can disconnect at any time in Settings. Your notes in Menerio will remain — they just won't receive updates from Querino anymore. You can also click \"Remove all syncs\" to clear the sync metadata from all artifacts without deleting the Menerio notes."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, { children: "You can choose which artifact types to sync (Prompts, Prompt Kits, Skills, Workflows) in the Menerio settings. This is useful if you only want certain types to appear in your Menerio knowledge base." })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: ArrowRight,
									title: "Typical Workflows",
									id: "typical-workflows"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground text-lg mb-6",
										children: "Here are some common ways people use Querino day to day."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
												className: "text-base",
												children: "Building a personal prompt library"
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
												className: "text-sm text-muted-foreground space-y-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Create prompts as you use them in your daily AI work." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. Use \"Suggest with AI\" to quickly fill in metadata." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. Organize with tags and collections." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "4. Refine your best prompts over time — version history keeps track of changes." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "5. Export to Markdown or sync to GitHub for backup." })
												]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
												className: "text-base",
												children: "Standardizing AI usage in a team"
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
												className: "text-sm text-muted-foreground space-y-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Create a team workspace and invite your colleagues." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. Build a shared library of approved prompts and skills." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. Use skills as system prompts so everyone gets consistent AI behavior." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "4. Document processes as workflows so new team members can follow them." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "5. Use reviews and comments to iterate on quality together." })
												]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
												className: "text-base",
												children: "Creating a polished public prompt"
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
												className: "text-sm text-muted-foreground space-y-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Start with the Kickstart Template to generate a first draft." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. Edit and refine the content in the editor." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. Use the AI Coach to get feedback on clarity and completeness." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "4. Run AI Insights for a quality score and improvement tips." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "5. Toggle to public and share the link with the community." })
												]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
												className: "text-base",
												children: "Syncing your knowledge to Menerio"
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
												className: "text-sm text-muted-foreground space-y-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Connect Menerio in Settings using your Connection Key." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. Use \"Sync all\" to push your entire library at once." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. Enable Auto-Sync so future changes flow automatically." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "4. Your prompts and skills are now searchable in Menerio alongside your other notes." })
												]
											})] })
										]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "scroll-mt-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
									icon: Settings,
									title: "Settings & Account",
									id: "settings"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "prose prose-neutral dark:prose-invert max-w-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-muted-foreground text-lg mb-6",
											children: [
												"Your",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
													to: "/settings",
													className: "text-primary hover:underline",
													children: "Settings"
												}),
												" ",
												"page is where you manage your profile, integrations, and account preferences."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-lg font-semibold mt-8 mb-4",
											children: "What you'll find there"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "space-y-2 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Profile" }), " — Display name, avatar, bio, and social links."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "AI Credits" }), " — See your current balance and usage history."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "GitHub Sync" }), " — Configure automatic backup to a GitHub repository."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Menerio" }), " — Connect or disconnect your Menerio account."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "MCP Setup & Tokens" }),
													" — Generate long-lived",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "qrn_mcp_" }),
													" tokens and copy ready-made configuration for connecting Querino to AI assistants via the",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
														to: "/docs#mcp",
														className: "text-primary hover:underline",
														children: "Model Context Protocol"
													}),
													"."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Team membership" }), " — Join a team by entering the Team ID."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Account" }), " — Manage your subscription and account deletion."] })
											]
										})
									]
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = Docs;
//#endregion
export { SplitComponent as component };
