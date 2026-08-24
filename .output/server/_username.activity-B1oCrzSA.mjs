import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Vn as ArrowLeft } from "./_libs/lucide-react.mjs";
import { c as useParams$1, i as useAuth, n as Link$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { r as useQuery } from "./_libs/tanstack__react-query.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./_ssr/avatar-CLMN7E0g.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { i as useUserActivityFeed, t as ActivityTimeline } from "./_ssr/ActivityTimeline-DTJ1Wotr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_username.activity-B1oCrzSA.js
var import_jsx_runtime = require_jsx_runtime();
function UserActivity() {
	const { username } = useParams$1();
	const { user } = useAuth();
	const { data: profile, isLoading: profileLoading } = useQuery({
		queryKey: ["profile-by-username", username],
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, display_name, avatar_url, bio, website, twitter, github").eq("display_name", username).single();
			if (error) throw error;
			return data;
		},
		enabled: !!username
	});
	const isOwnProfile = user?.id === profile?.id;
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useUserActivityFeed(profile?.id || "", isOwnProfile);
	const events = data?.pages.flat() || [];
	if (profileLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" })
	});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-grow container mx-auto px-4 py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-bold text-foreground mb-2",
						children: "User not found"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted-foreground",
						children: [
							"The user \"",
							username,
							"\" doesn't exist."
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
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
							to: `/u/${username}`,
							className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Profile"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "h-16 w-16",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
									src: profile.avatar_url || void 0,
									alt: profile.display_name || "User"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "bg-primary/10 text-primary text-xl",
									children: (profile.display_name || "U").charAt(0).toUpperCase()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-3xl font-bold text-foreground",
								children: [profile.display_name, "'s Activity"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: isOwnProfile ? "Your recent activity" : "Activity is private to each account"
							})] })]
						}),
						isOwnProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border border-border rounded-lg bg-card overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityTimeline, {
								events,
								isLoading,
								isFetchingNextPage,
								hasNextPage: hasNextPage ?? false,
								fetchNextPage,
								emptyMessage: "You haven't performed any activity yet"
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border border-border rounded-lg bg-card p-8 text-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted-foreground",
								children: [profile.display_name, " keeps their activity to themselves, as everyone here does. Their published prompts, skills and workflows are on their profile."]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = UserActivity;
//#endregion
export { SplitComponent as component };
