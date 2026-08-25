import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { Sn as CircleCheck, Wt as Github, gt as LoaderCircle, ht as Lock, pt as Mail } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, l as useSearchParams, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer, u as logo_default } from "./Footer-ClUC5jzd.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-B4ZFfXyf.mjs";
import { t as Separator } from "./separator-B3hsz7IR.mjs";
import { n as AlertDescription, t as Alert } from "./alert-DeotHHTZ.mjs";
import { t as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-BI-CJuOL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var REDIRECT_KEY = "querino_redirect_path";
var DEFAULT_REDIRECT = "/library";
/**
* Store the intended redirect path before OAuth redirect
*/
function storeRedirectPath(path) {
	const redirectPath = path || DEFAULT_REDIRECT;
	localStorage.setItem(REDIRECT_KEY, redirectPath);
}
/**
* Get and clear the stored redirect path
*/
function getAndClearRedirectPath() {
	const path = localStorage.getItem(REDIRECT_KEY);
	localStorage.removeItem(REDIRECT_KEY);
	return path || DEFAULT_REDIRECT;
}
/**
* Get the redirect path from URL params or default
*/
function getRedirectFromParams(searchParams) {
	return searchParams.get("redirect") || DEFAULT_REDIRECT;
}
var REDIRECT_LABELS = {
	"/library": "your library",
	"/dashboard": "your dashboard",
	"/settings": "your settings",
	"/activity": "your activity feed",
	"/collections": "your collections",
	"/prompts/new": "create a new prompt",
	"/skills/new": "create a new skill",
	"/workflows/new": "create a new workflow",
	"/prompt-kits/new": "create a new prompt kit"
};
function getRedirectLabel(path) {
	if (!path || path === "/" || path === "/library") {
		if (path === "/library") return REDIRECT_LABELS["/library"];
		return null;
	}
	if (REDIRECT_LABELS[path]) return REDIRECT_LABELS[path];
	if (/^\/prompts\/[^/]+\/edit/.test(path)) return "edit this prompt";
	if (/^\/skills\/[^/]+\/edit/.test(path)) return "edit this skill";
	if (/^\/workflows\/[^/]+\/edit/.test(path)) return "edit this workflow";
	if (/^\/prompt-kits\/[^/]+\/edit/.test(path)) return "edit this prompt kit";
	if (path.startsWith("/teams")) return "team workspace";
	return "this page";
}
var emailSchema = stringType().email("Please enter a valid email address");
var passwordSchema = stringType().min(6, "Password must be at least 6 characters");
function Auth() {
	const navigate = useNavigate$1();
	const [searchParams] = useSearchParams();
	const hasRedirected = (0, import_react.useRef)(false);
	const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGithub } = useAuthContext();
	const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
	const [activeTab, setActiveTab] = (0, import_react.useState)(initialTab);
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [errors, setErrors] = (0, import_react.useState)({});
	const [signupSuccess, setSignupSuccess] = (0, import_react.useState)(false);
	const [signupEmail, setSignupEmail] = (0, import_react.useState)("");
	const [signupsClosed, setSignupsClosed] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const checkCap = async () => {
			try {
				const { data } = await (await import("./client-Bi_X_zk2.mjs").then((n) => n.t).then((n) => n.t)).supabase.rpc("check_signup_allowed");
				const result = data;
				if (result && !result.allowed) setSignupsClosed(true);
			} catch {}
		};
		checkCap();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!authLoading && user && !hasRedirected.current) {
			hasRedirected.current = true;
			const storedPath = getAndClearRedirectPath();
			const urlRedirect = getRedirectFromParams(searchParams);
			navigate(storedPath !== "/library" ? storedPath : urlRedirect, { replace: true });
		}
	}, [
		user,
		authLoading,
		navigate,
		searchParams
	]);
	const validateForm = () => {
		const newErrors = {};
		const emailResult = emailSchema.safeParse(email);
		if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
		const passwordResult = passwordSchema.safeParse(password);
		if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	const handleEmailAuth = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;
		setLoading(true);
		try {
			if (activeTab === "signin") {
				const { error } = await signInWithEmail(email, password);
				if (error) if (error.message.includes("Invalid login credentials")) toast.error("Invalid email or password. Please try again.");
				else toast.error(error.message);
				else {
					toast.success("Welcome back!");
					const redirectTo = getRedirectFromParams(searchParams);
					navigate(redirectTo, { replace: true });
				}
			} else {
				const { error } = await signUpWithEmail(email, password);
				if (error) if (error.message.includes("User already registered")) {
					toast.error("An account with this email already exists. Please sign in instead.");
					setActiveTab("signin");
				} else toast.error(error.message);
				else {
					setSignupEmail(email);
					setSignupSuccess(true);
				}
			}
		} finally {
			setLoading(false);
		}
	};
	const handleGoogleAuth = async () => {
		storeRedirectPath(getRedirectFromParams(searchParams));
		setLoading(true);
		const { error } = await signInWithGoogle();
		if (error) {
			toast.error(error.message);
			setLoading(false);
		}
	};
	const handleGithubAuth = async () => {
		storeRedirectPath(getRedirectFromParams(searchParams));
		setLoading(true);
		const { error } = await signInWithGithub();
		if (error) {
			toast.error(error.message);
			setLoading(false);
		}
	};
	if (authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	const redirectTarget = searchParams.get("redirect");
	const redirectLabel = redirectTarget ? getRedirectLabel(redirectTarget) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex flex-1 items-center justify-center px-4 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md space-y-4",
					children: [redirectLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
						className: "border-primary/30 bg-primary/5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDescription, {
							className: "text-sm",
							children: [
								"Sign in to access",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: redirectLabel
								}),
								"."
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "w-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: logo_default,
									alt: "Querino",
									className: "mx-auto mb-4 h-12 w-12"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
									className: "text-2xl font-bold",
									children: "Welcome to Querino"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Sign in to access your prompt library and create amazing AI prompts" })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
							value: activeTab,
							onValueChange: (v) => setActiveTab(v),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "grid w-full grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "signin",
										children: "Sign In"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "signup",
										children: "Sign Up"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
									value: "signin",
									className: "mt-6 space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												className: "w-full gap-2",
												onClick: handleGoogleAuth,
												disabled: loading,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
													className: "h-4 w-4",
													viewBox: "0 0 24 24",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
														})
													]
												}), "Continue with Google"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												className: "w-full gap-2",
												onClick: handleGithubAuth,
												disabled: loading,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-4 w-4" }), "Continue with GitHub"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute inset-0 flex items-center",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "relative flex justify-center text-xs uppercase",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-card px-2 text-muted-foreground",
													children: "Or continue with"
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											onSubmit: handleEmailAuth,
											className: "space-y-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "email",
															children: "Email"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "email",
															type: "email",
															placeholder: "you@example.com",
															value: email,
															onChange: (e) => setEmail(e.target.value),
															disabled: loading
														}),
														errors.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-destructive",
															children: errors.email
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "password",
															children: "Password"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "password",
															type: "password",
															placeholder: "••••••••",
															value: password,
															onChange: (e) => setPassword(e.target.value),
															disabled: loading
														}),
														errors.password && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-destructive",
															children: errors.password
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "submit",
													className: "w-full gap-2",
													disabled: loading,
													children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4" }), "Sign In with Email"]
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "signup",
									className: "mt-6 space-y-4",
									children: signupsClosed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center text-center py-6 space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-8 w-8 text-muted-foreground" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-lg font-semibold",
													children: "Early access limit reached"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground max-w-sm",
													children: "We've reached our early access limit. Join the waitlist to be notified when new spots open up."
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												asChild: true,
												variant: "outline",
												className: "w-full",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "mailto:support@querino.ai",
													children: "Join the Waitlist"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												className: "w-full",
												onClick: () => setActiveTab("signin"),
												children: "Already have an account? Sign in"
											})
										]
									}) : signupSuccess ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center text-center py-6 space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-8 w-8 text-primary" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-lg font-semibold",
													children: "Check your email"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-sm text-muted-foreground max-w-sm",
													children: [
														"We've sent a confirmation link to",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium text-foreground",
															children: signupEmail
														}),
														". Click the link in that email to activate your account."
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "pt-4 space-y-2 w-full",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													className: "w-full",
													onClick: () => {
														setSignupSuccess(false);
														setEmail("");
														setPassword("");
														setActiveTab("signin");
													},
													children: "Back to Sign In"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: "Didn't receive the email? Check your spam folder."
												})]
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												className: "w-full gap-2",
												onClick: handleGoogleAuth,
												disabled: loading,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
													className: "h-4 w-4",
													viewBox: "0 0 24 24",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															fill: "currentColor",
															d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
														})
													]
												}), "Continue with Google"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												className: "w-full gap-2",
												onClick: handleGithubAuth,
												disabled: loading,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-4 w-4" }), "Continue with GitHub"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute inset-0 flex items-center",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "relative flex justify-center text-xs uppercase",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-card px-2 text-muted-foreground",
													children: "Or continue with"
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											onSubmit: handleEmailAuth,
											className: "space-y-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "signup-email",
															children: "Email"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "signup-email",
															type: "email",
															placeholder: "you@example.com",
															value: email,
															onChange: (e) => setEmail(e.target.value),
															disabled: loading
														}),
														errors.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-destructive",
															children: errors.email
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "signup-password",
															children: "Password"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "signup-password",
															type: "password",
															placeholder: "••••••••",
															value: password,
															onChange: (e) => setPassword(e.target.value),
															disabled: loading
														}),
														errors.password && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-destructive",
															children: errors.password
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "submit",
													className: "w-full gap-2",
													disabled: loading,
													children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4" }), "Create Account"]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-center text-xs text-muted-foreground",
											children: [
												"By signing up, you agree to our",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "/terms",
													className: "underline hover:text-foreground",
													children: "Terms"
												}),
												" ",
												"and",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "/privacy",
													className: "underline hover:text-foreground",
													children: "Privacy Policy"
												}),
												"."
											]
										})
									] })
								})
							]
						}) })]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = Auth;
//#endregion
export { SplitComponent as component };
