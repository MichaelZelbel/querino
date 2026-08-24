import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { a as Users, gt as LoaderCircle, xn as CircleX } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, l as useSearchParams, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { n as redeemTeamInvite } from "./useTeamInvites-B6EE7bcl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/join-CDS-dPqv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TeamJoin() {
	const navigate = useNavigate$1();
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") || "";
	const { user, loading: authLoading } = useAuthContext();
	const { switchWorkspace } = useWorkspace();
	const queryClient = useQueryClient();
	const [error, setError] = (0, import_react.useState)(null);
	const redeeming = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (authLoading) return;
		if (!token) {
			setError("This invite link is missing its token.");
			return;
		}
		if (!user) {
			navigate(`/auth?redirect=${encodeURIComponent(`/team/join?token=${encodeURIComponent(token)}`)}`, { replace: true });
			return;
		}
		if (redeeming.current) return;
		redeeming.current = true;
		(async () => {
			try {
				const result = await redeemTeamInvite(token);
				await queryClient.invalidateQueries({ queryKey: ["user-teams"] });
				switchWorkspace(result.team_id);
				toast.success(`Welcome to ${result.team_name}!`);
				navigate("/library", { replace: true });
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to join team";
				setError(message.includes("expired") ? "This invite link has expired. Ask a team admin for a new one." : message.includes("not found") ? "This invite link is invalid or has been revoked." : message);
			}
		})();
	}, [
		authLoading,
		user,
		token
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex flex-1 items-center justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center",
					children: error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-8 w-8 text-destructive" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-2 text-2xl font-bold text-foreground",
							children: "Couldn't join team"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-6 max-w-md text-muted-foreground",
							children: error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => navigate("/library"),
							children: "Go to My Library"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-8 w-8 text-primary" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-2 text-2xl font-bold text-foreground",
							children: "Joining team…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto h-6 w-6 animate-spin text-primary" })
					] })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = TeamJoin;
//#endregion
export { SplitComponent as component };
