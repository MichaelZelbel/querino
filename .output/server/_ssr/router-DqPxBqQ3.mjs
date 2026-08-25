import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { Nt as House, dn as Compass, n as X } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { C as useRouter, F as redirect, c as HeadContent, f as createRouter, g as createRootRouteWithContext, h as createFileRoute, m as lazyRouteComponent, p as Outlet, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Link$1, o as useLocation$1, t as AuthProvider } from "./router-compat-xSZ_AoUj.mjs";
import { i as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as z, t as j } from "../_libs/next-themes.mjs";
import { a as TooltipProvider, n as Header, s as WorkspaceProvider, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { t as siteOrigin } from "./site-jKTsxe7R.mjs";
import { a as loadBlogTag, d as pageHead, f as privateHead, i as loadBlogPost, o as loadProfile, r as loadBlogCategory, t as SITE_ORIGIN } from "./route-loaders-CeRUcm3J.mjs";
import { t as Route$50 } from "../_slug.index-DUhJH_Ni.mjs";
import { t as Route$51 } from "../_slug.index-DLt5UqaZ.mjs";
import { t as Route$52 } from "../_slug.index-BdxPuJ38.mjs";
import { t as Route$53 } from "../_slug.index-BUURXrNp.mjs";
import { a as Root2, i as Provider, n as Close, o as Title, r as Description, s as Viewport, t as Action } from "../_libs/@radix-ui/react-toast+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DqPxBqQ3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TOAST_LIMIT = 1;
var TOAST_REMOVE_DELAY = 1e6;
var count = 0;
function genId() {
	count = (count + 1) % Number.MAX_SAFE_INTEGER;
	return count.toString();
}
var toastTimeouts = /* @__PURE__ */ new Map();
var addToRemoveQueue = (toastId) => {
	if (toastTimeouts.has(toastId)) return;
	const timeout = setTimeout(() => {
		toastTimeouts.delete(toastId);
		dispatch({
			type: "REMOVE_TOAST",
			toastId
		});
	}, TOAST_REMOVE_DELAY);
	toastTimeouts.set(toastId, timeout);
};
var reducer = (state, action) => {
	switch (action.type) {
		case "ADD_TOAST": return {
			...state,
			toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
		};
		case "UPDATE_TOAST": return {
			...state,
			toasts: state.toasts.map((t) => t.id === action.toast.id ? {
				...t,
				...action.toast
			} : t)
		};
		case "DISMISS_TOAST": {
			const { toastId } = action;
			if (toastId) addToRemoveQueue(toastId);
			else state.toasts.forEach((toast) => {
				addToRemoveQueue(toast.id);
			});
			return {
				...state,
				toasts: state.toasts.map((t) => t.id === toastId || toastId === void 0 ? {
					...t,
					open: false
				} : t)
			};
		}
		case "REMOVE_TOAST":
			if (action.toastId === void 0) return {
				...state,
				toasts: []
			};
			return {
				...state,
				toasts: state.toasts.filter((t) => t.id !== action.toastId)
			};
	}
};
var listeners = [];
var memoryState = { toasts: [] };
function dispatch(action) {
	memoryState = reducer(memoryState, action);
	listeners.forEach((listener) => {
		listener(memoryState);
	});
}
function toast$2({ ...props }) {
	const id = genId();
	const update = (props) => dispatch({
		type: "UPDATE_TOAST",
		toast: {
			...props,
			id
		}
	});
	const dismiss = () => dispatch({
		type: "DISMISS_TOAST",
		toastId: id
	});
	dispatch({
		type: "ADD_TOAST",
		toast: {
			...props,
			id,
			open: true,
			onOpenChange: (open) => {
				if (!open) dismiss();
			}
		}
	});
	return {
		id,
		dismiss,
		update
	};
}
function useToast() {
	const [state, setState] = import_react.useState(memoryState);
	import_react.useEffect(() => {
		listeners.push(setState);
		return () => {
			const index = listeners.indexOf(setState);
			if (index > -1) listeners.splice(index, 1);
		};
	}, [state]);
	return {
		...state,
		toast: toast$2,
		dismiss: (toastId) => dispatch({
			type: "DISMISS_TOAST",
			toastId
		})
	};
}
var ToastProvider = Provider;
var ToastViewport = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewport, {
	ref,
	className: cn("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className),
	...props
}));
ToastViewport.displayName = Viewport.displayName;
var toastVariants = cva("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
	variants: { variant: {
		default: "border bg-background text-foreground",
		destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
	} },
	defaultVariants: { variant: "default" }
});
var Toast = import_react.forwardRef(({ className, variant, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root2, {
		ref,
		className: cn(toastVariants({ variant }), className),
		...props
	});
});
Toast.displayName = Root2.displayName;
var ToastAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
	ref,
	className: cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50", className),
	...props
}));
ToastAction.displayName = Action.displayName;
var ToastClose = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Close, {
	ref,
	className: cn("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-hidden focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
	"toast-close": "",
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
}));
ToastClose.displayName = Close.displayName;
var ToastTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {
	ref,
	className: cn("text-sm font-semibold", className),
	...props
}));
ToastTitle.displayName = Title.displayName;
var ToastDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description, {
	ref,
	className: cn("text-sm opacity-90", className),
	...props
}));
ToastDescription.displayName = Description.displayName;
function Toaster$2() {
	const { toasts } = useToast();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToastProvider, { children: [toasts.map(function({ id, title, description, action, ...props }) {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Toast, {
			...props,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1",
					children: [title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastTitle, { children: title }), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastDescription, { children: description })]
				}),
				action,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastClose, {})
			]
		}, id);
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastViewport, {})] });
}
var Toaster$1 = ({ ...props }) => {
	const { theme = "system" } = j();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme,
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var COOKIE_CONSENT_KEY = "cookie-consent";
var CookieBanner = () => {
	const [isVisible, setIsVisible] = (0, import_react.useState)(false);
	const bannerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
			const timer = setTimeout(() => setIsVisible(true), 500);
			return () => clearTimeout(timer);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isVisible) {
			document.body.style.paddingBottom = "";
			return;
		}
		const el = bannerRef.current;
		if (!el) return;
		const apply = () => {
			const h = el.getBoundingClientRect().height;
			document.body.style.paddingBottom = `${Math.ceil(h)}px`;
		};
		apply();
		const ro = new ResizeObserver(apply);
		ro.observe(el);
		window.addEventListener("resize", apply);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", apply);
			document.body.style.paddingBottom = "";
		};
	}, [isVisible]);
	const handleAccept = () => {
		localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
		setIsVisible(false);
	};
	const handleDecline = () => {
		localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
		setIsVisible(false);
	};
	if (!isVisible) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: bannerRef,
		className: "fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-4xl rounded-xl border border-border bg-card p-4 shadow-lg backdrop-blur-sm sm:p-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-base font-semibold text-foreground sm:text-lg",
						children: "Our site uses cookies."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-sans text-sm text-muted-foreground",
						children: [
							"Think of them as harmless little prompts that help us remember what you like. Tap Accept to let the algorithm treat you right.",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/cookies",
								className: "rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								children: "Learn more"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						onClick: handleDecline,
						className: "min-w-[80px]",
						children: "Decline"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "default",
						size: "sm",
						onClick: handleAccept,
						className: "min-w-[80px]",
						children: "Accept"
					})]
				})]
			})
		})
	});
};
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
function SEOHead({ title, description, ogImage, ogType = "website", canonicalUrl, publishedTime, author, noIndex = false, includeRssFeed = false, jsonLd }) {
	const siteName = "Querino";
	const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
	const finalDescription = description || "Discover and share AI prompts, skills, and workflows.";
	const rssUrl = `${siteOrigin()}/rss.xml`;
	(0, import_react.useEffect)(() => {
		document.title = fullTitle;
		const setMeta = (name, content, isProperty = false) => {
			const attr = isProperty ? "property" : "name";
			let meta = document.querySelector(`meta[${attr}="${name}"]`);
			if (!meta) {
				meta = document.createElement("meta");
				meta.setAttribute(attr, name);
				document.head.appendChild(meta);
			}
			meta.setAttribute("content", content);
		};
		setMeta("description", finalDescription);
		if (noIndex) setMeta("robots", "noindex, nofollow");
		setMeta("og:title", fullTitle, true);
		setMeta("og:description", finalDescription, true);
		setMeta("og:type", ogType, true);
		setMeta("og:site_name", siteName, true);
		if (ogImage) setMeta("og:image", ogImage, true);
		if (canonicalUrl) setMeta("og:url", canonicalUrl, true);
		setMeta("twitter:card", ogImage ? "summary_large_image" : "summary");
		setMeta("twitter:title", fullTitle);
		setMeta("twitter:description", finalDescription);
		if (ogImage) setMeta("twitter:image", ogImage);
		if (ogType === "article") {
			if (publishedTime) setMeta("article:published_time", publishedTime, true);
			if (author) setMeta("article:author", author, true);
		}
		const finalCanonical = canonicalUrl || window.location.origin + window.location.pathname;
		let canonical = document.querySelector("link[rel=\"canonical\"]");
		if (!canonical) {
			canonical = document.createElement("link");
			canonical.setAttribute("rel", "canonical");
			document.head.appendChild(canonical);
		}
		canonical.setAttribute("href", finalCanonical);
		let rssLink = document.querySelector("link[type=\"application/rss+xml\"]");
		if (includeRssFeed) {
			if (!rssLink) {
				rssLink = document.createElement("link");
				rssLink.setAttribute("rel", "alternate");
				rssLink.setAttribute("type", "application/rss+xml");
				rssLink.setAttribute("title", `${siteName} Blog RSS Feed`);
				document.head.appendChild(rssLink);
			}
			rssLink.setAttribute("href", rssUrl);
		} else if (rssLink) rssLink.remove();
		document.querySelectorAll("script[type=\"application/ld+json\"][data-seo-jsonld]").forEach((el) => el.remove());
		if (jsonLd) {
			const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
			for (const block of blocks) {
				const script = document.createElement("script");
				script.setAttribute("type", "application/ld+json");
				script.setAttribute("data-seo-jsonld", "true");
				script.text = JSON.stringify(block);
				document.head.appendChild(script);
			}
		}
		return () => {};
	}, [
		fullTitle,
		finalDescription,
		ogImage,
		ogType,
		canonicalUrl,
		publishedTime,
		author,
		noIndex,
		includeRssFeed,
		rssUrl,
		jsonLd
	]);
	return null;
}
var NotFound = () => {
	const location = useLocation$1();
	(0, import_react.useEffect)(() => {
		console.error("404 Error: User attempted to access non-existent route:", location.pathname);
	}, [location.pathname]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SEOHead, {
		title: "Page Not Found",
		noIndex: true
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex flex-1 items-center justify-center bg-muted/30 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-4 text-6xl font-bold text-foreground",
							children: "404"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-6 text-xl text-muted-foreground",
							children: "Oops! This page doesn't exist."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								className: "gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
									to: "/",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-4 w-4" }), "Return to Home"]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								className: "gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
									to: "/discover",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "h-4 w-4" }), "Explore Discover"]
								})
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	})] });
};
var styles_default = "/assets/styles-CXi5nkoz.css";
var FONTS_HREF = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
var ORGANIZATION_JSONLD = JSON.stringify({
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "Querino",
	url: "https://querino.ai",
	logo: "https://querino.ai/favicon.png",
	sameAs: ["https://github.com/querino-ai"]
});
var WEBSITE_JSONLD = JSON.stringify({
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: "Querino",
	url: "https://querino.ai",
	potentialAction: {
		"@type": "SearchAction",
		target: "https://querino.ai/discover?q={search_term_string}",
		"query-input": "required name=search_term_string"
	}
});
var Route$49 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1.0"
			},
			{ title: "Querino - AI Prompt Library for Creators" },
			{
				name: "description",
				content: "Discover, create, and master AI prompts. Access thousands of curated prompts, organize your personal library, and refine your AI interactions with intelligent tools."
			},
			{
				name: "author",
				content: "Querino"
			},
			{
				name: "keywords",
				content: "AI prompts, prompt engineering, ChatGPT, Claude, AI tools, prompt library"
			},
			{
				property: "og:title",
				content: "Querino - AI Prompt Library for Creators"
			},
			{
				property: "og:description",
				content: "Discover, create, and master AI prompts with Querino's curated library and intelligent refinement tools."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:image",
				content: "https://lovable.dev/opengraph-image-p98pqg.png"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@Querino"
			},
			{
				name: "twitter:image",
				content: "https://lovable.dev/opengraph-image-p98pqg.png"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: FONTS_HREF
			}
		],
		scripts: [{
			type: "application/ld+json",
			children: ORGANIZATION_JSONLD
		}, {
			type: "application/ld+json",
			children: WEBSITE_JSONLD
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotFound, {}),
	errorComponent: RootErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$49.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(z, {
		attribute: "class",
		defaultTheme: "system",
		enableSystem: true,
		disableTransitionOnChange: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
			client: queryClient,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipProvider, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$2, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(WorkspaceProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookieBanner, {})] }) })
			] })
		})
	});
}
function RootErrorComponent({ error, reset }) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		console.error(error);
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background p-6 text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mb-2 font-display text-xl font-semibold",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-6 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
						onClick: () => {
							router.invalidate();
							reset();
						},
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
						href: "/",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var $$splitComponentImporter$45 = () => import("./routes-BeU1Yr2U.mjs");
