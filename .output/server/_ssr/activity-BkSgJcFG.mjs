import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Hn as Activity } from "../_libs/lucide-react.mjs";
import { i as useAuth, n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { r as useOwnActivityFeed, t as ActivityTimeline } from "./ActivityTimeline-DTJ1Wotr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/activity-BkSgJcFG.js
var import_jsx_runtime = require_jsx_runtime();
function Activity$1() {
	const { user } = useAuth();
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useOwnActivityFeed(user?.id);
	const events = data?.pages.flat() || [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-grow container mx-auto px-4 py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl mx-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 mb-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 bg-primary/10 rounded-xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-8 w-8 text-primary" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl font-bold text-foreground",
							children: "Your activity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "Everything you have done across your prompts, skills and workflows"
						})] })]
					}), user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border border-border rounded-lg bg-card overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityTimeline, {
							events,
							isLoading,
							isFetchingNextPage,
							hasNextPage: hasNextPage ?? false,
							fetchNextPage,
							emptyMessage: "Nothing here yet. Your activity shows up as you create and work on things."
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border border-border rounded-lg bg-card p-8 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground mb-4",
							children: "Activity is private to each account. Sign in to see yours."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/auth?redirect=/activity",
							className: "text-primary underline underline-offset-4",
							children: "Sign in"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = Activity$1;
//#endregion
export { SplitComponent as component };
