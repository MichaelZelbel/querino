import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { $t as FileText, Dn as ChevronLeft, E as Tags, Mt as Image, Zt as FolderOpen, gt as LoaderCircle, wt as LayoutDashboard } from "../_libs/lucide-react.mjs";
import { i as useAuth, n as Link$1, o as useLocation$1, r as Navigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { t as useUserRole } from "./useUserRole-B1YhonQE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BlogAdminLayout-CYRbvoqv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NavLink = (0, import_react.forwardRef)(({ className, activeClassName, pendingClassName: _pendingClassName, end, to, ...props }, ref) => {
	const { pathname } = useLocation$1();
	const target = to.split("?")[0].split("#")[0];
	const isActive = end ? pathname === target : pathname === target || pathname.startsWith(target.endsWith("/") ? target : `${target}/`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
		ref,
		to,
		className: cn(className, isActive && activeClassName),
		...props
	});
});
NavLink.displayName = "NavLink";
var navItems = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		href: "/blog/admin"
	},
	{
		icon: FileText,
		label: "Posts",
		href: "/blog/admin/posts"
	},
	{
		icon: FolderOpen,
		label: "Categories",
		href: "/blog/admin/categories"
	},
	{
		icon: Tags,
		label: "Tags",
		href: "/blog/admin/tags"
	},
	{
		icon: Image,
		label: "Media",
		href: "/blog/admin/media"
	}
];
function BlogAdminLayout({ children, title, actions }) {
	const location = useLocation$1();
	const { user, loading: authLoading } = useAuth();
	const { role, isLoading: roleLoading } = useUserRole();
	if (authLoading || roleLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen flex items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate$1, {
		to: "/auth",
		state: { from: location },
		replace: true
	});
	if (role !== "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen flex items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold",
					children: "Access Denied"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "You need admin privileges to access this area."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						children: "Go Home"
					})
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex bg-muted/30",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "w-64 bg-card border-r border-border flex-shrink-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "h-full flex flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-4 border-b border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								asChild: true,
								className: "h-8 w-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "/",
									"aria-label": "Back to site",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold",
								children: "Blog Admin"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex-1 p-3 space-y-1",
						children: navItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NavLink, {
							to: item.href,
							end: item.href === "/blog/admin",
							className: cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", "text-muted-foreground hover:text-foreground hover:bg-muted"),
							activeClassName: "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "h-4 w-4" }), item.label]
						}, item.href))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-4 border-t border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/blog",
							target: "_blank",
							rel: "noopener noreferrer",
							className: "text-sm text-muted-foreground hover:text-foreground transition-colors",
							children: "View Blog →"
						})
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "flex-1 flex flex-col min-w-0",
			children: [(title || actions) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "bg-card border-b border-border px-6 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-semibold",
						children: title
					}), actions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-2",
						children: actions
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 p-6 overflow-auto",
				children
			})]
		})]
	});
}
//#endregion
export { BlogAdminLayout as t };
