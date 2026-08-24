import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { B as Search, P as Sparkles, Wt as Github, a as Users, i as WandSparkles, jt as Infinity$1, kn as Check, on as Crown } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-s-1huv4W.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/UpsellModal-CEnDkFkf.js
var import_jsx_runtime = require_jsx_runtime();
var premiumFeatures = [
	{
		icon: Sparkles,
		label: "AI Insights",
		description: "Get AI-powered summaries & recommendations"
	},
	{
		icon: WandSparkles,
		label: "Kickstart Template",
		description: "Generate prompts from simple descriptions"
	},
	{
		icon: Search,
		label: "Semantic Search",
		description: "Find conceptually similar artefacts"
	},
	{
		icon: Infinity$1,
		label: "Unlimited Artefacts",
		description: "No limits on prompts, skills, workflows"
	},
	{
		icon: Github,
		label: "GitHub Sync",
		description: "Sync your library to any repository"
	}
];
var teamFeatures = [{
	icon: Users,
	label: "Team Workspaces",
	description: "Collaborate with your entire team"
}];
function UpsellModal({ open, onOpenChange, feature }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
					className: "text-center pb-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-8 w-8 text-primary" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "text-xl font-bold",
							children: "Premium Feature"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-base",
							children: feature ? `${feature} is a Premium feature. Please contact support or wait until your AI credits reset.` : "This feature requires Querino Premium. Please contact support for more information."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2 py-2",
					children: [...premiumFeatures, ...teamFeatures].map(({ icon: Icon, label, description }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-primary" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-foreground",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: description
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "ml-auto mt-1 h-4 w-4 shrink-0 text-primary" })
						]
					}, label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 pt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "mailto:support@querino.ai",
						className: "w-full",
						onClick: () => onOpenChange(false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full gap-2",
							size: "lg",
							variant: "outline",
							children: "Contact Support"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => onOpenChange(false),
						className: "text-muted-foreground",
						children: "Close"
					})]
				})
			]
		})
	});
}
//#endregion
export { premiumFeatures as n, UpsellModal as t };
