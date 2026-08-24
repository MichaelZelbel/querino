import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Switch } from "./switch-BXNTxolN.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { $t as FileText, At as Info, Bn as ArrowRight, Dt as Key, En as ChevronRight, F as Shield, J as Plus, Ot as KeyRound, Rn as Bell, Sn as CircleCheck, T as Terminal, W as RefreshCw, Wt as Github, Y as Plug, a as Users, b as Trash2, cn as Copy, d as Unplug, et as Pencil, gt as LoaderCircle, it as Palette, jn as Building2, kn as Check, mt as LogOut, nn as ExternalLink, s as User, un as Cookie, v as TriangleAlert, xn as CircleX } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { c as useTeam, n as AvatarFallback, r as AvatarImage, t as Avatar, u as useUpdateTeam } from "./avatar-CLMN7E0g.mjs";
import { t as j } from "../_libs/next-themes.mjs";
import { h as useWorkspace, n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { n as format, r as differenceInDays } from "../_libs/date-fns.mjs";
import { t as Checkbox } from "./checkbox-B00mezr5.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
import { t as Separator } from "./separator-B3hsz7IR.mjs";
import { n as redeemTeamInvite } from "./useTeamInvites-B6EE7bcl.mjs";
import { t as useAICredits } from "./useAICredits-C3u0-Q2o.mjs";
import { n as AlertDescription, t as Alert } from "./alert-DeotHHTZ.mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-XEtfVDuR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CreditsDisplay() {
	const { credits, isLoading } = useAICredits();
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 pt-6 border-t border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm",
				children: "Loading credits..."
			})]
		})
	});
	if (!credits) return null;
	const { remainingCredits, rolloverTokens, periodEnd, planBaseCredits, tokensPerCredit } = credits;
	const rolloverCredits = rolloverTokens / tokensPerCredit;
	const effectivePlanCredits = planBaseCredits ?? 1500;
	const displayTotal = effectivePlanCredits + rolloverCredits;
	const usagePercentage = displayTotal > 0 ? Math.min(remainingCredits / displayTotal * 100, 100) : 0;
	const rolloverPercentage = displayTotal > 0 ? Math.min(rolloverCredits / displayTotal * 100, 100) : 0;
	const resetDate = periodEnd ? format(new Date(periodEnd), "dd MMM 'at' h:mm a") : null;
	const maxRollover = effectivePlanCredits;
	const daysUntilReset = periodEnd ? differenceInDays(new Date(periodEnd), /* @__PURE__ */ new Date()) : null;
	const showRolloverPreview = daysUntilReset !== null && daysUntilReset <= 5 && daysUntilReset >= 0;
	const projectedRollover = Math.min(Math.round(remainingCredits), maxRollover);
	const remainingRatio = displayTotal > 0 ? remainingCredits / displayTotal : 0;
	const isEmpty = remainingCredits <= 0;
	const isLow = !isEmpty && remainingRatio < .1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 pt-6 border-t border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium text-foreground",
					children: "AI Credits remaining"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `text-sm ${isEmpty ? "text-destructive font-medium" : isLow ? "text-warning font-medium" : "text-muted-foreground"}`,
					children: [
						Math.round(remainingCredits).toLocaleString(),
						" of",
						" ",
						Math.round(displayTotal).toLocaleString()
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `relative h-2 w-full overflow-hidden rounded-full ${isEmpty ? "bg-destructive/20" : isLow ? "bg-warning/20" : "bg-primary/20"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `absolute top-0 left-0 h-full transition-all duration-300 ${isEmpty ? "bg-destructive" : isLow ? "bg-warning" : "bg-primary"}`,
					style: { width: `${usagePercentage}%` }
				}), rolloverCredits > 0 && !isLow && !isEmpty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute top-0 h-full bg-primary/50 border-l border-primary-foreground/30",
					style: {
						left: `${Math.max(usagePercentage - rolloverPercentage, 0)}%`,
						width: `${Math.min(rolloverPercentage, usagePercentage)}%`
					}
				})]
			}),
			(isLow || isEmpty) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `mt-3 flex items-start gap-2 text-sm rounded-md px-3 py-2 ${isEmpty ? "text-destructive bg-destructive/10" : "text-warning bg-warning/10"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4 flex-shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isEmpty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					"You've used all your AI credits.",
					" ",
					resetDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"They reset on ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: resetDate }),
						"."
					] }) : "They will reset at the start of your next billing period.",
					" ",
					"Need more sooner?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "mailto:support@querino.ai",
						className: "underline underline-offset-2 hover:no-underline",
						children: "Contact support"
					}),
					"."
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					"Running low —",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: Math.round(remainingCredits).toLocaleString() }),
					" ",
					"credits left",
					resetDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						" ",
						"until reset on ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: resetDate })
					] }) : null,
					"."
				] }) })]
			}),
			showRolloverPreview && projectedRollover > 0 && !isEmpty && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-md px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4 flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: projectedRollover.toLocaleString() }),
					" credits will carry over to next period",
					daysUntilReset === 0 ? " (today)" : daysUntilReset === 1 ? " (tomorrow)" : ` (in ${daysUntilReset} days)`
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Up to ",
						maxRollover.toLocaleString(),
						" credits rollover"
					] })]
				}), resetDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						effectivePlanCredits.toLocaleString(),
						" credits reset on",
						" ",
						resetDate
					] })]
				})]
			})
		]
	});
}
var EXPIRY_OPTIONS = [
	{
		value: "never",
		label: "Never expires"
	},
	{
		value: "30",
		label: "30 days"
	},
	{
		value: "90",
		label: "90 days"
	},
	{
		value: "180",
		label: "180 days"
	},
	{
		value: "365",
		label: "1 year"
	}
];
function generateRawToken() {
	const bytes = /* @__PURE__ */ new Uint8Array(32);
	crypto.getRandomValues(bytes);
	let b64 = btoa(String.fromCharCode(...bytes));
	b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
	return `qrn_mcp_${b64}`;
}
async function sha256Hex(input) {
	const data = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest("SHA-256", data);
	const bytes = new Uint8Array(digest);
	let hex = "";
	for (const b of bytes) hex += b.toString(16).padStart(2, "0");
	return hex;
}
function formatDate(iso) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(void 0, {
		year: "numeric",
		month: "short",
		day: "numeric"
	});
}
function tokenStatus(t) {
	if (t.revoked_at) return {
		label: "Revoked",
		variant: "destructive"
	};
	if (t.expires_at && new Date(t.expires_at) < /* @__PURE__ */ new Date()) return {
		label: "Expired",
		variant: "destructive"
	};
	return {
		label: "Active",
		variant: "default"
	};
}
function McpTokensSection() {
	const { user } = useAuthContext();
	const [tokens, setTokens] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [newName, setNewName] = (0, import_react.useState)("");
	const [newExpiry, setNewExpiry] = (0, import_react.useState)("never");
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [revealedToken, setRevealedToken] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [revokeTarget, setRevokeTarget] = (0, import_react.useState)(null);
	const [revoking, setRevoking] = (0, import_react.useState)(false);
	const load = async () => {
		if (!user) return;
		setLoading(true);
		const { data, error } = await supabase.from("mcp_api_tokens").select("id, name, token_prefix, created_at, last_used_at, expires_at, revoked_at").order("created_at", { ascending: false });
		if (error) {
			toast.error("Failed to load tokens");
			setLoading(false);
			return;
		}
		setTokens(data ?? []);
		setLoading(false);
	};
	(0, import_react.useEffect)(() => {
		load();
	}, [user?.id]);
	const handleCreate = async () => {
		if (!user) return;
		const trimmed = newName.trim();
		if (!trimmed) {
			toast.error("Please enter a name");
			return;
		}
		setCreating(true);
		try {
			const raw = generateRawToken();
			const token_hash = await sha256Hex(raw);
			const token_prefix = raw.slice(0, 16);
			let expires_at = null;
			if (newExpiry !== "never") {
				const days = parseInt(newExpiry, 10);
				const d = /* @__PURE__ */ new Date();
				d.setDate(d.getDate() + days);
				expires_at = d.toISOString();
			}
			const { error } = await supabase.from("mcp_api_tokens").insert({
				user_id: user.id,
				name: trimmed,
				token_hash,
				token_prefix,
				expires_at
			});
			if (error) throw error;
			setRevealedToken(raw);
			setCreateOpen(false);
			setNewName("");
			setNewExpiry("never");
			await load();
		} catch (e) {
			console.error(e);
			toast.error("Failed to create token");
		} finally {
			setCreating(false);
		}
	};
	const handleRevoke = async () => {
		if (!revokeTarget) return;
		setRevoking(true);
		try {
			const { error } = await supabase.from("mcp_api_tokens").update({ revoked_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", revokeTarget.id);
			if (error) throw error;
			toast.success(`Token "${revokeTarget.name}" revoked`);
			setRevokeTarget(null);
			await load();
		} catch (e) {
			console.error(e);
			toast.error("Failed to revoke token");
		} finally {
			setRevoking(false);
		}
	};
	const copyRevealed = async () => {
		if (!revealedToken) return;
		await navigator.clipboard.writeText(revealedToken);
		setCopied(true);
		toast.success("Token copied — store it now, it won't be shown again");
		setTimeout(() => setCopied(false), 2500);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
			className: "pb-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-lg",
						children: "Personal MCP Tokens"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
					className: "mt-1",
					children: "Long-lived tokens for connecting external MCP clients (OpenClaw, Claude Desktop, Cursor, Manus…). They survive browser sessions and don't expire after 1 hour like the Supabase session token."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setCreateOpen(true),
					className: "gap-1.5 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "New token"]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "py-8 flex justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
		}) : tokens.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground py-4",
			children: "No tokens yet. Create one to connect an external MCP client."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children: tokens.map((t) => {
				const status = tokenStatus(t);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 flex-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground truncate",
									children: t.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: status.variant,
									className: "text-xs",
									children: status.label
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", {
								className: "text-xs text-muted-foreground font-mono",
								children: [t.token_prefix, "…"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Created: ", formatDate(t.created_at)] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Last used: ", formatDate(t.last_used_at)] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Expires:",
										" ",
										t.expires_at ? formatDate(t.expires_at) : "Never"
									] })
								]
							})
						]
					}), !t.revoked_at && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => setRevokeTarget(t),
						className: "text-destructive hover:text-destructive shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 mr-1.5" }), "Revoke"]
					})]
				}, t.id);
			})
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: createOpen,
			onOpenChange: setCreateOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create new MCP token" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Give it a recognisable name (usually the client it will be used in). The raw token will be shown only once." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "token-name",
							children: "Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "token-name",
							placeholder: "e.g. Claude Desktop on MacBook",
							value: newName,
							onChange: (e) => setNewName(e.target.value),
							maxLength: 80
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "token-expiry",
							children: "Expiration"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: newExpiry,
							onValueChange: setNewExpiry,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								id: "token-expiry",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: EXPIRY_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: opt.value,
								children: opt.label
							}, opt.value)) })]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setCreateOpen(false),
					disabled: creating,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: handleCreate,
					disabled: creating || !newName.trim(),
					children: [creating && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-1.5 animate-spin" }), "Create token"]
				})] })
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: !!revealedToken,
			onOpenChange: (open) => !open && setRevealedToken(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Copy your new token" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "This is the only time the full token will be shown. Store it somewhere safe now — if you lose it, you'll need to revoke it and create a new one." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
					variant: "destructive",
					className: "border-destructive/30 bg-destructive/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDescription, {
						className: "text-sm",
						children: "Treat this token like a password. Anyone with it has full access to your Querino data."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 mt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono text-foreground break-all",
						children: revealedToken
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: copyRevealed,
						className: "gap-1.5 shrink-0",
						children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), copied ? "Copied" : "Copy"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => setRevealedToken(null),
					children: "I've saved it"
				}) })
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
			open: !!revokeTarget,
			onOpenChange: (open) => !open && setRevokeTarget(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
				"Revoke \"",
				revokeTarget?.name,
				"\"?"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "The token will stop working immediately. Any MCP client using it will need to be reconfigured with a new token." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
				disabled: revoking,
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogAction, {
				onClick: (e) => {
					e.preventDefault();
					handleRevoke();
				},
				disabled: revoking,
				className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				children: [revoking && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-1.5 animate-spin" }), "Revoke token"]
			})] })] })
		})
	] });
}
var MCP_ENDPOINT = "https://mcp.querino.ai";
function buildPromptText() {
	return `Set up Querino as my permanent AI-artifacts MCP server. This has two parts: install the server, and save behavior rules so you use it correctly in every future session. Do both.

**Step 1 — Get my token.** Before anything else, ask me to paste my Querino Personal MCP Token. I'll generate it in Querino → Settings → MCP Server / API Access → "Personal MCP Tokens" → "Create token" (starts with \`qrn_mcp_\`, shown only once) and send it back. Wait for it — don't try to connect without it.

**Step 2 — Install the server.** Register Querino as a **persistent, user-scoped MCP server** using your tool's normal mechanism (a CLI like \`claude mcp add\` / \`gemini mcp add\`, or your MCP config file):

- Transport: HTTP (streamable, JSON-RPC 2.0; SSE responses supported)

- URL: \`https://mcp.querino.ai\` *(exactly this — no \`/mcp\`, \`/sse\`, or \`/v1\` suffix; the root URL is the endpoint)*

- Auth header: \`Authorization: Bearer <the token I gave you>\`

- The token is long-lived (no 1-hour expiry); it stays valid until I revoke it. If you get HTTP 401 (invalid/expired/revoked), stop and ask me for a new one — don't retry the old one.

**Step 3 — Save behavior rules.** Ask my permission, then append the following to your **global / user-level** instructions file (e.g. \`~/.claude/CLAUDE.md\`, \`GEMINI.md\`, \`AGENTS.md\`, or your tool's user-scope rules) so they apply in every future session:

- **Tool-family routing.** A single reusable LLM instruction/template → \`prompt_*\`. Several prompts shipped together as one Markdown document → \`prompt_kit_*\`. A capability/framework for how to do something → \`skill_*\`. A multi-step process/pipeline → \`workflow_*\`. A mixed, user-curated grouping across types → \`collection_*\`. If unsure, ask one short clarifying question instead of guessing.

- **Safe access.** Prefer \`search_*\` when I don't already know the exact id/slug; never fabricate ids. Always call \`get_*\` before any \`update_*\`/\`delete_*\` so the current state is visible.

- **Mutations.** Only create/update/delete when my intent is clear; if ambiguous, confirm first. \`delete_*\` requires explicit confirmation unless I already said "delete"/"remove" this turn. Never bulk-delete speculatively.

- **Confirmation.** After any create/update/delete, end with a one-line confirmation: what changed and the id/slug it now has. Surface the real server error message on failure — don't hide it behind a generic message.

- **Output format.** Never use Markdown tables (they break in narrow chat). List each item as one short bullet: id/slug + title only. Show full details (content, tags, description) only when I explicitly ask.

**Step 4 — Verify.** Confirm the MCP server is connected (list your servers and confirm Querino tools like \`list_prompts\`, \`get_my_profile\` appear), confirm the rules were written to the file, then call \`get_my_profile\` with no arguments to prove auth works end-to-end. Report all three results, with exact status codes/messages on any failure.`;
}
function CopyButton({ text, label }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const handleCopy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		toast.success(label ? `${label} copied` : "Copied to clipboard");
		setTimeout(() => setCopied(false), 2e3);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: "sm",
		onClick: handleCopy,
		className: "gap-1.5 shrink-0",
		children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), copied ? "Copied" : "Copy"]
	});
}
function McpSetupSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-semibold text-foreground mb-1",
				children: "MCP Server"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground text-sm",
				children: "Connect AI agents and MCP-compatible clients like OpenClaw, Manus, Claude Desktop, or Cursor to manage your Querino data via the Model Context Protocol. Authentication uses long-lived personal tokens that you create below."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(McpTokensSection, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
				className: "pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-lg",
						children: "Send this prompt to your agent"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Copy the prompt below and send it to your AI agent or MCP-compatible client (for example: OpenClaw, Manus, Claude Desktop, Cursor). The agent will ask you for your token, install the server permanently, save behavior rules for future sessions, and verify the connection end-to-end." })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "rounded-lg bg-muted p-4 text-xs font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed",
						children: buildPromptText()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute top-2 right-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, {
							text: buildPromptText(),
							label: "Agent prompt"
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 pt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted-foreground shrink-0",
							children: "MCP Endpoint (for manual setup):"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "flex-1 rounded-md bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground truncate",
							children: MCP_ENDPOINT
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, {
							text: MCP_ENDPOINT,
							label: "MCP endpoint"
						})
					]
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
				className: "pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-lg",
						children: "Compatible MCP Clients"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Any client that supports the Model Context Protocol (MCP) over HTTP can connect to Querino. Examples include OpenClaw, Manus, and other MCP-enabled agents or tools that let you add a custom MCP server endpoint and send an Authorization header." })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					"OpenClaw",
					"Manus",
					"Claude Desktop",
					"Cursor",
					"Any MCP Client"
				].map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "secondary",
					className: "text-sm px-3 py-1",
					children: client
				}, client))
			}) })] })
		]
	});
}
var menerio_logo_default = "/assets/menerio-logo-B4oG0hMf.png";
var MENERIO_BASE_URL = "https://tjeapelvjlmbxafsmjef.supabase.co/functions/v1";
var ARTIFACT_TYPES = [
	{
		value: "prompt",
		label: "Prompts"
	},
	{
		value: "skill",
		label: "Skills"
	},
	{
		value: "claw",
		label: "CLAWs (MCP-only)"
	},
	{
		value: "workflow",
		label: "Workflows"
	}
];
function MenerioIntegrationSection() {
	const { user } = useAuthContext();
	const [connectionKey, setConnectionKey] = (0, import_react.useState)("");
	const [connectedDisplayName, setConnectedDisplayName] = (0, import_react.useState)(null);
	const [isConnected, setIsConnected] = (0, import_react.useState)(false);
	const [connecting, setConnecting] = (0, import_react.useState)(false);
	const [disconnecting, setDisconnecting] = (0, import_react.useState)(false);
	const [autoSync, setAutoSync] = (0, import_react.useState)(true);
	const [syncTypes, setSyncTypes] = (0, import_react.useState)([
		"prompt",
		"skill",
		"claw",
		"workflow"
	]);
	const [isActive, setIsActive] = (0, import_react.useState)(true);
	const [lastSyncAt, setLastSyncAt] = (0, import_react.useState)(null);
	const [existingId, setExistingId] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [saving, setSaving] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		(async () => {
			const { data, error } = await supabase.from("menerio_integration").select("*").eq("user_id", user.id).maybeSingle();
			if (!error && data) {
				const d = data;
				setExistingId(d.id);
				setAutoSync(d.auto_sync ?? true);
				setSyncTypes(d.sync_artifact_types || [
					"prompt",
					"skill",
					"claw",
					"workflow"
				]);
				setIsActive(d.is_active ?? true);
				setLastSyncAt(d.last_sync_at || null);
				setIsConnected(true);
				verifyExistingConnection(d.menerio_api_key);
			}
			setLoading(false);
		})();
	}, [user]);
	const verifyExistingConnection = async (apiKey) => {
		try {
			const json = await (await fetch(`${MENERIO_BASE_URL}/verify-connection`, {
				method: "POST",
				headers: { "x-api-key": apiKey }
			})).json();
			if (json.ok) setConnectedDisplayName(json.user_display_name || null);
		} catch {}
	};
	const handleConnect = async () => {
		if (!user || !connectionKey.trim()) {
			toast.error("Please paste your Menerio connection key.");
			return;
		}
		setConnecting(true);
		try {
			const res = await fetch(`${MENERIO_BASE_URL}/verify-connection`, {
				method: "POST",
				headers: { "x-api-key": connectionKey.trim() }
			});
			const json = await res.json();
			if (!res.ok || !json.ok) {
				toast.error(json.error || "Connection failed. Please check your key.");
				return;
			}
			const payload = {
				user_id: user.id,
				menerio_api_key: connectionKey.trim(),
				menerio_base_url: MENERIO_BASE_URL,
				auto_sync: autoSync,
				sync_artifact_types: syncTypes,
				is_active: true
			};
			if (existingId) {
				const { error } = await supabase.from("menerio_integration").update(payload).eq("id", existingId);
				if (error) throw error;
			} else {
				const { data, error } = await supabase.from("menerio_integration").insert(payload).select("id").single();
				if (error) throw error;
				setExistingId(data.id);
			}
			setIsConnected(true);
			setConnectedDisplayName(json.user_display_name || null);
			setConnectionKey("");
			toast.success(json.already_connected ? "Already connected to Menerio!" : "Successfully connected to Menerio!");
		} catch (error) {
			console.error("Menerio connect error:", error);
			toast.error("Failed to save connection. Please try again.");
		} finally {
			setConnecting(false);
		}
	};
	const handleDisconnect = async () => {
		if (!existingId) return;
		setDisconnecting(true);
		try {
			const { error } = await supabase.from("menerio_integration").delete().eq("id", existingId);
			if (error) throw error;
			setIsConnected(false);
			setConnectedDisplayName(null);
			setExistingId(null);
			setConnectionKey("");
			toast.success("Menerio integration disconnected.");
		} catch (error) {
			console.error("Menerio disconnect error:", error);
			toast.error("Failed to disconnect.");
		} finally {
			setDisconnecting(false);
		}
	};
	const handleSaveSettings = async () => {
		if (!existingId) return;
		setSaving(true);
		try {
			const { error } = await supabase.from("menerio_integration").update({
				auto_sync: autoSync,
				sync_artifact_types: syncTypes,
				is_active: isActive
			}).eq("id", existingId);
			if (error) throw error;
			toast.success("Menerio settings saved.");
		} catch (error) {
			console.error("Error saving settings:", error);
			toast.error("Failed to save settings.");
		} finally {
			setSaving(false);
		}
	};
	const toggleSyncType = (type) => {
		setSyncTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
	};
	if (!user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
			className: "font-display flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: menerio_logo_default,
				alt: "Menerio",
				className: "h-5 w-5"
			}), "Menerio"]
		}), isConnected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			variant: "outline",
			className: "border-green-500/40 text-green-600 dark:text-green-400 gap-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5" }),
				"Connected",
				connectedDisplayName ? ` as ${connectedDisplayName}` : ""
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Mirror your Querino artifacts as searchable notes in Menerio." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "space-y-6",
		children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center py-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
		}) : !isConnected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "menerioKey",
						children: "Connection Key"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "menerioKey",
						type: "password",
						placeholder: "Paste your Menerio connection key…",
						value: connectionKey,
						onChange: (e) => setConnectionKey(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Generate a connection key in your Menerio app under Settings → Integrations → Querino."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: handleConnect,
				disabled: connecting || !connectionKey.trim(),
				children: connecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Connecting…"] }) : "Connect"
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "Auto-Sync"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Automatically sync changes to artifacts to Menerio."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					checked: autoSync,
					onCheckedChange: setAutoSync
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "Integration active"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Pause the Menerio connection without disconnecting."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					checked: isActive,
					onCheckedChange: setIsActive
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Artifact types to sync" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: ARTIFACT_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-2 cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
							checked: syncTypes.includes(type.value),
							onCheckedChange: () => toggleSyncType(type.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: type.label
						})]
					}, type.value))
				})]
			}),
			lastSyncAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
				className: "border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDescription, {
					className: "text-sm",
					children: ["Last sync: ", new Date(lastSyncAt).toLocaleString("en-US")]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleSaveSettings,
					disabled: saving,
					children: saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving…"] }) : "Save settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: handleDisconnect,
					disabled: disconnecting,
					className: "text-destructive hover:text-destructive",
					children: disconnecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Disconnecting…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, { className: "mr-2 h-4 w-4" }), "Disconnect"] })
				})]
			})
		] })
	})] });
}
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
var ARTIFACT_LABELS = {
	prompt: "Prompts",
	prompt_kit: "Prompt Kits",
	skill: "Skills",
	workflow: "Workflows"
};
var TABLES = [
	"prompts",
	"prompt_kits",
	"skills",
	"workflows"
];
var TYPES = [
	"prompt",
	"prompt_kit",
	"skill",
	"workflow"
];
function MenerioBulkSync() {
	const { user } = useAuthContext();
	const [stats, setStats] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [syncing, setSyncing] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)({
		current: 0,
		total: 0
	});
	const [resetting, setResetting] = (0, import_react.useState)(false);
	const fetchStats = (0, import_react.useCallback)(async () => {
		if (!user) return;
		const results = {};
		const queries = TABLES.map((table, i) => supabase.from(table).select("id, menerio_synced", { count: "exact" }).eq("author_id", user.id).then(({ data, count }) => {
			const synced = data?.filter((r) => r.menerio_synced).length ?? 0;
			results[TYPES[i]] = {
				total: count ?? 0,
				synced
			};
		}));
		await Promise.all(queries);
		setStats(results);
		setLoading(false);
	}, [user]);
	(0, import_react.useEffect)(() => {
		fetchStats();
	}, [fetchStats]);
	const handleBulkSync = async () => {
		if (!user) return;
		setSyncing(true);
		try {
			const toSync = [];
			for (let i = 0; i < TABLES.length; i++) {
				const { data } = await supabase.from(TABLES[i]).select("id, menerio_synced, updated_at, menerio_synced_at").eq("author_id", user.id);
				if (data) {
					for (const row of data) if (!row.menerio_synced || row.menerio_synced_at && row.updated_at > row.menerio_synced_at) toSync.push({
						type: TYPES[i],
						id: row.id
					});
				}
			}
			if (toSync.length === 0) {
				toast.info("All artifacts are already synced.");
				setSyncing(false);
				return;
			}
			setProgress({
				current: 0,
				total: toSync.length
			});
			const queueEntries = toSync.map((item) => ({
				user_id: user.id,
				artifact_type: item.type,
				artifact_id: item.id,
				status: "pending"
			}));
			const { error: insertError } = await supabase.from("menerio_sync_queue").insert(queueEntries);
			if (insertError) throw insertError;
			let completed = 0;
			const maxPolls = 120;
			let polls = 0;
			while (completed < toSync.length && polls < maxPolls) {
				await new Promise((r) => setTimeout(r, 5e3));
				polls++;
				const { data: queueData } = await supabase.from("menerio_sync_queue").select("status").eq("user_id", user.id).in("artifact_id", toSync.map((t) => t.id));
				if (queueData) {
					const done = queueData.filter((q) => q.status === "completed" || q.status === "failed").length;
					const outstanding = queueData.filter((q) => q.status !== "completed" && q.status !== "failed").length;
					completed = Math.max(done, toSync.length - outstanding);
					setProgress({
						current: completed,
						total: toSync.length
					});
				}
				if (queueData && queueData.every((q) => q.status === "completed" || q.status === "failed")) break;
			}
			await fetchStats();
			toast.success(`Sync complete. ${completed} artifacts synchronized.`);
		} catch (error) {
			console.error("Bulk sync error:", error);
			toast.error("Bulk sync failed");
		} finally {
			setSyncing(false);
			setProgress({
				current: 0,
				total: 0
			});
		}
	};
	const handleResetAll = async () => {
		if (!user) return;
		setResetting(true);
		try {
			const resetPayload = {
				menerio_synced: false,
				menerio_note_id: null,
				menerio_synced_at: null
			};
			await Promise.all(TABLES.map((table) => supabase.from(table).update(resetPayload).eq("author_id", user.id)));
			await fetchStats();
			toast.success("All Menerio links have been removed.");
		} catch (error) {
			console.error("Reset error:", error);
			toast.error("Failed to reset");
		} finally {
			setResetting(false);
		}
	};
	if (!user) return null;
	const totalArtifacts = stats ? Object.values(stats).reduce((s, v) => s + v.total, 0) : 0;
	const totalSynced = stats ? Object.values(stats).reduce((s, v) => s + v.synced, 0) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
		className: "font-display flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-5 w-5" }), "Sync all artifacts"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Sync all your artifacts at once with Menerio. Already synced artifacts will be updated." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "space-y-6",
		children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center py-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" })
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-secondary/30 p-3 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: ARTIFACT_LABELS[type]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-lg font-bold text-foreground",
							children: [stats[type].synced, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground font-normal text-sm",
								children: [
									" ",
									"/ ",
									stats[type].total
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "synced"
						})
					]
				}, type))
			}),
			syncing && progress.total > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
					value: progress.current / progress.total * 100,
					className: "h-2"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground text-center",
					children: [
						"Syncing ",
						progress.current,
						" of ",
						progress.total,
						"…"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 flex-wrap items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleBulkSync,
					disabled: syncing || resetting,
					children: syncing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Syncing…"] }) : totalArtifacts === totalSynced && totalArtifacts > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-2 h-4 w-4 text-green-500" }), "All synced"] }) : "Sync all"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						disabled: syncing || resetting || totalSynced === 0,
						className: "text-destructive hover:text-destructive",
						children: [resetting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), "Remove all syncs"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Remove all Menerio links?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "The notes in Menerio will remain, but they will no longer be automatically updated. You can re-sync at any time." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: handleResetAll,
					children: "Yes, remove all"
				})] })] })] })]
			})
		] })
	})] });
}
/** Accepts a full invite URL or a bare token. */
function extractToken(input) {
	const trimmed = input.trim();
	try {
		return new URL(trimmed).searchParams.get("token") || trimmed;
	} catch {
		return trimmed;
	}
}
function JoinTeamModal({ open, onOpenChange }) {
	const [inviteInput, setInviteInput] = (0, import_react.useState)("");
	const [isJoining, setIsJoining] = (0, import_react.useState)(false);
	const [joinedTeam, setJoinedTeam] = (0, import_react.useState)(null);
	const { user } = useAuthContext();
	const { switchWorkspace } = useWorkspace();
	const navigate = useNavigate$1();
	const queryClient = useQueryClient();
	const handleJoin = async () => {
		if (!user || !inviteInput.trim()) return;
		setIsJoining(true);
		try {
			const result = await redeemTeamInvite(extractToken(inviteInput));
			await queryClient.invalidateQueries({ queryKey: ["user-teams"] });
			setJoinedTeam({
				teamId: result.team_id,
				teamName: result.team_name
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to join team";
			toast.error(message.includes("expired") ? "This invite has expired. Ask a team admin for a new one." : message.includes("not found") ? "This invite is invalid or has been revoked." : message);
		} finally {
			setIsJoining(false);
		}
	};
	const handleOpenTeam = () => {
		if (joinedTeam) {
			switchWorkspace(joinedTeam.teamId);
			navigate("/library");
			onOpenChange(false);
			resetState();
		}
	};
	const resetState = () => {
		setInviteInput("");
		setJoinedTeam(null);
	};
	const handleClose = (isOpen) => {
		if (!isOpen) resetState();
		onOpenChange(isOpen);
	};
	if (joinedTeam) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: handleClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5 text-primary" }), "Joined successfully!"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
				"You're now a member of ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: joinedTeam.teamName }),
				"."
			] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
				className: "flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => handleClose(false),
					children: "Close"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: handleOpenTeam,
					className: "gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" }), "Open team workspace"]
				})]
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: handleClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Join a team" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Paste the invite link (or token) a team admin shared with you." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "invite-link",
							children: "Invite link"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "invite-link",
							placeholder: "https://querino.ai/team/join?token=…",
							value: inviteInput,
							onChange: (e) => setInviteInput(e.target.value),
							disabled: isJoining
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Team owners and admins can create invite links in Team Settings."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => handleClose(false),
					disabled: isJoining,
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleJoin,
					disabled: isJoining || !inviteInput.trim(),
					children: isJoining ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Joining..."] }) : "Join team"
				})] })
			]
		})
	});
}
var hero_settings_default = "/assets/hero-settings-BCanbX4O.png";
var SECTIONS = [
	{
		id: "profile",
		label: "Profile",
		icon: User
	},
	{
		id: "notifications",
		label: "Notifications",
		icon: Bell
	},
	{
		id: "appearance",
		label: "Appearance",
		icon: Palette
	},
	{
		id: "teams",
		label: "Teams",
		icon: Users
	},
	{
		id: "integrations",
		label: "Integrations",
		icon: Plug
	},
	{
		id: "privacy",
		label: "Privacy & Security",
		icon: Shield
	}
];
function Settings$1() {
	const navigate = useNavigate$1();
	const { resolvedTheme, setTheme } = j();
	const [themeMounted, setThemeMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setThemeMounted(true), []);
	const { user, profile, loading: authLoading, signOut } = useAuthContext();
	const { currentWorkspace, currentTeam, isTeamWorkspace } = useWorkspace();
	const { data: teamData } = useTeam(isTeamWorkspace ? currentWorkspace : void 0);
	useUpdateTeam();
	const [activeSection, setActiveSection] = (0, import_react.useState)("profile");
	const [showJoinTeamModal, setShowJoinTeamModal] = (0, import_react.useState)(false);
	const [personalGithubRepo, setPersonalGithubRepo] = (0, import_react.useState)("");
	const [personalGithubBranch, setPersonalGithubBranch] = (0, import_react.useState)("main");
	const [personalGithubFolder, setPersonalGithubFolder] = (0, import_react.useState)("");
	const [personalGithubSyncEnabled, setPersonalGithubSyncEnabled] = (0, import_react.useState)(false);
	const [personalGithubToken, setPersonalGithubToken] = (0, import_react.useState)("");
	const [personalGithubLastSynced, setPersonalGithubLastSynced] = (0, import_react.useState)(null);
	const [savingPersonalGithub, setSavingPersonalGithub] = (0, import_react.useState)(false);
	const [loadingPersonalGithub, setLoadingPersonalGithub] = (0, import_react.useState)(true);
	const [testingConnection, setTestingConnection] = (0, import_react.useState)(false);
	const [connectionStatus, setConnectionStatus] = (0, import_react.useState)("idle");
	const [teamGithubRepo, setTeamGithubRepo] = (0, import_react.useState)("");
	const [teamGithubBranch, setTeamGithubBranch] = (0, import_react.useState)("main");
	const [teamGithubFolder, setTeamGithubFolder] = (0, import_react.useState)("");
	const [teamGithubToken, setTeamGithubToken] = (0, import_react.useState)("");
	const [teamGithubLastSynced, setTeamGithubLastSynced] = (0, import_react.useState)(null);
	const [savingTeamGithub, setSavingTeamGithub] = (0, import_react.useState)(false);
	const [testingTeamConnection, setTestingTeamConnection] = (0, import_react.useState)(false);
	const [teamConnectionStatus, setTeamConnectionStatus] = (0, import_react.useState)("idle");
	const [deleteDialogOpen, setDeleteDialogOpen] = (0, import_react.useState)(false);
	const [deleteConfirmation, setDeleteConfirmation] = (0, import_react.useState)("");
	const [deletingAccount, setDeletingAccount] = (0, import_react.useState)(false);
	const [sendingReset, setSendingReset] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate("/auth?redirect=/settings", { replace: true });
	}, [
		user,
		authLoading,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		async function loadGithubSettings() {
			if (!user) return;
			const { data: profileData, error: profileError } = await supabase.from("profiles").select("github_repo, github_branch, github_folder, github_sync_enabled, github_last_synced_at").eq("id", user.id).single();
			const { data: credentialData } = await supabase.from("user_credentials").select("id").eq("user_id", user.id).eq("credential_type", "github_token").is("team_id", null).maybeSingle();
			if (profileError) console.error("Error loading GitHub settings:", profileError);
			else if (profileData) {
				setPersonalGithubRepo(profileData.github_repo || "");
				setPersonalGithubBranch(profileData.github_branch || "main");
				setPersonalGithubFolder(profileData.github_folder || "");
				setPersonalGithubSyncEnabled(profileData.github_sync_enabled || false);
				setPersonalGithubLastSynced(profileData.github_last_synced_at || null);
			}
			setPersonalGithubToken(credentialData?.id ? "••••••••••••••••" : "");
			setLoadingPersonalGithub(false);
		}
		if (user) loadGithubSettings();
	}, [user]);
	(0, import_react.useEffect)(() => {
		if (teamData) {
			setTeamGithubRepo(teamData.github_repo || "");
			setTeamGithubBranch(teamData.github_branch || "main");
			setTeamGithubFolder(teamData.github_folder || "");
			const loadTeamToken = async () => {
				const { data: teamMeta } = await supabase.from("teams").select("github_last_synced_at").eq("id", teamData.id).single();
				const { data: credentialData } = await supabase.from("user_credentials").select("id").eq("credential_type", "github_token").eq("team_id", teamData.id).maybeSingle();
				setTeamGithubToken(credentialData?.id ? "••••••••••••••••" : "");
				setTeamGithubLastSynced(teamMeta?.github_last_synced_at || null);
			};
			loadTeamToken();
		}
	}, [teamData]);
	(0, import_react.useEffect)(() => {
		const observer = new IntersectionObserver((entries) => {
			const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
			if (visible[0]) setActiveSection(visible[0].target.id);
		}, {
			rootMargin: "-30% 0px -55% 0px",
			threshold: [
				0,
				.25,
				.5,
				.75,
				1
			]
		});
		SECTIONS.forEach((s) => {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, [user]);
	const handleSavePersonalGithubSettings = async () => {
		if (!user) return;
		if (personalGithubRepo && !personalGithubRepo.includes("/")) {
			toast.error("Repository must be in format owner/repo");
			return;
		}
		setSavingPersonalGithub(true);
		const cleanFolder = personalGithubFolder.replace(/^\/+|\/+$/g, "");
		try {
			const { error: profileError } = await supabase.from("profiles").update({
				github_repo: personalGithubRepo || null,
				github_branch: personalGithubBranch || "main",
				github_folder: cleanFolder || null,
				github_sync_enabled: personalGithubSyncEnabled
			}).eq("id", user.id);
			if (profileError) throw profileError;
			if (personalGithubToken && !personalGithubToken.includes("•")) {
				const { error: tokenError } = await supabase.from("user_credentials").upsert({
					user_id: user.id,
					credential_type: "github_token",
					credential_value: personalGithubToken,
					team_id: null
				}, { onConflict: "user_id,credential_type,team_id" });
				if (tokenError) throw tokenError;
			}
			toast.success("Personal GitHub sync settings saved");
			setConnectionStatus("idle");
		} catch (error) {
			console.error("Error saving GitHub settings:", error);
			toast.error("Failed to save GitHub settings");
		} finally {
			setSavingPersonalGithub(false);
		}
	};
	const handleTestConnection = async (isTeam) => {
		if (isTeam) {
			setTestingTeamConnection(true);
			setTeamConnectionStatus("idle");
		} else {
			setTestingConnection(true);
			setConnectionStatus("idle");
		}
		try {
			const { data, error } = await supabase.functions.invoke("github-sync", { body: {
				testConnection: true,
				teamId: isTeam ? currentTeam?.id : void 0
			} });
			if (error) throw error;
			if (data?.success) {
				if (isTeam) setTeamConnectionStatus("success");
				else setConnectionStatus("success");
				toast.success("GitHub connection successful!");
			} else throw new Error(data?.error || "Connection failed");
		} catch (error) {
			console.error("Connection test failed:", error);
			if (isTeam) setTeamConnectionStatus("error");
			else setConnectionStatus("error");
			toast.error(error instanceof Error ? error.message : "Failed to connect to GitHub");
		} finally {
			if (isTeam) setTestingTeamConnection(false);
			else setTestingConnection(false);
		}
	};
	const handleSaveTeamGithubSettings = async () => {
		if (!currentTeam || !user) return;
		if (teamGithubRepo && !teamGithubRepo.includes("/")) {
			toast.error("Repository must be in format owner/repo");
			return;
		}
		setSavingTeamGithub(true);
		const cleanFolder = teamGithubFolder.replace(/^\/+|\/+$/g, "");
		try {
			const { error: teamError } = await supabase.from("teams").update({
				github_repo: teamGithubRepo || null,
				github_branch: teamGithubBranch || "main",
				github_folder: cleanFolder || null
			}).eq("id", currentTeam.id);
			if (teamError) throw teamError;
			if (teamGithubToken && !teamGithubToken.includes("•")) {
				const { error: tokenError } = await supabase.from("user_credentials").upsert({
					user_id: user.id,
					credential_type: "github_token",
					credential_value: teamGithubToken,
					team_id: currentTeam.id
				}, { onConflict: "user_id,credential_type,team_id" });
				if (tokenError) throw tokenError;
			}
			toast.success("Team GitHub sync settings saved");
			setTeamConnectionStatus("idle");
		} catch (error) {
			console.error("Error saving team GitHub settings:", error);
			toast.error("Failed to save team GitHub settings");
		} finally {
			setSavingTeamGithub(false);
		}
	};
	const handleSendPasswordReset = async () => {
		if (!user?.email) {
			toast.error("No email on file for this account.");
			return;
		}
		setSendingReset(true);
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/auth` });
			if (error) throw error;
			toast.success(`Password reset link sent to ${user.email}`);
		} catch (error) {
			console.error("Password reset error:", error);
			toast.error(error instanceof Error ? error.message : "Failed to send reset email");
		} finally {
			setSendingReset(false);
		}
	};
	const handleSignOut = async () => {
		const { error } = await signOut();
		if (error) {
			toast.error("Failed to sign out");
			return;
		}
		navigate("/", { replace: true });
	};
	const handleDeleteAccount = async () => {
		if (deleteConfirmation !== "DELETE") {
			toast.error("Please type DELETE to confirm");
			return;
		}
		setDeletingAccount(true);
		try {
			const { data, error } = await supabase.functions.invoke("delete-my-account", { body: { confirmation: "DELETE" } });
			if (error) throw error;
			if (data?.success) {
				toast.success("Account deleted successfully. Redirecting...");
				await supabase.auth.signOut();
				navigate("/", { replace: true });
			} else throw new Error(data?.error || "Failed to delete account");
		} catch (error) {
			console.error("Error deleting account:", error);
			toast.error(error instanceof Error ? error.message : "Failed to delete account");
		} finally {
			setDeletingAccount(false);
			setDeleteDialogOpen(false);
			setDeleteConfirmation("");
		}
	};
	const initials = (0, import_react.useMemo)(() => {
		return (profile?.display_name || user?.email || "?").split(/[\s@.]/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
	}, [profile?.display_name, user?.email]);
	if (authLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user) return null;
	const showTeamGithub = isTeamWorkspace && currentTeam;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "container mx-auto px-4 py-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-8 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-display-lg text-foreground mb-2",
							children: "Settings"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground text-lg",
							children: "Manage your account preferences and settings."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: hero_settings_default,
							alt: "Settings",
							className: "hidden md:block w-48 h-24 object-cover rounded-lg opacity-80"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, {
						className: `mb-8 ${isTeamWorkspace ? "border-primary/30 bg-primary/5" : "border-border"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								isTeamWorkspace ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-5 w-5 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDescription, {
									className: "flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: isTeamWorkspace ? `Team: ${currentTeam?.name}` : "Personal Workspace"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground ml-2",
										children: [
											"—",
											" ",
											isTeamWorkspace ? "GitHub sync settings below apply to this team's artefacts." : "GitHub sync settings below apply to your personal artefacts."
										]
									})]
								}),
								isTeamWorkspace && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "bg-primary/10 text-primary border-0",
									children: currentTeam?.role
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-8 lg:grid-cols-[240px_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "space-y-2 lg:sticky lg:top-24 lg:self-start",
							children: [
								SECTIONS.map((s) => {
									const Icon = s.icon;
									const isActive = activeSection === s.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: isActive ? "secondary" : "ghost",
										className: cn("w-full justify-start gap-3", isActive && "font-medium"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: `#${s.id}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }), s.label]
										})
									}, s.id);
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "ghost",
									onClick: handleSignOut,
									className: "w-full justify-start gap-3 text-destructive hover:text-destructive",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "Sign Out"]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									id: "profile",
									className: "scroll-mt-24",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
											className: "font-display flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5" }), "Profile"]
										}), profile?.display_name && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5 text-green-600 dark:text-green-400" }), profile.display_name]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Your public identity on Querino. Edit your display name, avatar, bio and links." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
													className: "h-16 w-16",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
														src: profile?.avatar_url || void 0,
														alt: profile?.display_name || "Avatar"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, { children: initials })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 flex-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium truncate",
															children: profile?.display_name || "Unnamed user"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-muted-foreground truncate",
															children: user.email
														}),
														profile?.bio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-muted-foreground mt-1 line-clamp-2",
															children: profile.bio
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												onClick: () => navigate("/profile/edit"),
												className: "gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" }), "Edit profile"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium mb-2",
												children: "AI credits"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditsDisplay, {})] })
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									id: "notifications",
									className: "scroll-mt-24",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
											className: "font-display flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5" }), "Notifications"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-muted-foreground",
											children: "Coming soon"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Choose what notifications you want to receive." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "space-y-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-medium",
													children: "Email Notifications"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Receive updates about new prompts and features."
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													defaultChecked: true,
													disabled: true
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-medium",
													children: "Weekly Digest"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Get a weekly summary of trending prompts."
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
													defaultChecked: true,
													disabled: true
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-medium",
													children: "Community Updates"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Notifications about comments and interactions."
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, { disabled: true })]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									id: "appearance",
									className: "scroll-mt-24",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
										className: "font-display flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { className: "h-5 w-5" }), "Appearance"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Customize how Querino looks for you." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
										className: "space-y-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium",
												children: "Dark Mode"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: "Use dark theme for reduced eye strain."
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: themeMounted && resolvedTheme === "dark",
												onCheckedChange: (checked) => setTheme(checked ? "dark" : "light"),
												"aria-label": "Toggle dark mode"
											})]
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									id: "teams",
									className: "scroll-mt-24",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
										className: "font-display flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5" }), "Teams"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Join team workspaces to collaborate with others." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
										className: "space-y-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium",
												children: "Join a team"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: "Paste an invite link shared with you to join their workspace."
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												onClick: () => setShowJoinTeamModal(true),
												children: "Join team"
											})]
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									id: "integrations",
									className: "scroll-mt-24 space-y-8",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
											className: showTeamGithub ? "border-primary/30" : "",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
												className: "font-display flex items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-5 w-5" }),
													"GitHub Sync",
													showTeamGithub && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														variant: "secondary",
														className: "h-5 px-1.5 text-[10px] gap-0.5 bg-primary/10 text-primary border-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-2.5 w-2.5" }), "Team"]
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: showTeamGithub ? `Sync ${currentTeam?.name}'s artefacts to a shared GitHub repository.` : "Sync your personal prompts, skills and workflows to a GitHub repository." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
												className: "space-y-6",
												children: showTeamGithub ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-start gap-2 p-3 rounded-lg bg-muted/50",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-4 w-4 text-muted-foreground mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm text-muted-foreground",
															children: [
																"These settings apply to all artefacts in the",
																" ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: currentTeam?.name }),
																" workspace. Team members with editor+ access can sync to this repository."
															]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
																htmlFor: "teamGithubToken",
																className: "flex items-center gap-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "h-4 w-4" }), "Personal Access Token"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "teamGithubToken",
																type: "password",
																placeholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
																value: teamGithubToken,
																onChange: (e) => {
																	setTeamGithubToken(e.target.value);
																	setTeamConnectionStatus("idle");
																}
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-xs text-muted-foreground",
																children: [
																	"Create a token at",
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://github.com/settings/tokens/new?scopes=repo&description=Querino%20Sync",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "GitHub Settings"
																	}),
																	" ",
																	"with",
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
																		className: "bg-muted px-1 rounded",
																		children: "repo"
																	}),
																	" ",
																	"scope."
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "teamGithubRepo",
															children: "Repository (owner/name)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "teamGithubRepo",
															placeholder: "organization/team-repo",
															value: teamGithubRepo,
															onChange: (e) => setTeamGithubRepo(e.target.value)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid gap-4 sm:grid-cols-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "teamGithubBranch",
																children: "Branch"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "teamGithubBranch",
																placeholder: "main",
																value: teamGithubBranch,
																onChange: (e) => setTeamGithubBranch(e.target.value)
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "teamGithubFolder",
																children: "Folder path"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "teamGithubFolder",
																placeholder: "prompts",
																value: teamGithubFolder,
																onChange: (e) => setTeamGithubFolder(e.target.value)
															})]
														})]
													}),
													teamGithubLastSynced && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm text-muted-foreground flex items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-green-500" }),
															"Last synced:",
															" ",
															new Date(teamGithubLastSynced).toLocaleString()
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															onClick: handleSaveTeamGithubSettings,
															disabled: savingTeamGithub,
															children: savingTeamGithub ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] }) : "Save Team GitHub Settings"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															onClick: () => handleTestConnection(true),
															disabled: testingTeamConnection || !teamGithubRepo || !teamGithubToken,
															children: testingTeamConnection ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Testing..."] }) : teamConnectionStatus === "success" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-2 h-4 w-4 text-green-500" }), "Connected"] }) : teamConnectionStatus === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "mr-2 h-4 w-4 text-destructive" }), "Failed"] }) : "Test Connection"
														})]
													})
												] }) : loadingPersonalGithub ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex items-center justify-center py-4",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
																htmlFor: "personalGithubToken",
																className: "flex items-center gap-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "h-4 w-4" }), "Personal Access Token"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "personalGithubToken",
																type: "password",
																placeholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
																value: personalGithubToken,
																onChange: (e) => {
																	setPersonalGithubToken(e.target.value);
																	setConnectionStatus("idle");
																}
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-xs text-muted-foreground",
																children: [
																	"Create a token at",
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																		href: "https://github.com/settings/tokens/new?scopes=repo&description=Querino%20Sync",
																		target: "_blank",
																		rel: "noopener noreferrer",
																		className: "text-primary hover:underline",
																		children: "GitHub Settings"
																	}),
																	" ",
																	"with",
																	" ",
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
																		className: "bg-muted px-1 rounded",
																		children: "repo"
																	}),
																	" ",
																	"scope."
																]
															})
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "personalGithubRepo",
															children: "Repository (owner/name)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "personalGithubRepo",
															placeholder: "yourname/your-repo",
															value: personalGithubRepo,
															onChange: (e) => setPersonalGithubRepo(e.target.value)
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid gap-4 sm:grid-cols-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "personalGithubBranch",
																children: "Branch"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "personalGithubBranch",
																placeholder: "main",
																value: personalGithubBranch,
																onChange: (e) => setPersonalGithubBranch(e.target.value)
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																htmlFor: "personalGithubFolder",
																children: "Folder path"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "personalGithubFolder",
																placeholder: "querino-prompts",
																value: personalGithubFolder,
																onChange: (e) => setPersonalGithubFolder(e.target.value)
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Enable GitHub Sync"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-muted-foreground",
															children: "Allow syncing your prompts, skills, and workflows to GitHub."
														})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
															checked: personalGithubSyncEnabled,
															onCheckedChange: setPersonalGithubSyncEnabled
														})]
													}),
													personalGithubLastSynced && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm text-muted-foreground flex items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-green-500" }),
															"Last synced:",
															" ",
															new Date(personalGithubLastSynced).toLocaleString()
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															onClick: handleSavePersonalGithubSettings,
															disabled: savingPersonalGithub,
															children: savingPersonalGithub ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] }) : "Save GitHub Settings"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "outline",
															onClick: () => handleTestConnection(false),
															disabled: testingConnection || !personalGithubRepo || !personalGithubToken,
															children: testingConnection ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Testing..."] }) : connectionStatus === "success" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mr-2 h-4 w-4 text-green-500" }), "Connected"] }) : connectionStatus === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "mr-2 h-4 w-4 text-destructive" }), "Failed"] }) : "Test Connection"
														})]
													})
												] })
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioIntegrationSection, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenerioBulkSync, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											id: "mcp",
											className: "scroll-mt-24",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(McpSetupSection, {})
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									id: "privacy",
									className: "scroll-mt-24 space-y-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
										className: "font-display flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-5 w-5" }), "Privacy & Security"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Manage your password, cookie preferences, and data privacy." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-4 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start gap-3 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-5 w-5 text-muted-foreground mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Change password"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm text-muted-foreground",
															children: [
																"We'll email a secure reset link to ",
																user.email,
																"."
															]
														})]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													size: "sm",
													onClick: handleSendPasswordReset,
													disabled: sendingReset,
													children: sendingReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Sending…"] }) : "Send reset link"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-4 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start gap-3 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cookie, { className: "h-5 w-5 text-muted-foreground mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Cookie preferences"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-muted-foreground",
															children: "Review what we store and adjust your consent."
														})]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													asChild: true,
													variant: "outline",
													size: "sm",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
														to: "/cookies",
														children: ["Manage ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-1 h-4 w-4" })]
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-4 py-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start gap-3 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-5 w-5 text-muted-foreground mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-medium",
															children: "Privacy policy"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-sm text-muted-foreground",
															children: "Read how we collect, store, and process your data."
														})]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													asChild: true,
													variant: "outline",
													size: "sm",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
														to: "/privacy",
														children: ["Open ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-1 h-4 w-4" })]
													})
												})]
											})
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: "border-destructive/30",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
											className: "flex items-center gap-2 text-destructive",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-5 w-5" }), "Delete Account"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Permanently delete your account and all associated data. This action cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
											variant: "destructive",
											className: "mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDescription, { children: ["Deleting your account will permanently remove:", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
												className: "list-disc ml-4 mt-2 space-y-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Your profile and personal information" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All prompts, skills, and workflows you created" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Your collections and saved items" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Reviews and comments you've made" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Team memberships and owned teams" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Usage history and AI credits" })
												]
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
											open: deleteDialogOpen,
											onOpenChange: setDeleteDialogOpen,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													variant: "destructive",
													className: "gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), "Delete My Account"]
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
													className: "flex items-center gap-2 text-destructive",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-5 w-5" }), "Confirm Account Deletion"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
													asChild: true,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This action is permanent and cannot be undone. Deleting your account will remove:" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
																className: "list-disc pl-5 text-sm text-muted-foreground space-y-1",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Your profile, avatar and public creator page" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All your prompts, skills, workflows and prompt kits — including every saved version" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All collections, pins and saved artifacts" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All comments, reviews, ratings and edit suggestions you authored" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Team memberships; teams you own will be transferred or deleted" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "MCP tokens, GitHub sync configuration and Menerio integration" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "AI credit balance and usage history" })
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-sm",
																children: "This satisfies your GDPR Right to Erasure (Art. 17)."
															})
														]
													})
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-4 py-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm text-muted-foreground",
														children: [
															"To confirm deletion, type",
															" ",
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
																className: "text-foreground",
																children: "DELETE"
															}),
															" in the field below:"
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: deleteConfirmation,
														onChange: (e) => setDeleteConfirmation(e.target.value),
														placeholder: "Type DELETE to confirm",
														className: "font-mono"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													onClick: () => {
														setDeleteDialogOpen(false);
														setDeleteConfirmation("");
													},
													disabled: deletingAccount,
													children: "Cancel"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "destructive",
													onClick: handleDeleteAccount,
													disabled: deleteConfirmation !== "DELETE" || deletingAccount,
													children: deletingAccount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Deleting..."] }) : "Permanently Delete Account"
												})] })
											] })]
										})] })]
									})]
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JoinTeamModal, {
				open: showJoinTeamModal,
				onOpenChange: setShowJoinTeamModal
			})
		]
	});
}
var SplitComponent = Settings$1;
//#endregion
export { SplitComponent as component };
