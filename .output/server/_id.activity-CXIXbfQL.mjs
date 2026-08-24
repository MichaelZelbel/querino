import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { Hn as Activity, R as Settings, Vn as ArrowLeft } from "./_libs/lucide-react.mjs";
import { c as useParams$1, i as useAuth, n as Link$1, r as Navigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { a as useCurrentUserTeamRole, c as useTeam } from "./_ssr/avatar-CLMN7E0g.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { n as useActivityEvents, t as ActivityTimeline } from "./_ssr/ActivityTimeline-DTJ1Wotr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id.activity-CXIXbfQL.js
var import_jsx_runtime = require_jsx_runtime();
function TeamActivity() {
	const { id } = useParams$1();
	const { user, loading: authLoading } = useAuth();
	const { data: team, isLoading: teamLoading } = useTeam(id);
	const { data: userRole, isLoading: roleLoading } = useCurrentUserTeamRole(id);
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useActivityEvents({ teamId: id });
	const events = data?.pages.flat() || [];
	if (authLoading || teamLoading || roleLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate$1, {
		to: "/auth",
		replace: true
	});
	if (!userRole) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate$1, {
		to: "/library",
		replace: true
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-grow container mx-auto px-4 py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl mx-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: `/team/${id}/settings`,
							className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Team Settings"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-3 bg-primary/10 rounded-xl",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-8 w-8 text-primary" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
									className: "text-3xl font-bold text-foreground",
									children: [team?.name || "Team", " Activity"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground",
									children: "Recent activity within your team"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
									to: `/team/${id}/settings`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4 mr-2" }), "Settings"]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border border-border rounded-lg bg-card overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityTimeline, {
								events,
								isLoading,
								isFetchingNextPage,
								hasNextPage: hasNextPage ?? false,
								fetchNextPage,
								emptyMessage: "No team activity yet. Start creating prompts, skills, or workflows!"
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = TeamActivity;
//#endregion
export { SplitComponent as component };
