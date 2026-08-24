import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { q as Printer } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cookies-DphioLzg.js
var import_jsx_runtime = require_jsx_runtime();
var Cookies = () => {
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
											onClick: () => scrollToSection("interpretation"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Interpretation and Definitions"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("use"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "The Use of Cookies"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("choices"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Your Choices Regarding Cookies"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("more"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "More Information"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => scrollToSection("contact"),
											className: "block text-muted-foreground hover:text-foreground transition-colors text-left",
											children: "Contact Us"
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
									children: "Cookies Policy"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Last updated:" }), " December 6, 2025"]
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This Cookies Policy explains what Cookies are and how We use them. You should read this policy so You can understand what type of cookies We use, or the information We collect using Cookies and how that information is used." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Cookies do not typically contain any information that personally identifies a user, but personal information that we store about You may be linked to the information stored in and obtained from Cookies. For further information on how We use, store and keep your personal data secure, see our",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: "/privacy",
											className: "text-primary hover:underline",
											children: "Privacy Policy"
										}),
										"."
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We do not store sensitive personal information, such as mailing addresses, account passwords, etc. in the Cookies We use." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "interpretation",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Interpretation and Definitions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Interpretation"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Definitions"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "For the purposes of this Cookies Policy:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Company"
														}),
														" ",
														"(referred to as either \"the Company\", \"We\", \"Us\" or \"Our\" in this Cookies Policy) refers to Zelbel Ltd., 69 Great Hampton Street Birmingham, B18 6EW United Kingdom."
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Cookies"
													}), " means small files that are placed on Your computer, mobile device or any other device by a website, containing details of your browsing history on that website among its many uses."] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Website"
														}),
														" ",
														"refers to Querino, accessible from https://querino.ai"
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "You"
													}), " means the individual accessing or using the Website, or a company, or any legal entity on behalf of which such individual is accessing or using the Website, as applicable."] })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "use",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "The Use of Cookies"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xl font-medium text-foreground mt-6 mb-3",
												children: "Type of Cookies We Use"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Cookies can be \"Persistent\" or \"Session\" Cookies. Persistent Cookies remain on your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close your web browser." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "We use both session and persistent Cookies for the purposes set out below:"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-4 mt-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Necessary / Essential Cookies"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Type: Session Cookies",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Administered by: Us",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Purpose: These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services."
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-foreground",
														children: "Functionality Cookies"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Type: Persistent Cookies",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Administered by: Us",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Purpose: These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website."
												] })]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "choices",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Your Choices Regarding Cookies"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If You prefer to avoid the use of Cookies on the Website, first You must disable the use of Cookies in your browser and then delete the Cookies saved in your browser associated with this website. You may use this option for preventing the use of Cookies at any time." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "If You do not accept Our Cookies, You may experience some inconvenience in your use of the Website and some features may not function properly."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2",
												children: "If You'd like to delete Cookies or instruct your web browser to delete or refuse Cookies, please visit the help pages of your web browser."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc pl-6 space-y-2 mt-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														"For the",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Chrome"
														}),
														" web browser, please visit this page from Google:",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
															href: "https://support.google.com/accounts/answer/32050",
															target: "_blank",
															rel: "noopener noreferrer",
															className: "text-primary hover:underline",
															children: "https://support.google.com/accounts/answer/32050"
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														"For the",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Internet Explorer"
														}),
														" ",
														"web browser, please visit this page from Microsoft:",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
															href: "http://support.microsoft.com/kb/278835",
															target: "_blank",
															rel: "noopener noreferrer",
															className: "text-primary hover:underline",
															children: "http://support.microsoft.com/kb/278835"
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														"For the",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Firefox"
														}),
														" web browser, please visit this page from Mozilla:",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
															href: "https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored",
															target: "_blank",
															rel: "noopener noreferrer",
															className: "text-primary hover:underline",
															children: "https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored"
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
														"For the",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-foreground",
															children: "Safari"
														}),
														" web browser, please visit this page from Apple:",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
															href: "https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac",
															target: "_blank",
															rel: "noopener noreferrer",
															className: "text-primary hover:underline",
															children: "https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "For any other web browser, please visit your web browser's official web pages." })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "more",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-semibold text-foreground mt-10 mb-4",
											children: "More Information about Cookies"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
											"You can learn more about cookies:",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: "https://www.allaboutcookies.org/what-are-cookies/",
												target: "_blank",
												rel: "noopener noreferrer",
												className: "text-primary hover:underline",
												children: "What Are Cookies?"
											})
										] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										id: "contact",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-2xl font-semibold text-foreground mt-10 mb-4",
												children: "Contact Us"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If you have any questions about this Cookies Policy, You can contact us:" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "list-disc pl-6 mt-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
													"By email:",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
														href: "mailto:support@querino.ai",
														className: "text-primary hover:underline",
														children: "support@querino.ai"
													})
												] })
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-10 pt-6 border-t border-border",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm",
											children: [
												"See also:",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
													to: "/privacy",
													className: "text-primary hover:underline",
													children: "Privacy Policy"
												}),
												" ",
												"|",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
													to: "/terms",
													className: "text-primary hover:underline",
													children: "Terms of Service"
												})
											]
										})
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
};
var SplitComponent = Cookies;
//#endregion
export { SplitComponent as component };
