import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { q as Printer } from "../_libs/lucide-react.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/community-guidelines-DBcRfDmZ.js
var import_jsx_runtime = require_jsx_runtime();
function CommunityGuidelines() {
	const handlePrint = () => {
		window.print();
	};
	const scrollToSection = (id) => {
		const element = document.getElementById(id);
		if (element) element.scrollIntoView({ behavior: "smooth" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 overflow-hidden pointer-events-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-3xl" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "relative z-10 pt-32 pb-20 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-w-6xl mx-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col lg:flex-row gap-12",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
							className: "lg:w-64 flex-shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:sticky lg:top-32",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold text-foreground mb-4",
									children: "Table of Contents"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
									className: "space-y-2 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("respect"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Respect and Safety"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("adult"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "No Adult or Sexual Content"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("malicious"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "No Malicious Content"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("privacy"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Privacy"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("ip"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Intellectual Property"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("spam"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "No Spam"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("enforcement"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Enforcement"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("appeals"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Appeals"
										})
									]
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 max-w-3xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between mb-8",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-4xl font-bold text-foreground mb-2",
									children: "Community Guidelines"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Last updated:" }), " April 2026"]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: handlePrint,
									className: "flex items-center gap-2 print:hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-4 h-4" }), "Print / Save PDF"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "prose prose-invert max-w-none space-y-6 text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Querino is a platform for discovering and sharing AI artifacts — prompts, skills, and workflows. These guidelines help keep our community safe, respectful, and useful for everyone." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "respect",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-semibold text-foreground mt-10 mb-4",
											children: "1. Respect and Safety"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Treat all community members with respect. Do not publish content that harasses, threatens, doxxes, or defames any person or group. This includes targeted attacks against platform creators, maintainers, or other users." })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "adult",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-semibold text-foreground mt-10 mb-4",
											children: "2. No Adult or Sexual Content"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Querino is not a platform for adult content. Do not publish erotica, pornography, sexually explicit material, or prompts designed to generate such content." })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "malicious",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "3. No Malicious Content"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Do not publish content designed to cause harm. This includes:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Malware, viruses, or exploit code embedded in skill files" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Phishing prompts or social engineering attack templates" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Prompts designed to bypass AI safety filters for harmful purposes" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Instructions for illegal activities" })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "privacy",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-semibold text-foreground mt-10 mb-4",
											children: "4. Privacy"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Do not share Personal Identifiable Information (PII) — yours or anyone else's. This includes email addresses, phone numbers, physical addresses, social security numbers, or other sensitive personal data. Our system automatically detects and blocks common PII patterns." })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "ip",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-semibold text-foreground mt-10 mb-4",
											children: "5. Intellectual Property"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Only publish content you have the right to share. Do not copy-paste copyrighted material without permission. Give credit where credit is due." })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "spam",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-semibold text-foreground mt-10 mb-4",
											children: "6. No Spam"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Do not mass-publish low-quality, duplicate, or auto-generated content designed to game the platform. Each artifact should provide genuine value." })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "enforcement",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "7. Enforcement"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "When you publish an artifact or post a comment, our moderation system automatically checks the content against these guidelines. If a violation is detected:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The content will be blocked from going public, but saved as a private draft" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You'll see a clear explanation of what was flagged" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Repeated violations result in automatic account suspension" })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "appeals",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-semibold text-foreground mt-10 mb-4",
											children: "Appeals"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
											"We know automated moderation isn't perfect. If you believe your content was incorrectly flagged, please contact us at",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: "mailto:support@querino.ai",
												className: "text-primary hover:text-primary/80 underline",
												children: "support@querino.ai"
											}),
											". Our team will review the case and, if it was a false positive, reverse the decision and clear any strikes from your account."
										] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "border-border my-8" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "These guidelines may be updated from time to time."
									})
								]
							})]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = CommunityGuidelines;
//#endregion
export { SplitComponent as component };
