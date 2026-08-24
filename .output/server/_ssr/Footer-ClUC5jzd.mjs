import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { $t as FileText, B as Search, Ct as Library, F as Shield, Hn as Activity, In as BookOpen, J as Plus, On as ChevronDown, Ot as KeyRound, P as Sparkles, R as Settings, Ut as Globe, Wt as Github, Zt as FolderOpen, a as Users, at as Package, dn as Compass, fn as Command, ft as Menu, ht as Lock, i as WandSparkles, jn as Building2, k as Sun, kn as Check, mt as LogOut, n as X, ot as Newspaper, r as Workflow, s as User, st as Moon, t as Zap, u as Upload } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, n as Link$1, o as useLocation$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { f as useUserTeams, i as useCreateTeam, n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { a as DropdownMenuTrigger, i as DropdownMenuSeparator, n as DropdownMenuContent, o as useDebounce, r as DropdownMenuItem, t as DropdownMenu } from "./useDebounce-CjI32hnI.mjs";
import { t as useUserRole } from "./useUserRole-B1YhonQE.mjs";
import { t as j } from "../_libs/next-themes.mjs";
import { i as Trigger, n as Provider, r as Root3, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
import { t as _e } from "../_libs/cmdk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Footer-ClUC5jzd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TooltipProvider = Provider;
var Tooltip = Root3;
var TooltipTrigger = Trigger;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
	...props
}));
TooltipContent.displayName = Content2.displayName;
var WorkspaceContext = (0, import_react.createContext)(void 0);
var WORKSPACE_STORAGE_KEY = "querino_current_workspace";
function WorkspaceProvider({ children }) {
	const { user } = useAuthContext();
	const { data: teams = [], isLoading } = useUserTeams();
	const [currentWorkspace, setCurrentWorkspace] = (0, import_react.useState)("personal");
	(0, import_react.useEffect)(() => {
		const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
		if (saved && saved !== "personal") setCurrentWorkspace(saved);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isLoading && currentWorkspace !== "personal") {
			if (!teams.some((t) => t.id === currentWorkspace)) {
				setCurrentWorkspace("personal");
				localStorage.setItem(WORKSPACE_STORAGE_KEY, "personal");
			}
		}
	}, [
		teams,
		isLoading,
		currentWorkspace
	]);
	(0, import_react.useEffect)(() => {
		if (!user) {
			setCurrentWorkspace("personal");
			localStorage.removeItem(WORKSPACE_STORAGE_KEY);
		}
	}, [user]);
	const switchWorkspace = (workspaceId) => {
		setCurrentWorkspace(workspaceId);
		localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
	};
	const currentTeam = currentWorkspace === "personal" ? null : teams.find((t) => t.id === currentWorkspace) || null;
	const isTeamWorkspace = currentWorkspace !== "personal";
	const canManageTeam = currentTeam?.role === "owner" || currentTeam?.role === "admin";
	const canPublish = currentTeam?.role === "owner" || currentTeam?.role === "admin";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceContext.Provider, {
		value: {
			currentWorkspace,
			currentTeam,
			teams,
			isLoading,
			switchWorkspace,
			isTeamWorkspace,
			canManageTeam,
			canPublish
		},
		children
	});
}
function useWorkspace() {
	const context = (0, import_react.useContext)(WorkspaceContext);
	if (context === void 0) throw new Error("useWorkspace must be used within a WorkspaceProvider");
	return context;
}
var logo_default = "/assets/logo-51ejUbE0.png";
/**
* Hook to check if user has premium access based on user_roles table.
* This is the authoritative source for premium gating.
*/
function usePremiumCheck() {
	const { user } = useAuthContext();
	const { role, isLoading, isPremium, isAdmin, isFree, refetch } = useUserRole();
	const isAnonymous = !user;
	const hasAccess = (requires) => {
		if (!user || !role) return false;
		if (requires === "premium" || requires === "team") return isPremium;
		return false;
	};
	return {
		user,
		role,
		isPremium,
		isAdmin,
		isFree,
		isAnonymous,
		isLoading,
		hasAccess,
		refetch
	};
}
function WorkspacePicker() {
	const navigate = useNavigate$1();
	const { currentWorkspace, currentTeam, teams, switchWorkspace, canManageTeam, isTeamWorkspace } = useWorkspace();
	const createTeam = useCreateTeam();
	const { isPremium, user } = usePremiumCheck();
	const [showCreateDialog, setShowCreateDialog] = (0, import_react.useState)(false);
	const [newTeamName, setNewTeamName] = (0, import_react.useState)("");
	const handleCreateTeam = async () => {
		if (!newTeamName.trim()) return;
		if (!isPremium) {
			toast.error("Teams are available on Premium. Please upgrade to create teams.");
			return;
		}
		try {
			const team = await createTeam.mutateAsync(newTeamName.trim());
			switchWorkspace(team.id);
			setShowCreateDialog(false);
			setNewTeamName("");
			toast.success("Team created successfully!");
		} catch (error) {
			toast.error("Failed to create team");
		}
	};
	const handleCreateTeamClick = () => {
		if (isPremium) setShowCreateDialog(true);
	};
	const displayName = currentWorkspace === "personal" ? "Personal" : currentTeam?.name || "Team";
	if (!user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			className: cn("gap-2 px-3 h-9 border-dashed", isTeamWorkspace && "border-primary/50 bg-primary/5"),
			children: [
				currentWorkspace === "personal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4 w-4 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "max-w-[140px] truncate font-medium",
					children: displayName
				}),
				isTeamWorkspace && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "secondary",
					className: "h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-0",
					children: "Team"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3.5 w-3.5 opacity-50" })
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "start",
		className: "w-64",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-2 py-1.5 text-xs font-medium text-muted-foreground",
				children: "Switch Workspace"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				onClick: () => switchWorkspace("personal"),
				className: "gap-2 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: "Personal Workspace"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Your private prompts & settings"
						})]
					}),
					currentWorkspace === "personal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" })
				]
			}),
			isPremium && teams.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-2 py-1.5 text-xs font-medium text-muted-foreground",
				children: "Teams"
			})] }),
			isPremium && teams.map((team) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				onClick: () => switchWorkspace(team.id),
				className: "gap-2 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4 w-4" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium truncate",
							children: team.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground capitalize",
							children: team.role
						})]
					}),
					currentWorkspace === team.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" })
				]
			}, team.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			currentWorkspace !== "personal" && canManageTeam && isPremium && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				onClick: () => navigate(`/team/${currentWorkspace}/settings`),
				className: "gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4" }), "Team Settings"]
			}),
			isPremium ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				onClick: handleCreateTeamClick,
				className: "gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "Create Team"]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-2 py-3 border-t border-border mt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2 mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4 text-muted-foreground mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-foreground font-medium",
							children: "Teams require Premium"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mt-0.5",
							children: "Collaborate with shared team libraries"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "mailto:support@querino.ai",
					className: "block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						className: "w-full gap-1.5 h-8",
						children: "Contact Support"
					})
				})]
			})
		]
	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: showCreateDialog,
		onOpenChange: setShowCreateDialog,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create New Team" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "team-name",
						children: "Team Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "team-name",
						value: newTeamName,
						onChange: (e) => setNewTeamName(e.target.value),
						placeholder: "My Awesome Team"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setShowCreateDialog(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: handleCreateTeam,
				disabled: !newTeamName.trim() || createTeam.isPending,
				children: createTeam.isPending ? "Creating..." : "Create Team"
			})] })
		] })
	})] });
}
var Command$2 = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$2.displayName = _e.displayName;
var CommandDialog = ({ children, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "overflow-hidden p-0 shadow-lg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command$2, {
				className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
				children
			})
		})
	});
};
var CommandInput = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
		ref,
		className: cn("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = _e.Input.displayName;
var CommandList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = _e.List.displayName;
var CommandEmpty = import_react.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = _e.Empty.displayName;
var CommandGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = _e.Group.displayName;
var CommandSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = _e.Separator.displayName;
var CommandItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50", className),
	...props
}));
CommandItem.displayName = _e.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
var BACKSLASH = String.fromCharCode(92);
/**
* Escape a user-supplied string so it can sit inside a double-quoted PostgREST
* filter value and be matched literally by ILIKE.
*
* The caller wraps the result in quotes and adds its own wildcards; see
* {@link ilikeContains}.
*/
function escapeFilterValue(input) {
	let out = "";
	for (const char of input) switch (char) {
		case BACKSLASH:
			out += BACKSLASH.repeat(4);
			break;
		case "%":
		case "_":
			out += BACKSLASH.repeat(2) + char;
			break;
		case "\"":
			out += "\\\"";
			break;
		case "*":
			out += "_";
			break;
		default: out += char;
	}
	return out;
}
/**
* One `column.ilike."%term%"` filter term, safe for any user input.
*
* The wildcards are added outside {@link escapeFilterValue} on purpose: those
* two are ours and must keep working as wildcards.
*/
function ilikeContains(column, term) {
	return `${column}.ilike."%${escapeFilterValue(term)}%"`;
}
/**
* The whole `or(...)` expression for "this term appears in any of these
* columns". Pass the result straight to supabase-js `.or()`.
*/
function orIlikeContains(columns, term) {
	return columns.map((column) => ilikeContains(column, term)).join(",");
}
/**
* "Mine, or one of my teams'", as an `or(...)` expression.
*
* Finding M3: with no teams, `team_id.in.()` is a syntax error that fails the
* whole query, and the swallowed error made it look like the user simply owned
* nothing. With an empty list the clause is left out entirely.
*
* The ids are UUIDs from the session and the workspace context rather than
* anything typed, so they are not escaped, but they are still quoted so a
* malformed one cannot reshape the filter.
*/
function ownedByUserOrTeams(userIdColumn, userId, teamIdColumn, teamIds) {
	const mine = `${userIdColumn}.eq.${userId}`;
	if (teamIds.length === 0) return mine;
	return `${mine},${teamIdColumn}.in.(${teamIds.map((id) => `"${escapeFilterValue(id)}"`).join(",")})`;
}
/** Words past this are ignored. Dropping a word only ever widens the result
*  set, so a long query degrades into a looser search rather than a wrong
*  "nothing found". */
var MAX_SEARCH_TERMS = 8;
/**
* Split a search query into terms.
*
* Whitespace separates words. A "quoted phrase" stays one term, which is how
* a caller asks for the old side-by-side behaviour on purpose.
*
* Returns an empty array for a blank query; callers then apply no search
* filter at all rather than matching the empty string.
*/
function tokenizeSearchQuery(query) {
	const terms = [];
	const pattern = /"([^"]*)"|(\S+)/g;
	let match;
	while ((match = pattern.exec(query)) !== null) {
		const term = (match[1] ?? match[2] ?? "").trim();
		if (term) terms.push(term);
		if (terms.length >= MAX_SEARCH_TERMS) break;
	}
	return terms;
}
/**
* "Every word appears somewhere in these columns", as one `or(...)` expression
* per word.
*
* PostgREST ANDs repeated top-level query parameters, and supabase-js appends
* rather than replaces on each `.or()` call, so chaining these gives
* (word1 in any column) AND (word2 in any column) AND ...
*
*   let q = sb.from("skills").select("*").eq("author_id", id);
*   for (const f of allTermsFilters(SEARCH_COLUMNS, query)) q = q.or(f);
*/
function allTermsFilters(columns, query) {
	return tokenizeSearchQuery(query).map((term) => orIlikeContains(columns, term));
}
var SEARCH_COLUMNS = [
	"title",
	"description",
	"content"
];
/**
* "Every word appears somewhere in these columns."
*
* Each word becomes its own `or(...)`, and PostgREST ANDs repeated parameters,
* so a two-word search no longer requires the two words to sit side by side in
* one column. That requirement is what made multi-word searches come back
* empty; see the note in supabase/functions/_shared/postgrestFilter.ts.
*/
function withAllTerms(builder, columns, query) {
	return allTermsFilters(columns, query).reduce((acc, filter) => acc.or(filter), builder);
}
function useCommandPaletteSearch(query) {
	const [artefacts, setArtefacts] = (0, import_react.useState)([]);
	const [publicPrompts, setPublicPrompts] = (0, import_react.useState)([]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const debouncedQuery = useDebounce(query, 200);
	const { user } = useAuthContext();
	const { currentWorkspace, currentTeam, teams } = useWorkspace();
	(0, import_react.useEffect)(() => {
		if (!user || !debouncedQuery.trim()) {
			setArtefacts([]);
			setError(null);
			return;
		}
		const searchArtefacts = async () => {
			setIsLoading(true);
			setError(null);
			const results = [];
			try {
				const teamIds = teams.map((t) => t.id);
				const scope = ownedByUserOrTeams("author_id", user.id, "team_id", teamIds);
				let promptQuery = supabase.from("prompts").select("id, title, description, is_public, team_id").limit(10);
				promptQuery = withAllTerms(promptQuery, SEARCH_COLUMNS, debouncedQuery);
				if (currentWorkspace === "personal") promptQuery = promptQuery.eq("author_id", user.id).is("team_id", null);
				else promptQuery = promptQuery.or(scope);
				const { data: prompts, error: promptError } = await promptQuery;
				if (promptError) throw promptError;
				prompts?.forEach((p) => {
					results.push({
						id: p.id,
						title: p.title,
						type: "prompt",
						description: p.description,
						isPublic: p.is_public,
						teamId: p.team_id,
						teamName: teams.find((t) => t.id === p.team_id)?.name
					});
				});
				let skillQuery = supabase.from("skills").select("id, title, description, published, team_id").limit(10);
				skillQuery = withAllTerms(skillQuery, SEARCH_COLUMNS, debouncedQuery);
				if (currentWorkspace === "personal") skillQuery = skillQuery.eq("author_id", user.id).is("team_id", null);
				else skillQuery = skillQuery.or(scope);
				const { data: skills, error: skillError } = await skillQuery;
				if (skillError) throw skillError;
				skills?.forEach((s) => {
					results.push({
						id: s.id,
						title: s.title,
						type: "skill",
						description: s.description,
						isPublic: s.published,
						teamId: s.team_id,
						teamName: teams.find((t) => t.id === s.team_id)?.name
					});
				});
				let workflowQuery = supabase.from("workflows").select("id, title, description, published, team_id").limit(10);
				workflowQuery = withAllTerms(workflowQuery, SEARCH_COLUMNS, debouncedQuery);
				if (currentWorkspace === "personal") workflowQuery = workflowQuery.eq("author_id", user.id).is("team_id", null);
				else workflowQuery = workflowQuery.or(scope);
				const { data: workflows, error: workflowError } = await workflowQuery;
				if (workflowError) throw workflowError;
				workflows?.forEach((w) => {
					results.push({
						id: w.id,
						title: w.title,
						type: "workflow",
						description: w.description,
						isPublic: w.published,
						teamId: w.team_id,
						teamName: teams.find((t) => t.id === w.team_id)?.name
					});
				});
				let kitQuery = supabase.from("prompt_kits").select("id, slug, title, description, published, team_id").limit(10);
				kitQuery = withAllTerms(kitQuery, SEARCH_COLUMNS, debouncedQuery);
				if (currentWorkspace === "personal") kitQuery = kitQuery.eq("author_id", user.id).is("team_id", null);
				else kitQuery = kitQuery.or(scope);
				const { data: kits, error: kitError } = await kitQuery;
				if (kitError) throw kitError;
				kits?.forEach((k) => {
					results.push({
						id: k.slug || k.id,
						title: k.title,
						type: "prompt_kit",
						description: k.description,
						isPublic: k.published,
						teamId: k.team_id,
						teamName: teams.find((t) => t.id === k.team_id)?.name
					});
				});
				setArtefacts(results.slice(0, 12));
			} catch (err) {
				console.error("Command palette search error:", err);
				setArtefacts([]);
				setError(err instanceof Error ? err.message : "Search failed");
			} finally {
				setIsLoading(false);
			}
		};
		searchArtefacts();
	}, [
		debouncedQuery,
		user,
		currentWorkspace,
		teams
	]);
	(0, import_react.useEffect)(() => {
		if (!debouncedQuery.trim()) {
			setPublicPrompts([]);
			return;
		}
		const searchPublic = async () => {
			try {
				const { data, error: publicError } = await withAllTerms(supabase.from("prompts").select("id, title, description").eq("is_public", true), SEARCH_COLUMNS, debouncedQuery).order("rating_avg", { ascending: false }).limit(8);
				if (publicError) throw publicError;
				setPublicPrompts((data || []).map((p) => ({
					id: p.id,
					title: p.title,
					type: "prompt",
					description: p.description,
					isPublic: true
				})));
			} catch (err) {
				console.error("Public search error:", err);
				setPublicPrompts([]);
			}
		};
		searchPublic();
	}, [debouncedQuery]);
	return {
		artefacts,
		publicPrompts,
		isLoading,
		error,
		hasQuery: debouncedQuery.trim().length > 0
	};
}
var artefactIcons = {
	prompt: Sparkles,
	skill: FileText,
	workflow: Workflow,
	prompt_kit: Package
};
function CommandPalette({ open, onOpenChange }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const { teams, switchWorkspace } = useWorkspace();
	const { artefacts, publicPrompts, isLoading, hasQuery } = useCommandPaletteSearch(query);
	(0, import_react.useEffect)(() => {
		if (!open) setQuery("");
	}, [open]);
	(0, import_react.useEffect)(() => {
		const handleKeyDown = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				onOpenChange(!open);
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onOpenChange]);
	const runCommand = (0, import_react.useCallback)((command) => {
		onOpenChange(false);
		command();
	}, [onOpenChange]);
	const quickActions = [
		{
			label: "New Prompt",
			icon: Plus,
			action: () => navigate("/prompts/new"),
			requiresAuth: true
		},
		{
			label: "New Prompt Kit",
			icon: Plus,
			action: () => navigate("/prompt-kits/new"),
			requiresAuth: true
		},
		{
			label: "New Skill",
			icon: Plus,
			action: () => navigate("/skills/new"),
			requiresAuth: true
		},
		{
			label: "New Workflow",
			icon: Plus,
			action: () => navigate("/workflows/new"),
			requiresAuth: true
		},
		{
			label: "Open My Library",
			icon: Library,
			action: () => navigate("/library"),
			requiresAuth: true
		},
		{
			label: "Open My Collections",
			icon: FolderOpen,
			action: () => navigate("/collections"),
			requiresAuth: true
		},
		{
			label: "Open My Profile",
			icon: User,
			action: () => navigate("/profile/edit"),
			requiresAuth: true
		},
		{
			label: "Open Settings",
			icon: Settings,
			action: () => navigate("/settings"),
			requiresAuth: true
		},
		{
			label: "GitHub Sync Settings",
			icon: Github,
			action: () => navigate("/settings"),
			requiresAuth: true
		}
	];
	const navigationCommands = [
		{
			label: "Go to Discover",
			icon: Compass,
			action: () => navigate("/discover"),
			requiresAuth: false
		},
		{
			label: "Go to Activity Feed",
			icon: Activity,
			action: () => navigate("/activity"),
			requiresAuth: false
		},
		{
			label: "Go to Docs",
			icon: BookOpen,
			action: () => navigate("/docs"),
			requiresAuth: false
		},
		{
			label: "Go to Blog",
			icon: Newspaper,
			action: () => navigate("/blog"),
			requiresAuth: false
		},
		{
			label: "Open Settings",
			icon: Settings,
			action: () => navigate("/settings"),
			requiresAuth: true
		},
		{
			label: "MCP Tokens",
			icon: KeyRound,
			action: () => navigate("/settings#mcp"),
			requiresAuth: true
		}
	];
	const filteredQuickActions = quickActions.filter((action) => {
		if (action.requiresAuth && !user) return false;
		if (!query.trim()) return true;
		return action.label.toLowerCase().includes(query.toLowerCase());
	});
	const filteredNavigation = navigationCommands.filter((cmd) => {
		if (cmd.requiresAuth && !user) return false;
		if (!query.trim()) return true;
		return cmd.label.toLowerCase().includes(query.toLowerCase());
	});
	const teamCommands = teams.filter((team) => {
		if (!query.trim()) return true;
		return team.name.toLowerCase().includes(query.toLowerCase()) || "switch workspace".includes(query.toLowerCase());
	}).map((team) => ({
		label: `Switch to ${team.name}`,
		icon: Users,
		action: () => {
			switchWorkspace(team.id);
			navigate("/library");
		}
	}));
	const showPublicPrompts = hasQuery && artefacts.length === 0 && publicPrompts.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandDialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Command$2, {
			className: "rounded-lg border shadow-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandInput, {
				placeholder: "Search artefacts, run commands...",
				value: query,
				onValueChange: setQuery
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandList, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandEmpty, { children: isLoading ? "Searching..." : "No results found." }),
				filteredQuickActions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
					heading: "Quick Actions",
					children: filteredQuickActions.map((action) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
						onSelect: () => runCommand(action.action),
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(action.icon, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: action.label })]
					}, action.label))
				}),
				teamCommands.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandSeparator, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandGroup, {
					heading: "Workspaces",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
						onSelect: () => runCommand(() => {
							switchWorkspace("personal");
							navigate("/library");
						}),
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Switch to Personal Workspace" })]
					}), teamCommands.map((cmd) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
						onSelect: () => runCommand(cmd.action),
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(cmd.icon, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cmd.label })]
					}, cmd.label))]
				})] }),
				artefacts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandSeparator, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
					heading: "Your Artefacts",
					children: artefacts.map((artefact) => {
						const Icon = artefactIcons[artefact.type];
						const route = artefact.type === "prompt" ? `/prompts/${artefact.id}` : artefact.type === "skill" ? `/skills/${artefact.id}` : artefact.type === "prompt_kit" ? `/prompt-kits/${artefact.id}` : `/workflows/${artefact.id}`;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
							onSelect: () => runCommand(() => navigate(route)),
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1 min-w-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: artefact.title
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-xs capitalize",
										children: artefact.type
									}), artefact.teamName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-xs",
										children: artefact.teamName
									})]
								})
							]
						}, `${artefact.type}-${artefact.id}`);
					})
				})] }),
				showPublicPrompts && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandSeparator, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
					heading: "Public Prompts",
					children: publicPrompts.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
						onSelect: () => runCommand(() => navigate(`/prompts/${prompt.id}`)),
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 min-w-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									children: prompt.title
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "text-xs",
								children: "Public"
							})
						]
					}, prompt.id))
				})] }),
				filteredNavigation.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandSeparator, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
					heading: "Navigation",
					children: filteredNavigation.map((cmd) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
						onSelect: () => runCommand(cmd.action),
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(cmd.icon, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cmd.label })]
					}, cmd.label))
				})] })
			] })]
		})
	});
}
function ThemeToggle({ withLabel = false, className }) {
	const { resolvedTheme, setTheme } = j();
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
	}, []);
	const isDark = mounted && resolvedTheme === "dark";
	const next = isDark ? "light" : "dark";
	const label = isDark ? "Switch to light mode" : "Switch to dark mode";
	if (withLabel) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "ghost",
		className: className ?? "w-full justify-start gap-2",
		onClick: () => setTheme(next),
		"aria-label": label,
		children: [isDark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-4 w-4" }), isDark ? "Light mode" : "Dark mode"]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "ghost",
			size: "icon",
			className: className ?? "h-9 w-9",
			onClick: () => setTheme(next),
			"aria-label": label,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: label
				})
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Toggle theme" }) })] });
}
/**
* Lightweight, cached credits read for always-visible UI (header pill).
* Unlike useAICredits it does NOT invoke ensure-token-allowance and is
* deduplicated across mounts via TanStack Query.
*/
function useAICreditsSummary() {
	const { user } = useAuthContext();
	return useQuery({
		queryKey: ["ai-credits-summary", user?.id],
		enabled: !!user,
		staleTime: 3e5,
		queryFn: async () => {
			const [allowanceResult, settingsResult] = await Promise.all([supabase.from("v_ai_allowance_current").select("remaining_tokens, period_end").eq("user_id", user.id).maybeSingle(), supabase.from("ai_credit_settings").select("value_int").eq("key", "tokens_per_credit").maybeSingle()]);
			if (allowanceResult.error || !allowanceResult.data) return null;
			const tokensPerCredit = settingsResult.data?.value_int || 200;
			return {
				remainingCredits: (Number(allowanceResult.data.remaining_tokens) || 0) / tokensPerCredit,
				periodEnd: allowanceResult.data.period_end || null
			};
		}
	});
}
/**
* Compact AI-credit balance for the header. Links to Settings where the
* full CreditsDisplay lives.
*/
function CreditsPill({ className }) {
	const { data: summary } = useAICreditsSummary();
	if (!summary) return null;
	const remaining = Math.max(0, Math.floor(summary.remainingCredits));
	const isEmpty = remaining === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
			to: "/settings",
			className: cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", isEmpty ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground", className),
			"aria-label": `${remaining} AI credits remaining`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-3 w-3" }), remaining]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: isEmpty ? "Out of AI credits — they reset next period. Manage in Settings." : `${remaining} AI credits remaining. Manage in Settings.` })] });
}
/**
* Slugify a title for use as a filename
*/
function slugify(title) {
	if (!title || !title.trim()) return "querino-export";
	return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "querino-export";
}
function unslugify(slug) {
	return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function buildMarkdownContent(data) {
	const frontmatterLines = ["---"];
	frontmatterLines.push(`title: ${data.title}`);
	frontmatterLines.push(`type: ${data.type}`);
	if (data.description) {
		const escapedDesc = data.description.replace(/"/g, "\\\"");
		frontmatterLines.push(`description: "${escapedDesc}"`);
	}
	if (data.tags && data.tags.length > 0) frontmatterLines.push(`tags: [${data.tags.join(", ")}]`);
	if (data.framework) frontmatterLines.push(`framework: ${data.framework}`);
	frontmatterLines.push("---");
	frontmatterLines.push("");
	frontmatterLines.push(data.content);
	return frontmatterLines.join("\n");
}
function parseMarkdownContent(markdown, filename) {
	const trimmed = markdown.trim();
	if (trimmed.startsWith("---")) {
		const secondDashIndex = trimmed.indexOf("---", 3);
		if (secondDashIndex !== -1) {
			const frontmatterStr = trimmed.slice(3, secondDashIndex).trim();
			const content = trimmed.slice(secondDashIndex + 3).trim();
			const frontmatter = parseFrontmatter(frontmatterStr);
			return {
				frontmatter: {
					title: frontmatter.title || deriveTitle(content, filename),
					type: frontmatter.type || "prompt",
					description: frontmatter.description,
					tags: frontmatter.tags,
					framework: frontmatter.framework
				},
				content
			};
		}
	}
	return {
		frontmatter: {
			title: deriveTitle(trimmed, filename),
			type: "prompt"
		},
		content: trimmed
	};
}
function parseFrontmatter(str) {
	const result = {};
	const lines = str.split("\n");
	for (const line of lines) {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;
		const key = line.slice(0, colonIndex).trim();
		let value = line.slice(colonIndex + 1).trim();
		if (value.startsWith("\"") && value.endsWith("\"") || value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
		if (value.startsWith("[") && value.endsWith("]")) result[key] = value.slice(1, -1).split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
		else result[key] = value;
	}
	return result;
}
function deriveTitle(content, filename) {
	const headingMatch = content.match(/^#\s+(.+)$/m);
	if (headingMatch) return headingMatch[1].trim();
	if (filename) return unslugify(filename.replace(/\.md$/i, ""));
	return "Untitled";
}
function downloadMarkdownFile(content, filename) {
	const blob = new Blob([content], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}
function useMarkdownImport(type) {
	const navigate = useNavigate$1();
	const fileInputRef = (0, import_react.useRef)(null);
	const [isProcessing, setIsProcessing] = (0, import_react.useState)(false);
	return {
		triggerFileSelect: (0, import_react.useCallback)(() => {
			if (!fileInputRef.current) {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".md";
				input.style.display = "none";
				input.onchange = async (e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					setIsProcessing(true);
					try {
						const parsed = parseMarkdownContent(await readFileAsText(file), file.name);
						parsed.frontmatter.type = type;
						const params = new URLSearchParams();
						params.set("title", parsed.frontmatter.title);
						if (parsed.frontmatter.description) params.set("description", parsed.frontmatter.description);
						if (parsed.frontmatter.tags && parsed.frontmatter.tags.length > 0) params.set("tags", parsed.frontmatter.tags.join(","));
						if (parsed.frontmatter.framework) params.set("framework", parsed.frontmatter.framework);
						params.set("content", parsed.content);
						navigate(`${{
							prompt: "/prompts/new",
							skill: "/skills/new",
							workflow: "/workflows/new",
							prompt_kit: "/prompt-kits/new"
						}[type]}?${params.toString()}`);
						toast.success("Markdown imported! Review and save your artefact.");
					} catch (err) {
						console.error("Error reading markdown file:", err);
						toast.error("Failed to read markdown file");
					} finally {
						setIsProcessing(false);
						document.body.removeChild(input);
						fileInputRef.current = null;
					}
				};
				document.body.appendChild(input);
				fileInputRef.current = input;
			}
			fileInputRef.current.click();
		}, [navigate, type]),
		isProcessing
	};
}
function Header() {
	const [commandPaletteOpen, setCommandPaletteOpen] = (0, import_react.useState)(false);
	const [mobileMenuOpen, setMobileMenuOpen] = (0, import_react.useState)(false);
	const navigate = useNavigate$1();
	const location = useLocation$1();
	const { user, profile, loading, signOut } = useAuthContext();
	const { isAdmin } = useUserRole();
	const { triggerFileSelect: triggerPromptImport } = useMarkdownImport("prompt");
	const isActive = (path) => location.pathname === path;
	const handleSignOut = async () => {
		const { error } = await signOut();
		if (error) toast.error("Failed to sign out");
		else {
			toast.success("Signed out successfully");
			navigate("/");
		}
	};
	const getInitials = () => {
		if (profile?.display_name) return profile.display_name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
		if (user?.email) return user.email.slice(0, 2).toUpperCase();
		return "U";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container mx-auto flex h-16 items-center justify-between px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: "/",
							className: "flex items-center gap-2 transition-opacity hover:opacity-80",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: logo_default,
								alt: "Querino",
								className: "h-9 w-9"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xl font-bold tracking-tight text-foreground",
								children: "Querino"
							})]
						}), user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden md:block border-l border-border pl-2 ml-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspacePicker, {})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "hidden items-center gap-1 md:flex",
						children: [
							user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/library",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: isActive("/library") ? "secondary" : "ghost",
									size: "sm",
									className: cn(isActive("/library") && "bg-secondary font-medium"),
									children: "My Library"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/discover",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: isActive("/discover") ? "secondary" : "ghost",
									size: "sm",
									className: cn(isActive("/discover") && "bg-secondary font-medium"),
									children: "Discover"
								})
							}),
							user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/collections",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: isActive("/collections") ? "secondary" : "ghost",
									size: "sm",
									className: cn(isActive("/collections") && "bg-secondary font-medium"),
									children: "Collections"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/activity",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: isActive("/activity") ? "secondary" : "ghost",
									size: "sm",
									className: cn(isActive("/activity") && "bg-secondary font-medium"),
									children: "Activity"
								})
							}),
							!user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/#features",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									children: "Features"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden items-center gap-3 md:flex",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "h-9 w-9",
									onClick: () => setCommandPaletteOpen(true),
									"aria-label": "Open command palette",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command, { className: "h-4 w-4" })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Search and Navigate (Ctrl+K)" }) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
							loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-8 animate-pulse rounded-full bg-muted" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditsPill, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										className: "gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "Create"]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
									align: "end",
									className: "w-52",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/prompts/new",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "New Prompt"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/prompts/wizard",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "h-4 w-4" }), "Kickstart Template"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onClick: triggerPromptImport,
											className: "flex items-center gap-2 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }), "Import Prompt from .md"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/skills/new",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), "New Skill"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/workflows/new",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-4 w-4" }), "New Workflow"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/prompt-kits/new",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4" }), "New Prompt Kit"]
											})
										})
									]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										className: "relative h-9 w-9 rounded-full p-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
											className: "h-9 w-9",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
												src: profile?.avatar_url || void 0,
												alt: profile?.display_name || "User"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
												className: "bg-primary text-primary-foreground text-sm",
												children: getInitials()
											})]
										})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
									align: "end",
									className: "w-56",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col space-y-1 p-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium leading-none",
												children: profile?.display_name || "User"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs leading-none text-muted-foreground",
												children: user.email
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/library",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, { className: "h-4 w-4" }), "My Library"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/profile/edit",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }), "Edit Profile"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
												to: "/settings",
												className: "flex items-center gap-2 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4" }), "Settings"]
											})
										}),
										isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
													to: "/admin",
													className: "flex items-center gap-2 cursor-pointer text-primary",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-4 w-4" }), "Admin"]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
													to: "/blog/admin",
													className: "flex items-center gap-2 cursor-pointer text-primary",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), "Blog Admin"]
												})
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onClick: handleSignOut,
											className: "flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "Sign Out"]
										})
									]
								})] })
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/auth",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									children: "Sign In"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/auth?tab=signup",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "default",
									size: "sm",
									children: "Get Started"
								})
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "md:hidden",
						onClick: () => setMobileMenuOpen(!mobileMenuOpen),
						"aria-label": mobileMenuOpen ? "Close menu" : "Open menu",
						"aria-expanded": mobileMenuOpen,
						children: mobileMenuOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-5 w-5" })
					})
				]
			}),
			mobileMenuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-border bg-background md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "container mx-auto flex flex-col gap-1 px-4 py-4",
					children: [
						user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 pb-3 border-b border-border",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-3 py-2 text-sm font-medium text-muted-foreground",
								children: "Workspace"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspacePicker, {})]
						}),
						user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/library",
							onClick: () => setMobileMenuOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: isActive("/library") ? "secondary" : "ghost",
								className: cn("w-full justify-start", isActive("/library") && "font-medium"),
								children: "My Library"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/discover",
							onClick: () => setMobileMenuOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: isActive("/discover") ? "secondary" : "ghost",
								className: cn("w-full justify-start", isActive("/discover") && "font-medium"),
								children: "Discover"
							})
						}),
						user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/collections",
							onClick: () => setMobileMenuOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: isActive("/collections") ? "secondary" : "ghost",
								className: cn("w-full justify-start", isActive("/collections") && "font-medium"),
								children: "Collections"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/activity",
							onClick: () => setMobileMenuOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: isActive("/activity") ? "secondary" : "ghost",
								className: cn("w-full justify-start", isActive("/activity") && "font-medium"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4 w-4 mr-2" }), "Activity"]
							})
						}),
						!user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/#features",
							onClick: () => setMobileMenuOpen(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "w-full justify-start",
								children: "Features"
							})
						}),
						user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 border-t border-border pt-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-3 py-2 text-sm font-medium text-muted-foreground",
									children: "Create"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/prompts/new",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "New Prompt"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/prompts/wizard",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "h-4 w-4" }), "Kickstart Template"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									className: "w-full justify-start gap-2",
									onClick: () => {
										triggerPromptImport();
										setMobileMenuOpen(false);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }), "Import Prompt from .md"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/skills/new",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), "New Skill"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/workflows/new",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workflow, { className: "h-4 w-4" }), "New Workflow"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/prompt-kits/new",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4" }), "New Prompt Kit"]
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-col gap-2 border-t border-border pt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, { withLabel: true }), user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
										className: "h-8 w-8",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: profile?.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
											className: "bg-primary text-primary-foreground text-xs",
											children: getInitials()
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium truncate",
											children: profile?.display_name || "User"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground truncate",
											children: user.email
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/profile/edit",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }), "Edit Profile"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/settings",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4" }), "Settings"]
									})
								}),
								isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/admin",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2 text-primary",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-4 w-4" }), "Admin"]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/blog/admin",
									onClick: () => setMobileMenuOpen(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										className: "w-full justify-start gap-2 text-primary",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), "Blog Admin"]
									})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									className: "w-full justify-start gap-2 text-destructive hover:text-destructive",
									onClick: () => {
										handleSignOut();
										setMobileMenuOpen(false);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "Sign Out"]
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/auth",
								onClick: () => setMobileMenuOpen(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "w-full",
									children: "Sign In"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/auth?tab=signup",
								onClick: () => setMobileMenuOpen(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "default",
									className: "w-full",
									children: "Get Started"
								})
							})] })]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandPalette, {
				open: commandPaletteOpen,
				onOpenChange: setCommandPaletteOpen
			})
		]
	});
}
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "border-t border-border bg-card/50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4 py-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-8 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: "/",
							className: "flex items-center gap-2 rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: logo_default,
								alt: "Querino",
								className: "h-8 w-8"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-lg font-bold text-foreground",
								children: "Querino"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "The AI prompt library for creators, engineers, and innovators."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-sm font-semibold text-foreground",
							children: "Product"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/",
								className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								children: "Discover Prompts"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/library",
								className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								children: "My Library"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-sm font-semibold text-foreground",
							children: "Resources"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/docs",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Documentation"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "https://discord.gg/X3um7vxX8J",
									target: "_blank",
									rel: "noopener noreferrer",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Community Discord"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "mailto:support@querino.ai",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Support"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "https://github.com/MichaelZelbel/querino",
									target: "_blank",
									rel: "noopener noreferrer",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Source Code"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-sm font-semibold text-foreground",
							children: "Legal"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/privacy",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Privacy Policy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/terms",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Terms of Service"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/cookies",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Cookie Policy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/impressum",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Impressum"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/community-guidelines",
									className: "text-sm text-muted-foreground transition-colors hover:text-foreground rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									children: "Community Guidelines"
								})
							]
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 border-t border-border pt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-center text-sm text-muted-foreground",
					children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" Querino. All rights reserved."
					]
				})
			})]
		})
	});
}
//#endregion
export { TooltipProvider as a, buildMarkdownContent as c, parseMarkdownContent as d, readFileAsText as f, useWorkspace as h, TooltipContent as i, downloadMarkdownFile as l, usePremiumCheck as m, Header as n, TooltipTrigger as o, slugify as p, Tooltip as r, WorkspaceProvider as s, Footer as t, logo_default as u };
