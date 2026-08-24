import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { q as Printer } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/impressum-Bj4km020.js
var import_jsx_runtime = require_jsx_runtime();
var Impressum = () => {
	const handlePrint = () => {
		window.print();
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
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl mx-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between mb-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-4xl font-bold text-foreground mb-2",
							children: "Impressum"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Legal Notice" })
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: handlePrint,
							className: "flex items-center gap-2 print:hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "w-4 h-4" }), "Print / Save PDF"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "prose prose-invert max-w-none space-y-8 text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold text-foreground mb-4",
								children: "Information according to § 5 TMG"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-foreground font-medium",
										children: "Zelbel Ltd."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "69 Great Hampton Street" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Birmingham, B18 6EW" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "United Kingdom" })
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold text-foreground mb-4",
								children: "Contact"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									"Email:",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "mailto:support@querino.ai",
										className: "text-primary hover:underline",
										children: "support@querino.ai"
									})
								] })
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold text-foreground mb-4",
								children: "Represented by"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The Directors of Zelbel Ltd." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold text-foreground mb-4",
								children: "Company Registration"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Registered in England and Wales" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Companies House, United Kingdom" })]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold text-foreground mb-4",
								children: "Responsible for content according to § 55 Abs. 2 RStV"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-foreground font-medium",
										children: "Zelbel Ltd."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "69 Great Hampton Street" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Birmingham, B18 6EW" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "United Kingdom" })
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-2xl font-semibold text-foreground mb-4",
									children: "EU Dispute Resolution"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									"The European Commission provides a platform for online dispute resolution (ODR):",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "https://ec.europa.eu/consumers/odr/",
										target: "_blank",
										rel: "noopener noreferrer",
										className: "text-primary hover:underline",
										children: "https://ec.europa.eu/consumers/odr/"
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2",
									children: "We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board."
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-2xl font-semibold text-foreground mb-4",
									children: "Liability for Content"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 Abs.1 TMG. According to §§ 8 to 10 TMG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2",
									children: "Obligations to remove or block the use of information under general law remain unaffected. However, liability in this regard is only possible from the time of knowledge of a specific infringement. Upon becoming aware of corresponding infringements, we will remove this content immediately."
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-2xl font-semibold text-foreground mb-4",
									children: "Liability for Links"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages. The linked pages were checked for possible legal violations at the time of linking. Illegal contents were not recognizable at the time of linking." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2",
									children: "However, a permanent control of the contents of the linked pages is not reasonable without concrete evidence of a violation of the law. Upon becoming aware of legal violations, we will remove such links immediately."
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-2xl font-semibold text-foreground mb-4",
									children: "Copyright"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The content and works created by the site operators on these pages are subject to copyright law. Duplication, processing, distribution, or any form of commercialization of such material beyond the scope of copyright law requires the prior written consent of its respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2",
									children: "Insofar as the content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is marked as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of legal violations, we will remove such content immediately."
								})
							] }),
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
										}),
										" ",
										"|",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
											to: "/cookies",
											className: "text-primary hover:underline",
											children: "Cookie Policy"
										})
									]
								})
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
};
var SplitComponent = Impressum;
//#endregion
export { SplitComponent as component };