var Route$48 = createFileRoute("/")({
	head: () => pageHead({
		title: "Querino - AI Prompt Library for Creators",
		description: "Thousands of curated prompts, your personal library, and a tiny mascot who genuinely cares whether your prompts are good.",
		canonical: "/"
	}),
	component: lazyRouteComponent($$splitComponentImporter$45, "component")
});
var $$splitComponentImporter$44 = () => import("./activity-BkSgJcFG.mjs");
var Route$47 = createFileRoute("/activity")({
	head: () => privateHead("Activity"),
	component: lazyRouteComponent($$splitComponentImporter$44, "component")
});
var $$splitComponentImporter$43 = () => import("./admin-BYNKDsa3.mjs");
var Route$46 = createFileRoute("/admin")({
	head: () => privateHead("Admin"),
	component: lazyRouteComponent($$splitComponentImporter$43, "component")
});
var $$splitComponentImporter$42 = () => import("./auth-BI-CJuOL.mjs");
var Route$45 = createFileRoute("/auth")({
	head: () => privateHead("Sign In"),
	component: lazyRouteComponent($$splitComponentImporter$42, "component")
});
var $$splitComponentImporter$41 = () => import("./community-guidelines-DBcRfDmZ.mjs");
var Route$44 = createFileRoute("/community-guidelines")({
	head: () => pageHead({
		title: "Community Guidelines — Querino",
		description: "Querino's community guidelines for publishing AI artifacts. Learn what content is allowed and how we keep the platform safe.",
		canonical: "/community-guidelines"
	}),
	component: lazyRouteComponent($$splitComponentImporter$41, "component")
});
var $$splitComponentImporter$40 = () => import("./cookies-DphioLzg.mjs");
var Route$43 = createFileRoute("/cookies")({
	head: () => pageHead({
		title: "Cookies Policy",
		description: "Which cookies Querino sets, what they are for, and how to control them.",
		canonical: "/cookies"
	}),
	component: lazyRouteComponent($$splitComponentImporter$40, "component")
});
var $$splitComponentImporter$39 = () => import("./create-from-menerio-DcO7B1tZ.mjs");
var Route$42 = createFileRoute("/create-from-menerio")({
	head: () => privateHead("Create from Menerio"),
	component: lazyRouteComponent($$splitComponentImporter$39, "component")
});
var Route$41 = createFileRoute("/dashboard")({ beforeLoad: () => {
	throw redirect({
		to: "/library",
		replace: true,
		statusCode: 301
	});
} });
var $$splitComponentImporter$38 = () => import("./discover-DkCCbV90.mjs");
var Route$40 = createFileRoute("/discover")({
	head: () => pageHead({
		title: "Discover AI Prompts, Skills and Workflows",
		description: "Browse curated AI prompts, prompt kits, skills and workflows shared by the Querino community.",
		canonical: "/discover"
	}),
	component: lazyRouteComponent($$splitComponentImporter$38, "component")
});
var $$splitComponentImporter$37 = () => import("./docs-DbJATZZt.mjs");
var Route$39 = createFileRoute("/docs")({
	head: () => pageHead({
		title: "Documentation — Querino",
		description: "Learn how to create, organize, and share AI prompts, prompt kits, skills, and workflows with Querino.",
		canonical: "/docs"
	}),
	component: lazyRouteComponent($$splitComponentImporter$37, "component")
});
var $$splitComponentImporter$36 = () => import("./impressum-Bj4km020.mjs");
var Route$38 = createFileRoute("/impressum")({
	head: () => pageHead({
		title: "Impressum",
		description: "Legal notice and company information for Querino, operated by Zelbel Ltd.",
		canonical: "/impressum"
	}),
	component: lazyRouteComponent($$splitComponentImporter$36, "component")
});
var $$splitComponentImporter$35 = () => import("./privacy-D8Qxb9dX.mjs");
var Route$37 = createFileRoute("/privacy")({
	head: () => pageHead({
		title: "Privacy Policy",
		description: "How Querino collects, uses and protects your data.",
		canonical: "/privacy"
	}),
	component: lazyRouteComponent($$splitComponentImporter$35, "component")
});
/**
* The sitemap and the RSS feed, built from the database.
*
* Ported from supabase/functions/api/index.ts, which served both from a Supabase edge
* function on a foreign host while a Cloudflare rewrite proxied /sitemap.xml back onto
* querino.ai and corrected its content type on the way. Three hops, one of them a
* dashboard setting nobody could review, and /rss.xml was advertised on every blog page
* while returning 404 on every URL the site named.
*
* The output is a deliberate copy of what the edge function produced, not an improvement
* on it, so the move can be verified by comparing the two byte for byte. The one thing
* that did change is the feed's own <atom:link>, which used to point at /api/rss.xml —
* a URL that 404s. It now names the path this file is actually served from.
*
* The queries use the anon client, so row-level security applies. That is the point: the
* sitemap must only list what a logged-out visitor can actually open.
*/
/** How long a crawler may reuse a response. Carried over from the edge function. */
var FEED_CACHE_CONTROL = "public, max-age=3600";
function escapeXml(str) {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
/** Sitemap <lastmod> wants a date, not a timestamp. */
function formatDate(isoDate) {
	return isoDate.split("T")[0];
}
async function buildRss() {
	const siteName = "Querino Blog";
	const siteDescription = "Articles about AI, prompts, and productivity";
	const { data: posts, error } = await supabase.from("blog_posts").select(`
      title,
      slug,
      excerpt,
      content,
      published_at,
      author:profiles!blog_posts_author_id_fkey(display_name)
    `).eq("status", "published").order("published_at", { ascending: false }).limit(20);
	if (error) throw new Error(`RSS query failed: ${error.message}`);
	const items = (posts ?? []).map((post) => {
		const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : (/* @__PURE__ */ new Date()).toUTCString();
		const link = `${SITE_ORIGIN}/blog/${post.slug}`;
		const author = post.author?.display_name || "Anonymous";
		const description = escapeXml(post.excerpt || post.content?.slice(0, 300) || "");
		return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <description><![CDATA[${description}]]></description>
    </item>`;
	}).join("");
	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${SITE_ORIGIN}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en</language>
    <lastBuildDate>${(/* @__PURE__ */ new Date()).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}
async function buildSitemap() {
	const staticPages = [
		{
			loc: "/",
			priority: "1.0",
			changefreq: "daily"
		},
		{
			loc: "/discover",
			priority: "0.9",
			changefreq: "daily"
		},
		{
			loc: "/blog",
			priority: "0.8",
			changefreq: "daily"
		},
		{
			loc: "/terms",
			priority: "0.3",
			changefreq: "yearly"
		},
		{
			loc: "/privacy",
			priority: "0.3",
			changefreq: "yearly"
		},
		{
			loc: "/cookies",
			priority: "0.3",
			changefreq: "yearly"
		},
		{
			loc: "/impressum",
			priority: "0.3",
			changefreq: "yearly"
		}
	];
	const [blogPosts, prompts, skills, workflows, promptKits] = await Promise.all([
		supabase.from("blog_posts").select("slug, updated_at").eq("status", "published").order("updated_at", { ascending: false }),
		supabase.from("prompts").select("slug, updated_at").eq("is_public", true).order("updated_at", { ascending: false }),
		supabase.from("skills").select("slug, updated_at").eq("published", true).order("updated_at", { ascending: false }),
		supabase.from("workflows").select("slug, updated_at").eq("published", true).order("updated_at", { ascending: false }),
		supabase.from("prompt_kits").select("slug, updated_at").eq("published", true).order("updated_at", { ascending: false })
	]);
	const urls = [];
	for (const page of staticPages) urls.push(`
  <url>
    <loc>${SITE_ORIGIN}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
	const collections = [
		{
			prefix: "/blog",
			priority: "0.7",
			rows: blogPosts.data
		},
		{
			prefix: "/prompts",
			priority: "0.6",
			rows: prompts.data
		},
		{
			prefix: "/skills",
			priority: "0.6",
			rows: skills.data
		},
		{
			prefix: "/workflows",
			priority: "0.6",
			rows: workflows.data
		},
		{
			prefix: "/prompt-kits",
			priority: "0.6",
			rows: promptKits.data
		}
	];
	for (const { prefix, priority, rows } of collections) for (const row of rows ?? []) {
		if (!row.slug) continue;
		const lastmod = row.updated_at ? formatDate(row.updated_at) : formatDate((/* @__PURE__ */ new Date()).toISOString());
		urls.push(`
  <url>
    <loc>${SITE_ORIGIN}${prefix}/${escapeXml(row.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
	}
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;
}
var Route$36 = createFileRoute("/rss.xml")({ server: { handlers: { GET: async () => new Response(await buildRss(), { headers: {
	"Content-Type": "application/rss+xml; charset=utf-8",
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": FEED_CACHE_CONTROL
} }) } } });
var $$splitComponentImporter$34 = () => import("./settings-XEtfVDuR.mjs");
var Route$35 = createFileRoute("/settings")({
	head: () => privateHead("Settings"),
	component: lazyRouteComponent($$splitComponentImporter$34, "component")
});
var Route$34 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => new Response(await buildSitemap(), { headers: {
	"Content-Type": "application/xml; charset=utf-8",
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": FEED_CACHE_CONTROL
} }) } } });
var $$splitComponentImporter$33 = () => import("./terms-DMLX3lwN.mjs");
var Route$33 = createFileRoute("/terms")({
	head: () => pageHead({
		title: "Terms of Service",
		description: "The terms that govern your use of Querino.",
		canonical: "/terms"
	}),
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./blog-BHjr-qib.mjs");
var Route$32 = createFileRoute("/blog/")({
	head: () => pageHead({
		title: "Blog",
		description: "Explore articles about AI prompts, workflows, and productivity tips.",
		canonical: "/blog",
		rss: true
	}),
	component: lazyRouteComponent($$splitComponentImporter$32, "component")
});
var $$splitComponentImporter$31 = () => import("../_slug-C_Evrp_X.mjs");
var Route$31 = createFileRoute("/blog/$slug")({
	loader: ({ params }) => loadBlogPost(params.slug),
	head: ({ loaderData }) => {
		if (!loaderData) return privateHead("Post Not Found");
		return pageHead({
			title: loaderData.seo_title || loaderData.title,
			description: loaderData.seo_description || loaderData.excerpt,
			canonical: `/blog/${loaderData.slug}`,
			ogType: "article",
			ogImage: loaderData.og_image_url,
			publishedTime: loaderData.published_at,
			rss: true,
			jsonLd: {
				"@context": "https://schema.org",
				"@type": "BlogPosting",
				headline: loaderData.title,
				description: loaderData.seo_description || loaderData.excerpt || void 0,
				datePublished: loaderData.published_at || void 0,
				dateModified: loaderData.updated_at || void 0,
				publisher: {
					"@type": "Organization",
					name: "Querino"
				}
			}
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
var $$splitComponentImporter$30 = () => import("./collections-4H5JtVca.mjs");
var Route$30 = createFileRoute("/collections/")({
	head: () => privateHead("Collections"),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./new-CcQlokr4.mjs");
var Route$29 = createFileRoute("/collections/new")({
	head: () => privateHead("New Collection"),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./library-BuWQR1ua.mjs");
var Route$28 = createFileRoute("/library/")({
	head: () => privateHead("My Library"),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./edit-Cf55tmDc.mjs");
var Route$27 = createFileRoute("/profile/edit")({
	head: () => privateHead("Edit Profile"),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./new-CvTg392t.mjs");
var Route$26 = createFileRoute("/prompt-kits/new")({
	head: () => privateHead("New Prompt Kit"),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./new-BIkKqofp.mjs");
var Route$25 = createFileRoute("/prompts/new")({
	head: () => privateHead("New Prompt"),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./wizard-CPmb1cu-.mjs");
var Route$24 = createFileRoute("/prompts/wizard")({
	head: () => privateHead("Prompt Wizard"),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var $$splitComponentImporter$23 = () => import("./new-CAQsQ7Sj.mjs");
var Route$23 = createFileRoute("/skills/new")({
	head: () => privateHead("New Skill"),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./join-CDS-dPqv.mjs");
var Route$22 = createFileRoute("/team/join")({
	head: () => privateHead("Join Team"),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./new-aKcrPM4X.mjs");
var Route$21 = createFileRoute("/workflows/new")({
	head: () => privateHead("New Workflow"),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./admin-C8rzO7ai.mjs");
var Route$20 = createFileRoute("/blog/admin/")({
	head: () => privateHead("Blog Admin"),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./categories-BKj2XVZM.mjs");
var Route$19 = createFileRoute("/blog/admin/categories")({
	head: () => privateHead("Blog Categories"),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./media-DgzhIXp3.mjs");
var Route$18 = createFileRoute("/blog/admin/media")({
	head: () => privateHead("Blog Media"),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./tags-Mm_DeHI1.mjs");
var Route$17 = createFileRoute("/blog/admin/tags")({
	head: () => privateHead("Blog Tags"),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("../_slug-Dp3lj84-.mjs");
var Route$16 = createFileRoute("/blog/category/$slug")({
	loader: ({ params }) => loadBlogCategory(params.slug),
	head: ({ loaderData }) => {
		if (!loaderData) return privateHead("Category Not Found");
		return pageHead({
			title: `${loaderData.name} - Blog`,
			description: loaderData.description || `Posts in the ${loaderData.name} category`,
			canonical: `/blog/category/${loaderData.slug}`,
			rss: true
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("../_slug-CwQAmEo-.mjs");
var Route$15 = createFileRoute("/blog/tag/$slug")({
	loader: ({ params }) => loadBlogTag(params.slug),
	head: ({ loaderData }) => {
		if (!loaderData) return privateHead("Tag Not Found");
		return pageHead({
			title: `#${loaderData.name} - Blog`,
			description: `Posts tagged with ${loaderData.name}`,
			canonical: `/blog/tag/${loaderData.slug}`,
			rss: true
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("../_id.index-BdQyqxGr.mjs");
var Route$14 = createFileRoute("/collections/$id/")({
	head: () => privateHead("Collection"),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("../_id.edit-TDje-vqU.mjs");
var Route$13 = createFileRoute("/collections/$id/edit")({
	head: () => privateHead("Edit Collection"),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("../_slug.edit-BVMq311F.mjs");
var Route$12 = createFileRoute("/library/$slug/edit")({
	head: () => privateHead("Edit Prompt"),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("../_slug.versions-Bm6qLAaX.mjs");
var Route$11 = createFileRoute("/library/$slug/versions")({
	head: () => privateHead("Version History"),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("../_slug.edit-BEY6KnAw.mjs");
var Route$10 = createFileRoute("/prompt-kits/$slug/edit")({
	head: () => privateHead("Edit Prompt Kit"),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("../_slug.edit-CtDDwnSt.mjs");
var Route$9 = createFileRoute("/prompts/$slug/edit")({
	head: () => privateHead("Edit Prompt"),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("../_slug.edit-Datd0MSo.mjs");
var Route$8 = createFileRoute("/skills/$slug/edit")({
	head: () => privateHead("Edit Skill"),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("../_id.activity-CXIXbfQL.mjs");
var Route$7 = createFileRoute("/team/$id/activity")({
	head: () => privateHead("Team Activity"),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("../_id.settings-DKFwuipV.mjs");
var Route$6 = createFileRoute("/team/$id/settings")({
	head: () => privateHead("Team Settings"),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("../_username.index-DMrvnVu4.mjs");
var Route$5 = createFileRoute("/u/$username/")({
	loader: ({ params }) => loadProfile(params.username),
	head: ({ loaderData }) => {
		if (!loaderData) return privateHead("Profile Not Found");
		const name = loaderData.display_name ?? "Querino member";
		return pageHead({
			title: name,
			description: loaderData.bio || `Prompts, skills and workflows published by ${name} on Querino.`,
			canonical: `/u/${encodeURIComponent(loaderData.display_name ?? "")}`,
			ogImage: loaderData.avatar_url,
			jsonLd: {
				"@context": "https://schema.org",
				"@type": "ProfilePage",
				mainEntity: {
					"@type": "Person",
					name,
					description: loaderData.bio || void 0
				}
			}
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("../_username.activity-B1oCrzSA.mjs");
var Route$4 = createFileRoute("/u/$username/activity")({
	head: () => privateHead("Activity"),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("../_slug.edit-BCNHK8Mg.mjs");
var Route$3 = createFileRoute("/workflows/$slug/edit")({
	head: () => privateHead("Edit Workflow"),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./posts-PkIrgfHb.mjs");
var Route$2 = createFileRoute("/blog/admin/posts/")({
	head: () => privateHead("Blog Posts"),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./new-M_iIp2iQ.mjs");
var Route$1 = createFileRoute("/blog/admin/posts/new")({
	head: () => privateHead("New Blog Post"),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("../_id.edit-BAvAf88r.mjs");
var Route = createFileRoute("/blog/admin/posts/$id/edit")({
	head: () => privateHead("Edit Blog Post"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$48.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$49
});
var ActivityRoute = Route$47.update({
	id: "/activity",
	path: "/activity",
	getParentRoute: () => Route$49
});
var AdminRoute = Route$46.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$49
});
var AuthRoute = Route$45.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$49
});
var CommunityGuidelinesRoute = Route$44.update({
	id: "/community-guidelines",
	path: "/community-guidelines",
	getParentRoute: () => Route$49
});
var CookiesRoute = Route$43.update({
	id: "/cookies",
	path: "/cookies",
	getParentRoute: () => Route$49
});
var CreateFromMenerioRoute = Route$42.update({
	id: "/create-from-menerio",
	path: "/create-from-menerio",
	getParentRoute: () => Route$49
});
var DashboardRoute = Route$41.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$49
});
var DiscoverRoute = Route$40.update({
	id: "/discover",
	path: "/discover",
	getParentRoute: () => Route$49
});
var DocsRoute = Route$39.update({
	id: "/docs",
	path: "/docs",
	getParentRoute: () => Route$49
});
var ImpressumRoute = Route$38.update({
	id: "/impressum",
	path: "/impressum",
	getParentRoute: () => Route$49
});
var PrivacyRoute = Route$37.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$49
});
var RssDotxmlRoute = Route$36.update({
	id: "/rss.xml",
	path: "/rss.xml",
	getParentRoute: () => Route$49
});
var SettingsRoute = Route$35.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$49
});
var SitemapDotxmlRoute = Route$34.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$49
});
var TermsRoute = Route$33.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$49
});
var BlogIndexRoute = Route$32.update({
	id: "/blog/",
	path: "/blog/",
	getParentRoute: () => Route$49
});
var BlogSlugRoute = Route$31.update({
	id: "/blog/$slug",
	path: "/blog/$slug",
	getParentRoute: () => Route$49
});
var CollectionsIndexRoute = Route$30.update({
	id: "/collections/",
	path: "/collections/",
	getParentRoute: () => Route$49
});
var CollectionsNewRoute = Route$29.update({
	id: "/collections/new",
	path: "/collections/new",
	getParentRoute: () => Route$49
});
var LibraryIndexRoute = Route$28.update({
	id: "/library/",
	path: "/library/",
	getParentRoute: () => Route$49
});
var ProfileEditRoute = Route$27.update({
	id: "/profile/edit",
	path: "/profile/edit",
	getParentRoute: () => Route$49
});
var PromptKitsNewRoute = Route$26.update({
	id: "/prompt-kits/new",
	path: "/prompt-kits/new",
	getParentRoute: () => Route$49
});
var PromptsNewRoute = Route$25.update({
	id: "/prompts/new",
	path: "/prompts/new",
	getParentRoute: () => Route$49
});
var PromptsWizardRoute = Route$24.update({
	id: "/prompts/wizard",
	path: "/prompts/wizard",
	getParentRoute: () => Route$49
});
var SkillsNewRoute = Route$23.update({
	id: "/skills/new",
	path: "/skills/new",
	getParentRoute: () => Route$49
});
var TeamJoinRoute = Route$22.update({
	id: "/team/join",
	path: "/team/join",
	getParentRoute: () => Route$49
});
var WorkflowsNewRoute = Route$21.update({
	id: "/workflows/new",
	path: "/workflows/new",
	getParentRoute: () => Route$49
});
var BlogAdminIndexRoute = Route$20.update({
	id: "/blog/admin/",
	path: "/blog/admin/",
	getParentRoute: () => Route$49
});
var BlogAdminCategoriesRoute = Route$19.update({
	id: "/blog/admin/categories",
	path: "/blog/admin/categories",
	getParentRoute: () => Route$49
});
var BlogAdminMediaRoute = Route$18.update({
	id: "/blog/admin/media",
	path: "/blog/admin/media",
	getParentRoute: () => Route$49
});
var BlogAdminTagsRoute = Route$17.update({
	id: "/blog/admin/tags",
	path: "/blog/admin/tags",
	getParentRoute: () => Route$49
});
var BlogCategorySlugRoute = Route$16.update({
	id: "/blog/category/$slug",
	path: "/blog/category/$slug",
	getParentRoute: () => Route$49
});
var BlogTagSlugRoute = Route$15.update({
	id: "/blog/tag/$slug",
	path: "/blog/tag/$slug",
	getParentRoute: () => Route$49
});
var CollectionsIdIndexRoute = Route$14.update({
	id: "/collections/$id/",
	path: "/collections/$id/",
	getParentRoute: () => Route$49
});
var CollectionsIdEditRoute = Route$13.update({
	id: "/collections/$id/edit",
	path: "/collections/$id/edit",
	getParentRoute: () => Route$49
});
var LibrarySlugEditRoute = Route$12.update({
	id: "/library/$slug/edit",
	path: "/library/$slug/edit",
	getParentRoute: () => Route$49
});
var LibrarySlugVersionsRoute = Route$11.update({
	id: "/library/$slug/versions",
	path: "/library/$slug/versions",
	getParentRoute: () => Route$49
});
var PromptKitsSlugIndexRoute = Route$51.update({
	id: "/prompt-kits/$slug/",
	path: "/prompt-kits/$slug/",
	getParentRoute: () => Route$49
});
var PromptKitsSlugEditRoute = Route$10.update({
	id: "/prompt-kits/$slug/edit",
	path: "/prompt-kits/$slug/edit",
	getParentRoute: () => Route$49
});
var PromptsSlugIndexRoute = Route$52.update({
	id: "/prompts/$slug/",
	path: "/prompts/$slug/",
	getParentRoute: () => Route$49
});
var PromptsSlugEditRoute = Route$9.update({
	id: "/prompts/$slug/edit",
	path: "/prompts/$slug/edit",
	getParentRoute: () => Route$49
});
var SkillsSlugIndexRoute = Route$50.update({
	id: "/skills/$slug/",
	path: "/skills/$slug/",
	getParentRoute: () => Route$49
});
var SkillsSlugEditRoute = Route$8.update({
	id: "/skills/$slug/edit",
	path: "/skills/$slug/edit",
	getParentRoute: () => Route$49
});
var TeamIdActivityRoute = Route$7.update({
	id: "/team/$id/activity",
	path: "/team/$id/activity",
	getParentRoute: () => Route$49
});
var TeamIdSettingsRoute = Route$6.update({
	id: "/team/$id/settings",
	path: "/team/$id/settings",
	getParentRoute: () => Route$49
});
var UUsernameIndexRoute = Route$5.update({
	id: "/u/$username/",
	path: "/u/$username/",
	getParentRoute: () => Route$49
});
var UUsernameActivityRoute = Route$4.update({
	id: "/u/$username/activity",
	path: "/u/$username/activity",
	getParentRoute: () => Route$49
});
var WorkflowsSlugIndexRoute = Route$53.update({
	id: "/workflows/$slug/",
	path: "/workflows/$slug/",
	getParentRoute: () => Route$49
});
var WorkflowsSlugEditRoute = Route$3.update({
	id: "/workflows/$slug/edit",
	path: "/workflows/$slug/edit",
	getParentRoute: () => Route$49
});
var BlogAdminPostsIndexRoute = Route$2.update({
	id: "/blog/admin/posts/",
	path: "/blog/admin/posts/",
	getParentRoute: () => Route$49
});
var rootRouteChildren = {
	IndexRoute,
	ActivityRoute,
	AdminRoute,
	AuthRoute,
	CommunityGuidelinesRoute,
	CookiesRoute,
	CreateFromMenerioRoute,
	DashboardRoute,
	DiscoverRoute,
	DocsRoute,
	ImpressumRoute,
	PrivacyRoute,
	RssDotxmlRoute,
	SettingsRoute,
	SitemapDotxmlRoute,
	TermsRoute,
	BlogSlugRoute,
	CollectionsNewRoute,
	ProfileEditRoute,
	PromptKitsNewRoute,
	PromptsNewRoute,
	PromptsWizardRoute,
	SkillsNewRoute,
	TeamJoinRoute,
	WorkflowsNewRoute,
	BlogIndexRoute,
	CollectionsIndexRoute,
	LibraryIndexRoute,
	BlogAdminCategoriesRoute,
	BlogAdminMediaRoute,
	BlogAdminTagsRoute,
	BlogCategorySlugRoute,
	BlogTagSlugRoute,
	CollectionsIdEditRoute,
	LibrarySlugEditRoute,
	LibrarySlugVersionsRoute,
	PromptKitsSlugEditRoute,
	PromptsSlugEditRoute,
	SkillsSlugEditRoute,
	TeamIdActivityRoute,
	TeamIdSettingsRoute,
	UUsernameActivityRoute,
	WorkflowsSlugEditRoute,
	BlogAdminIndexRoute,
	CollectionsIdIndexRoute,
	PromptKitsSlugIndexRoute,
	PromptsSlugIndexRoute,
	SkillsSlugIndexRoute,
	UUsernameIndexRoute,
	WorkflowsSlugIndexRoute,
	BlogAdminPostsNewRoute: Route$1.update({
		id: "/blog/admin/posts/new",
		path: "/blog/admin/posts/new",
		getParentRoute: () => Route$49
	}),
	BlogAdminPostsIndexRoute,
	BlogAdminPostsIdEditRoute: Route.update({
		id: "/blog/admin/posts/$id/edit",
		path: "/blog/admin/posts/$id/edit",
		getParentRoute: () => Route$49
	})
};
var routeTree = Route$49._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: {
		staleTime: 6e4,
		gcTime: 3e5,
		refetchOnWindowFocus: false,
		retry: 1
	} } });
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
