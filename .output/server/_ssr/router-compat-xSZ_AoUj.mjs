import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as useRouter, _ as Link, b as useParams, l as useLocation, v as Navigate, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-compat-xSZ_AoUj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useAuth() {
	const [user, setUser] = (0, import_react.useState)(null);
	const [session, setSession] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) {
				setTimeout(() => {
					fetchProfile(session.user.id);
				}, 0);
				if (event === "SIGNED_IN") setTimeout(() => {
					checkOAuthSignupAllowed(session.user);
				}, 0);
			} else {
				setProfile(null);
				setLoading(false);
			}
		});
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) fetchProfile(session.user.id);
			else setLoading(false);
		});
		return () => subscription.unsubscribe();
	}, []);
	const checkOAuthSignupAllowed = async (authUser) => {
		try {
			const createdAt = new Date(authUser.created_at).getTime();
			if (Date.now() - createdAt > 6e4) return;
			const { data, error } = await supabase.rpc("check_signup_allowed");
			if (error) {
				console.error("Error checking signup cap:", error);
				return;
			}
			const result = data;
			if (result && !result.allowed) {
				toast.error("We've reached our early access limit. Join the waitlist at support@querino.ai.", { duration: 8e3 });
				await supabase.auth.signOut();
			}
		} catch (err) {
			console.error("Error in OAuth signup check:", err);
		}
	};
	const fetchProfile = async (userId) => {
		try {
			const [{ data, error }, { data: planRows }] = await Promise.all([supabase.from("profiles").select("id, display_name, avatar_url, bio, website, twitter, github, created_at, updated_at, github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at").eq("id", userId).maybeSingle(), supabase.rpc("get_my_plan")]);
			if (error) console.error("Error fetching profile:", error);
			else {
				const plan = planRows?.[0] ?? {};
				setProfile(data ? {
					...data,
					...plan
				} : null);
			}
		} catch (err) {
			console.error("Error fetching profile:", err);
		} finally {
			setLoading(false);
		}
	};
	const signInWithEmail = async (email, password) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		return { error };
	};
	const signUpWithEmail = async (email, password) => {
		const { data: capCheck, error: capError } = await supabase.rpc("check_signup_allowed");
		if (capError) return { error: /* @__PURE__ */ new Error("Unable to verify signup availability. Please try again.") };
		const capResult = capCheck;
		if (capResult && !capResult.allowed) return { error: /* @__PURE__ */ new Error("We've reached our early access limit. Join the waitlist at support@querino.ai.") };
		const redirectUrl = `${window.location.origin}/`;
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: redirectUrl }
		});
		return { error };
	};
	const signInWithGoogle = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: `${window.location.origin}/auth` }
		});
		return { error };
	};
	const signInWithGithub = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "github",
			options: { redirectTo: `${window.location.origin}/auth` }
		});
		return { error };
	};
	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		return { error };
	};
	return {
		user,
		session,
		profile,
		loading,
		signInWithEmail,
		signUpWithEmail,
		signInWithGoogle,
		signInWithGithub,
		signOut
	};
}
var AuthContext = (0, import_react.createContext)(void 0);
function AuthProvider({ children }) {
	const auth = useAuth();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: auth,
		children
	});
}
function useAuthContext() {
	const context = (0, import_react.useContext)(AuthContext);
	if (context === void 0) throw new Error("useAuthContext must be used within an AuthProvider");
	return context;
}
/**
* Router-compat shim — bridges @/lib/router-compat v6 call sites to
* @tanstack/react-router without hand-rewriting every component.
* This is the same load-bearing pattern used in Klar's dev-copy migration.
*/
function parseTo(to) {
	const [beforeHash, hashStr] = (to ?? "").split("#");
	const [pathname, searchStr] = beforeHash.split("?");
	return {
		pathname: pathname || ".",
		search: searchStr ? Object.fromEntries(new URLSearchParams(searchStr)) : void 0,
		hash: hashStr || void 0
	};
}
function useNavigate$1() {
	const tsNav = useNavigate();
	const router = useRouter();
	return (0, import_react.useCallback)((to, options) => {
		if (typeof to === "number") {
			router.history.go(to);
			return;
		}
		const { pathname, search, hash } = parseTo(to);
		tsNav({
			to: pathname,
			search,
			hash,
			state: options?.state,
			replace: options?.replace
		});
	}, [tsNav, router]);
}
function useLocation$1() {
	const loc = useLocation();
	return (0, import_react.useMemo)(() => ({
		pathname: loc.pathname,
		search: loc.searchStr ? `?${loc.searchStr}` : "",
		hash: loc.hash ?? "",
		state: loc.state ?? null,
		key: loc.pathname + (loc.searchStr ?? "")
	}), [
		loc.pathname,
		loc.searchStr,
		loc.hash,
		loc.state
	]);
}
function useParams$1() {
	return useParams({ strict: false });
}
function useSearchParams() {
	const loc = useLocation();
	const nav = useNavigate();
	const router = useRouter();
	return [(0, import_react.useMemo)(() => new URLSearchParams(loc.searchStr ?? ""), [loc.searchStr]), (0, import_react.useCallback)((init, opts) => {
		const live = router.state.location;
		const current = new URLSearchParams(live.searchStr ?? "");
		const next = typeof init === "function" ? init(current) : init instanceof URLSearchParams ? init : new URLSearchParams(init);
		const searchObj = {};
		next.forEach((v, k) => {
			searchObj[k] = v;
		});
		nav({
			to: live.pathname,
			search: searchObj,
			replace: opts?.replace
		});
	}, [nav, router])];
}
var Link$1 = (0, import_react.forwardRef)(function Link$2({ to, replace, state, children, ...rest }, ref) {
	const { pathname, search, hash } = parseTo(to);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		ref,
		to: pathname,
		search,
		hash,
		replace,
		state,
		...rest ?? {},
		children
	});
});
function Navigate$1({ to, replace, state }) {
	const { pathname, search, hash } = parseTo(to);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: pathname,
		search,
		hash,
		state,
		replace
	});
}
//#endregion
export { useAuthContext as a, useParams$1 as c, useAuth as i, useSearchParams as l, Link$1 as n, useLocation$1 as o, Navigate$1 as r, useNavigate$1 as s, AuthProvider as t };
