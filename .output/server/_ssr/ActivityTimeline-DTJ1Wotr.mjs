import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { Bt as HandGrab, H as RotateCcw, Hn as Activity, In as BookOpen, J as Plus, Jt as GitBranch, M as Star, P as Sparkles, Ut as Globe, V as Save, Wt as Github, Zt as FolderOpen, a as Users, b as Trash2, c as UserPlus, cn as Copy, et as Pencil, gt as LoaderCircle, l as UserMinus, on as Crown, r as Workflow, s as User, tn as EyeOff } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { t as useInfiniteQuery } from "../_libs/tanstack__react-query.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { t as useInView } from "../_libs/react-intersection-observer.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ActivityTimeline-DTJ1Wotr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useActivityEvents(options = {}) {
	const { teamId, actorId, itemId, itemType, limit = 20 } = options;
	return useInfiniteQuery({
		queryKey: [
			"activity-events",
			teamId,
			actorId,
			itemId,
			itemType
		],
		queryFn: async ({ pageParam = 0 }) => {
			let query = supabase.from("activity_events").select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `).order("created_at", { ascending: false }).range(pageParam, pageParam + limit - 1);
			if (teamId) query = query.eq("team_id", teamId);
			if (actorId) query = query.eq("actor_id", actorId);
			if (itemId) query = query.eq("item_id", itemId);
			if (itemType) query = query.eq("item_type", itemType);
			const { data, error } = await query;
			if (error) throw error;
			return data || [];
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < limit) return void 0;
			return allPages.length * limit;
		},
		initialPageParam: 0
	});
}
function useOwnActivityFeed(userId, limit = 20) {
	return useInfiniteQuery({
		queryKey: ["own-activity-feed", userId],
		queryFn: async ({ pageParam = 0 }) => {
			const { data, error } = await supabase.from("activity_events").select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `).eq("actor_id", userId).order("created_at", { ascending: false }).range(pageParam, pageParam + limit - 1);
			if (error) throw error;
			return data || [];
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < limit) return void 0;
			return allPages.length * limit;
		},
		initialPageParam: 0,
		enabled: !!userId
	});
}
/**
* One person's activity, which only that person can see.
*
* `isOwnProfile` used to switch to "only show public events" for a visitor,
* which meant `team_id IS NULL` and therefore nothing at all, because RLS
* refuses another user's rows whatever the filter says. Somebody else's
* activity page was empty for everyone who looked at it, and the page told
* them the person had done nothing.
*
* The query is not sent for a visitor now, so the page can say the true thing
* instead: this is private.
*/
function useUserActivityFeed(userId, isOwnProfile, limit = 20) {
	return useInfiniteQuery({
		queryKey: ["user-activity-feed", userId],
		queryFn: async ({ pageParam = 0 }) => {
			const { data, error } = await supabase.from("activity_events").select(`
          *,
          actor:profiles!activity_events_actor_id_fkey(id, display_name, avatar_url)
        `).eq("actor_id", userId).order("created_at", { ascending: false }).range(pageParam, pageParam + limit - 1);
			if (error) throw error;
			return data || [];
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < limit) return void 0;
			return allPages.length * limit;
		},
		initialPageParam: 0,
		enabled: !!userId && isOwnProfile
	});
}
var actionIcons = {
	create: Plus,
	update: Pencil,
	autosave: Save,
	publish: Globe,
	unpublish: EyeOff,
	clone: Copy,
	delete: Trash2,
	restore: RotateCcw,
	review: Star,
	version: GitBranch,
	team_create: Users,
	team_add_member: UserPlus,
	team_remove_member: UserMinus,
	team_promote_member: Crown,
	github_sync_triggered: Github
};
var itemTypeIcons = {
	prompt: Sparkles,
	skill: BookOpen,
	workflow: Workflow,
	claw: HandGrab,
	collection: FolderOpen,
	profile: User,
	team: Users
};
function ActivityIcon({ action, itemType, className = "h-4 w-4" }) {
	const Icon = actionIcons[action] || Pencil;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className });
}
function ItemTypeIcon({ itemType, className = "h-4 w-4" }) {
	const Icon = itemTypeIcons[itemType] || Sparkles;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className });
}
function getActionLabel(action, itemType) {
	const itemLabel = itemType || "item";
	return {
		create: `created a ${itemLabel}`,
		update: `updated a ${itemLabel}`,
		autosave: `autosaved a ${itemLabel}`,
		publish: `published a ${itemLabel}`,
		unpublish: `unpublished a ${itemLabel}`,
		clone: `cloned a ${itemLabel}`,
		delete: `deleted a ${itemLabel}`,
		restore: `restored a ${itemLabel}`,
		review: `reviewed a ${itemLabel}`,
		version: `created a new version of a ${itemLabel}`,
		team_create: "created a team",
		team_add_member: "added a team member",
		team_remove_member: "removed a team member",
		team_promote_member: "promoted a team member",
		github_sync_triggered: "triggered GitHub sync"
	}[action] || `performed ${action} on a ${itemLabel}`;
}
function getActionColor(action) {
	return {
		create: "text-green-500",
		update: "text-blue-500",
		autosave: "text-muted-foreground",
		publish: "text-emerald-500",
		unpublish: "text-yellow-500",
		clone: "text-purple-500",
		delete: "text-red-500",
		restore: "text-cyan-500",
		review: "text-amber-500",
		version: "text-indigo-500",
		team_create: "text-primary",
		team_add_member: "text-green-500",
		team_remove_member: "text-red-500",
		team_promote_member: "text-amber-500",
		github_sync_triggered: "text-muted-foreground"
	}[action] || "text-muted-foreground";
}
function ActivityEventCard({ event, showItemLink = true }) {
	const actorName = event.actor?.display_name || "Unknown user";
	const actorInitial = actorName.charAt(0).toUpperCase();
	const actionLabel = getActionLabel(event.action, event.item_type);
	const actionColor = getActionColor(event.action);
	const getItemLink = () => {
		if (!event.item_type || !event.item_id) return null;
		return {
			prompt: `/prompts/${event.item_id}`,
			skill: `/skills/${event.item_id}`,
			workflow: `/workflows/${event.item_id}`,
			collection: `/collections/${event.item_id}`,
			profile: `/u/${event.metadata?.username || event.item_id}`,
			team: `/team/${event.item_id}/settings`
		}[event.item_type] || null;
	};
	const itemLink = getItemLink();
	const itemTitle = event.metadata?.title || event.metadata?.name || "Untitled";
	const changedFields = event.metadata?.changedFields;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-3 p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
			to: event.actor ? `/u/${event.actor.display_name || event.actor_id}` : "#",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
				className: "h-10 w-10 shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
					src: event.actor?.avatar_url || void 0,
					alt: actorName
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
					className: "bg-primary/10 text-primary",
					children: actorInitial
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 min-w-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2 flex-wrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
						to: event.actor ? `/u/${event.actor.display_name || event.actor_id}` : "#",
						className: "font-medium text-foreground hover:text-primary transition-colors",
						children: actorName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1.5 text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityIcon, {
							action: event.action,
							className: `h-3.5 w-3.5 ${actionColor}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: actionLabel })]
					})]
				}),
				showItemLink && itemLink && event.item_type && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 mt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemTypeIcon, {
						itemType: event.item_type,
						className: "h-4 w-4 text-muted-foreground"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
						to: itemLink,
						className: "text-primary hover:underline font-medium truncate",
						children: itemTitle
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 mt-2 flex-wrap",
					children: [
						changedFields && changedFields.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "secondary",
							className: "text-xs",
							children: [
								changedFields.length,
								" field",
								changedFields.length > 1 ? "s" : "",
								" ",
								"changed"
							]
						}),
						event.metadata?.versionNumber && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "text-xs",
							children: ["v", event.metadata.versionNumber]
						}),
						event.metadata?.rating && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "secondary",
							className: "text-xs",
							children: ["⭐ ", event.metadata.rating]
						}),
						event.metadata?.memberName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "secondary",
							className: "text-xs",
							children: event.metadata.memberName
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground mt-2",
					children: formatDistanceToNow(new Date(event.created_at), { addSuffix: true })
				})
			]
		})]
	});
}
function ActivityTimeline({ events, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, showItemLink = true, emptyMessage = "No activity yet" }) {
	const { ref, inView } = useInView();
	(0, import_react.useEffect)(() => {
		if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
	}, [
		inView,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage
	]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
	});
	if (events.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center py-12 text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-12 w-12 mb-4 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: emptyMessage })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "divide-y divide-border",
		children: [
			events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityEventCard, {
				event,
				showItemLink
			}, event.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref,
				className: "h-1"
			}),
			isFetchingNextPage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-center py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
			}),
			!hasNextPage && events.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-center py-4 text-sm text-muted-foreground",
				children: "No more activity to load"
			})
		]
	});
}
//#endregion
export { useUserActivityFeed as i, useActivityEvents as n, useOwnActivityFeed as r, ActivityTimeline as t };
