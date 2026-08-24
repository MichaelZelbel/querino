import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DReQYbEM.mjs";
import { B as Search, Cn as CircleCheckBig, F as Shield, H as RotateCcw, I as ShieldAlert, J as Plus, Nn as Bot, P as Sparkles, V as Save, W as RefreshCw, a as Users, an as Database, b as Trash2, gt as LoaderCircle, pn as Coins, sn as Cpu, zn as Ban } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { t as useUserRole } from "./useUserRole-B1YhonQE.mjs";
import { a as TooltipProvider, i as TooltipContent, n as Header, o as TooltipTrigger, r as Tooltip, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { n as format } from "../_libs/date-fns.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-B4ZFfXyf.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-BYNKDsa3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SETTING_KEYS = [
	"tokens_per_credit",
	"credits_free_per_month",
	"credits_premium_per_month",
	"max_free_accounts"
];
var SETTING_LABELS = {
	tokens_per_credit: "Tokens per AI Credit",
	credits_free_per_month: "Free Plan – AI Credits per Month",
	credits_premium_per_month: "Premium Plan – AI Credits per Month",
	max_free_accounts: "Max Free Accounts (Signup Cap)"
};
var SETTING_MIN_VALUES = {
	tokens_per_credit: 1,
	credits_free_per_month: 0,
	credits_premium_per_month: 0,
	max_free_accounts: 1
};
function AICreditSettings() {
	const [settings, setSettings] = (0, import_react.useState)({});
	const [editedValues, setEditedValues] = (0, import_react.useState)({});
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [savingKey, setSavingKey] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchSettings();
	}, []);
	const fetchSettings = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase.from("ai_credit_settings").select("key, value_int, description").in("key", SETTING_KEYS);
			if (error) throw error;
			const settingsMap = {};
			data?.forEach((setting) => {
				settingsMap[setting.key] = setting;
			});
			setSettings(settingsMap);
		} catch (error) {
			console.error("Error fetching AI credit settings:", error);
			toast.error("Failed to load AI credit settings");
		} finally {
			setLoading(false);
		}
	};
	const handleValueChange = (key, value) => {
		const numValue = parseInt(value, 10);
		if (!isNaN(numValue)) setEditedValues((prev) => ({
			...prev,
			[key]: numValue
		}));
		else if (value === "") setEditedValues((prev) => ({
			...prev,
			[key]: 0
		}));
	};
	const getCurrentValue = (key) => {
		if (editedValues[key] !== void 0) return editedValues[key];
		return settings[key]?.value_int ?? 0;
	};
	const hasChanges = (key) => {
		return editedValues[key] !== void 0 && editedValues[key] !== settings[key]?.value_int;
	};
	const isValid = (key) => {
		return getCurrentValue(key) >= (SETTING_MIN_VALUES[key] ?? 0);
	};
	const handleSave = async (key) => {
		const value = editedValues[key];
		if (value === void 0) return;
		const minValue = SETTING_MIN_VALUES[key] ?? 0;
		if (value < minValue) {
			toast.error(`Value must be at least ${minValue}`);
			return;
		}
		setSavingKey(key);
		try {
			const { error } = await supabase.from("ai_credit_settings").update({ value_int: value }).eq("key", key);
			if (error) throw error;
			setSettings((prev) => ({
				...prev,
				[key]: {
					...prev[key],
					value_int: value
				}
			}));
			setEditedValues((prev) => {
				const { [key]: _, ...rest } = prev;
				return rest;
			});
			toast.success(`${SETTING_LABELS[key]} updated successfully`);
		} catch (error) {
			console.error("Error updating AI credit setting:", error);
			toast.error("Failed to update setting");
		} finally {
			setSavingKey(null);
		}
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "AI Credit Settings" })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Loading settings..." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "space-y-4",
		children: [...Array(3)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-full" }, i))
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "AI Credit Settings" })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Configure AI credit allocation and conversion rates" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "space-y-6",
		children: SETTING_KEYS.map((key) => {
			const setting = settings[key];
			const currentValue = getCurrentValue(key);
			const changed = hasChanges(key);
			const valid = isValid(key);
			const minValue = SETTING_MIN_VALUES[key] ?? 0;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-end gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: key,
								children: SETTING_LABELS[key]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: key,
								type: "number",
								min: minValue,
								value: currentValue,
								onChange: (e) => handleValueChange(key, e.target.value),
								className: !valid ? "border-destructive" : ""
							}),
							setting?.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: setting.description
							}),
							!valid && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-destructive",
								children: ["Value must be at least ", minValue]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => handleSave(key),
						disabled: !changed || !valid || savingKey === key,
						size: "sm",
						className: "gap-1.5",
						children: [savingKey === key ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-3.5 w-3.5" }), savingKey === key ? "Saving..." : "Save"]
					})]
				})
			}, key);
		})
	})] });
}
function useProfileNames(userIds) {
	const [names, setNames] = (0, import_react.useState)({});
	const uniqueIds = (0, import_react.useMemo)(() => [...new Set(userIds.filter(Boolean))], [JSON.stringify(userIds)]);
	(0, import_react.useEffect)(() => {
		if (uniqueIds.length === 0) return;
		const fetchNames = async () => {
			const { data } = await supabase.from("profiles").select("id, display_name").in("id", uniqueIds);
			if (data) {
				const map = {};
				for (const p of data) map[p.id] = p.display_name || "";
				setNames(map);
			}
		};
		fetchNames();
	}, [uniqueIds]);
	return names;
}
function UserCell({ userId, displayName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs max-w-[160px]",
			children: displayName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate block",
				children: displayName
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono truncate block",
				children: [userId.slice(0, 8), "…"]
			})
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "font-mono text-xs",
		children: userId
	}), displayName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs",
		children: displayName
	})] })] }) });
}
function ModerationPanel() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Content Moderation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Manage stopwords, review moderation logs, AI review queue, and handle user suspensions" })] })]
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
		defaultValue: "stopwords",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
				className: "mb-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "stopwords",
						children: "Stopwords"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "log",
						children: "Moderation Log"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "ai-queue",
						children: "AI Review Queue"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "suspensions",
						children: "Suspensions"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "stopwords",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StopwordsTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "log",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModerationLogTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "ai-queue",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIReviewQueueTab, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
				value: "suspensions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuspensionsTab, {})
			})
		]
	}) })] });
}
function StopwordsTab() {
	const [stopwords, setStopwords] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [newWord, setNewWord] = (0, import_react.useState)("");
	const [newCategory, setNewCategory] = (0, import_react.useState)("general");
	const [bulkInput, setBulkInput] = (0, import_react.useState)("");
	const [showBulk, setShowBulk] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		fetchStopwords();
	}, []);
	const fetchStopwords = async () => {
		setLoading(true);
		const { data } = await supabase.from("moderation_stopwords").select("*").order("created_at", { ascending: false });
		setStopwords(data || []);
		setLoading(false);
	};
	const addWord = async () => {
		if (!newWord.trim()) return;
		const { error } = await supabase.from("moderation_stopwords").insert({
			word: newWord.trim().toLowerCase(),
			category: newCategory,
			severity: "block"
		});
		if (error) {
			toast.error(error.message?.includes("duplicate") ? "Word already exists" : "Failed to add word");
			return;
		}
		setNewWord("");
		toast.success("Stopword added");
		fetchStopwords();
	};
	const bulkAdd = async () => {
		const words = bulkInput.split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean);
		if (words.length === 0) return;
		const rows = words.map((word) => ({
			word,
			category: newCategory,
			severity: "block"
		}));
		const { error } = await supabase.from("moderation_stopwords").insert(rows);
		if (error) toast.error("Some words may already exist. Added what we could.");
		else toast.success(`Added ${words.length} stopwords`);
		setBulkInput("");
		setShowBulk(false);
		fetchStopwords();
	};
	const deleteWord = async (id) => {
		await supabase.from("moderation_stopwords").delete().eq("id", id);
		toast.success("Stopword removed");
		fetchStopwords();
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 items-end flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 min-w-[200px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Add a stopword...",
							value: newWord,
							onChange: (e) => setNewWord(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && addWord()
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: newCategory,
						onValueChange: setNewCategory,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[140px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "general",
								children: "General"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "sexual",
								children: "Sexual"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "hate",
								children: "Hate"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "spam",
								children: "Spam"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "malware",
								children: "Malware"
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: addWord,
						size: "sm",
						className: "gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Add"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => setShowBulk(!showBulk),
						children: "Bulk Import"
					})
				]
			}),
			showBulk && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 p-3 border rounded-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					placeholder: "One word per line...",
					value: bulkInput,
					onChange: (e) => setBulkInput(e.target.value),
					rows: 5
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: bulkAdd,
					size: "sm",
					children: "Import All"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [stopwords.length, " stopwords configured"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-[400px] overflow-auto border rounded",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Word" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "w-[80px]",
						children: "Actions"
					})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: stopwords.map((sw) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-mono text-sm",
						children: sw.word
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						children: sw.category
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						onClick: () => deleteWord(sw.id),
						"aria-label": "Delete word",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
					}) })
				] }, sw.id)) })] })
			})
		]
	});
}
function TierBadge({ tier }) {
	if (tier === "ai") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		variant: "outline",
		className: "gap-1 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-3 w-3" }), " AI"]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "secondary",
		className: "text-xs",
		children: "Stopword"
	});
}
function ModerationLogTab() {
	const [events, setEvents] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [filterResult, setFilterResult] = (0, import_react.useState)("all");
	const profileNames = useProfileNames(events.map((e) => e.user_id));
	(0, import_react.useEffect)(() => {
		fetchEvents();
	}, [filterResult]);
	const fetchEvents = async () => {
		setLoading(true);
		let query = supabase.from("moderation_events").select("*").order("created_at", { ascending: false }).limit(100);
		if (filterResult !== "all") query = query.eq("result", filterResult);
		const { data } = await query;
		setEvents(data || []);
		setLoading(false);
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2 items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: filterResult,
				onValueChange: setFilterResult,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					className: "w-[160px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "all",
						children: "All Results"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "blocked",
						children: "Blocked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "cleared",
						children: "Cleared"
					})
				] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm text-muted-foreground",
				children: [events.length, " events"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-[500px] overflow-auto border rounded",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Time" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "User" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Action" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Tier" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Result" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Matched" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [events.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs whitespace-nowrap",
					children: format(new Date(ev.created_at), "MMM d, HH:mm")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCell, {
					userId: ev.user_id,
					displayName: profileNames[ev.user_id]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs",
					children: ev.action
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs",
					children: ev.item_type
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TierBadge, { tier: ev.tier }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: ev.result === "blocked" ? "destructive" : "secondary",
					children: ev.result
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs max-w-[200px] truncate",
					children: ev.matched_words?.join(", ") || "—"
				})
			] }, ev.id)), events.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				colSpan: 7,
				className: "text-center text-muted-foreground py-8",
				children: "No moderation events yet"
			}) })] })] })
		})]
	});
}
function AIReviewQueueTab() {
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("all");
	const [processing, setProcessing] = (0, import_react.useState)(false);
	const profileNames = useProfileNames(items.map((i) => i.user_id));
	(0, import_react.useEffect)(() => {
		fetchItems();
	}, [filterStatus]);
	const fetchItems = async () => {
		setLoading(true);
		let query = supabase.from("moderation_review_queue").select("*").order("created_at", { ascending: false }).limit(100);
		if (filterStatus !== "all") query = query.eq("status", filterStatus);
		const { data } = await query;
		setItems(data || []);
		setLoading(false);
	};
	const triggerProcessing = async () => {
		setProcessing(true);
		try {
			const { data, error } = await supabase.functions.invoke("ai-moderate-content");
			if (error) throw error;
			toast.success(`Processed: ${data?.processed || 0} items, ${data?.violations || 0} violations`);
			fetchItems();
		} catch (err) {
			toast.error("Failed to trigger AI review");
			console.error(err);
		} finally {
			setProcessing(false);
		}
	};
	const requeueItem = async (id) => {
		await supabase.from("moderation_review_queue").update({
			status: "pending",
			retry_count: 0,
			ai_category: null,
			ai_confidence: null,
			ai_reason: null,
			reviewed_at: null
		}).eq("id", id);
		toast.success("Re-queued for review");
		fetchItems();
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" });
	const pendingCount = items.filter((i) => i.status === "pending").length;
	const flaggedCount = items.filter((i) => i.status === "flagged").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2 items-center flex-wrap",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: filterStatus,
					onValueChange: setFilterStatus,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "w-[160px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All Statuses"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "pending",
							children: "Pending"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "flagged",
							children: "Flagged"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "reviewed",
							children: "Reviewed"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "violation",
							children: "Violation"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "error",
							children: "Error"
						})
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm text-muted-foreground",
					children: [
						pendingCount,
						" pending · ",
						flaggedCount,
						" flagged · ",
						items.length,
						" total"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: triggerProcessing,
					disabled: processing || pendingCount === 0,
					size: "sm",
					className: "gap-1 ml-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "h-4 w-4" }), processing ? "Processing…" : "Process Queue Now"]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-[500px] overflow-auto border rounded",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Time" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "User" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Confidence" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reason" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Actions" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs whitespace-nowrap",
					children: format(new Date(item.created_at), "MMM d, HH:mm")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs",
					children: item.item_type
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCell, {
					userId: item.user_id,
					displayName: profileNames[item.user_id]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueueStatusBadge, { status: item.status }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs",
					children: item.ai_category || "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs",
					children: item.ai_confidence != null ? `${Math.round(item.ai_confidence * 100)}%` : "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs max-w-[200px] truncate",
					title: item.ai_reason || void 0,
					children: item.ai_reason || "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: (item.status === "reviewed" || item.status === "violation" || item.status === "error" || item.status === "flagged") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => requeueItem(item.id),
					className: "text-xs gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3 w-3" }), " Re-review"]
				}) })
			] }, item.id)), items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				colSpan: 8,
				className: "text-center text-muted-foreground py-8",
				children: "No items in the AI review queue"
			}) })] })] })
		})]
	});
}
function QueueStatusBadge({ status }) {
	switch (status) {
		case "pending": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: "outline",
			children: "Pending"
		});
		case "flagged": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: "outline",
			className: "border-accent text-accent-foreground",
			children: "Flagged"
		});
		case "reviewed": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			variant: "secondary",
			className: "gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "h-3 w-3" }), " Safe"]
		});
		case "violation": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
			variant: "destructive",
			className: "gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-3 w-3" }), " Violation"]
		});
		case "error": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: "outline",
			className: "text-destructive border-destructive",
			children: "Error"
		});
		default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: "outline",
			children: status
		});
	}
}
function SuspensionsTab() {
	const [suspensions, setSuspensions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const profileNames = useProfileNames(suspensions.map((s) => s.user_id));
	(0, import_react.useEffect)(() => {
		fetchSuspensions();
	}, []);
	const fetchSuspensions = async () => {
		setLoading(true);
		const { data } = await supabase.from("user_suspensions").select("*").order("strike_count", { ascending: false });
		setSuspensions(data || []);
		setLoading(false);
	};
	const toggleSuspension = async (s) => {
		const newSuspended = !s.suspended;
		await supabase.from("user_suspensions").update({
			suspended: newSuspended,
			suspended_at: newSuspended ? (/* @__PURE__ */ new Date()).toISOString() : null,
			suspension_reason: newSuspended ? "Manually suspended by admin" : null
		}).eq("id", s.id);
		toast.success(newSuspended ? "User suspended" : "User unsuspended");
		fetchSuspensions();
	};
	const clearStrikes = async (id) => {
		await supabase.from("user_suspensions").update({
			strike_count: 0,
			suspended: false,
			suspended_at: null,
			suspension_reason: null
		}).eq("id", id);
		toast.success("Strikes cleared");
		fetchSuspensions();
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-32 w-full" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted-foreground",
			children: [
				suspensions.filter((s) => s.suspended).length,
				" users currently suspended, ",
				suspensions.length,
				" users with strikes"
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-[500px] overflow-auto border rounded",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "User ID" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Strikes" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Reason" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Actions" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [suspensions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCell, {
					userId: s.user_id,
					displayName: profileNames[s.user_id]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: s.strike_count >= 5 ? "destructive" : "secondary",
					children: s.strike_count
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: s.suspended ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "destructive",
					className: "gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "h-3 w-3" }), " Suspended"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "outline",
					className: "gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "h-3 w-3" }), " Active"]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-xs max-w-[200px] truncate",
					children: s.suspension_reason || "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => toggleSuspension(s),
						className: "text-xs",
						children: s.suspended ? "Unsuspend" : "Suspend"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							className: "text-xs gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3 w-3" }), " Clear"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Clear all strikes?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This will reset the strike counter to 0 and unsuspend the user if they were suspended." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
						onClick: () => clearStrikes(s.id),
						children: "Clear Strikes"
					})] })] })] })]
				}) })
			] }, s.id)), suspensions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				colSpan: 5,
				className: "text-center text-muted-foreground py-8",
				children: "No users with strikes"
			}) })] })] })
		})]
	});
}
function EmbeddingsBackfillPanel() {
	const [counts, setCounts] = (0, import_react.useState)(null);
	const [loadingCounts, setLoadingCounts] = (0, import_react.useState)(false);
	const [running, setRunning] = (0, import_react.useState)(false);
	const [lastResults, setLastResults] = (0, import_react.useState)(null);
	const loadCounts = async () => {
		setLoadingCounts(true);
		try {
			const { data, error } = await supabase.functions.invoke("backfill-embeddings", { body: { dryRun: true } });
			if (error) throw error;
			const c = data?.counts;
			if (c) setCounts({
				prompt: c.prompt?.missing ?? 0,
				skill: c.skill?.missing ?? 0,
				workflow: c.workflow?.missing ?? 0,
				claw: c.claw?.missing ?? 0
			});
		} catch (e) {
			toast.error(e?.message || "Failed to load embedding counts");
		} finally {
			setLoadingCounts(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadCounts();
	}, []);
	const runBackfill = async (itemType) => {
		setRunning(true);
		setLastResults(null);
		try {
			const { data, error } = await supabase.functions.invoke("backfill-embeddings", { body: {
				maxItems: 200,
				itemType
			} });
			if (error) throw error;
			const d = data;
			setLastResults(d.results);
			setCounts({
				prompt: d.remaining?.prompt ?? 0,
				skill: d.remaining?.skill ?? 0,
				workflow: d.remaining?.workflow ?? 0,
				claw: d.remaining?.claw ?? 0
			});
			const totalSucceeded = Object.values(d.results).reduce((s, r) => s + r.succeeded, 0);
			const totalFailed = Object.values(d.results).reduce((s, r) => s + r.failed, 0);
			if (totalFailed === 0) toast.success(`Generated ${totalSucceeded} embeddings`);
			else toast.warning(`Done: ${totalSucceeded} succeeded, ${totalFailed} failed`);
		} catch (e) {
			toast.error(e?.message || "Backfill failed");
		} finally {
			setRunning(false);
		}
	};
	const totalMissing = (counts?.prompt ?? 0) + (counts?.skill ?? 0) + (counts?.workflow ?? 0) + (counts?.claw ?? 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Generate Missing Embeddings" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "ghost",
			size: "sm",
			onClick: loadCounts,
			disabled: loadingCounts || running,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `h-4 w-4 ${loadingCounts ? "animate-spin" : ""}` })
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
		"Generates embeddings for artifacts where the vector column is empty. Uses OpenAI ",
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "text-embedding-3-small" }),
		" (1536 dim). Processes up to 200 items per run."
	] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
				children: [
					"prompt",
					"skill",
					"workflow",
					"claw"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs uppercase tracking-wide text-muted-foreground",
						children: [t, "s"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 flex items-baseline gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-2xl font-semibold tabular-nums",
							children: counts?.[t] ?? "—"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "missing"
						})]
					})]
				}, t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => runBackfill(),
					disabled: running || loadingCounts || totalMissing === 0,
					children: running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }), " Generating…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 mr-2" }), " Run backfill (all types)"] })
				}), totalMissing === 0 && counts && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "secondary",
					children: "All caught up"
				})]
			}),
			lastResults && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md border bg-muted/30 p-3 text-sm space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-medium",
					children: "Last run"
				}), Object.entries(lastResults).map(([type, r]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs uppercase",
						children: type
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 text-muted-foreground",
						children: [
							"processed ",
							r.processed,
							" · ✓ ",
							r.succeeded,
							" · ✗ ",
							r.failed
						]
					})] }), r.errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
						className: "text-xs text-muted-foreground max-w-[60%]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
							className: "cursor-pointer",
							children: [
								"errors (",
								r.errors.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 list-disc pl-4 space-y-0.5",
							children: r.errors.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "break-all",
								children: e
							}, i))
						})]
					})]
				}, type))]
			})
		]
	})] });
}
function UserTokenBalance({ userId, allowances, onUpdate }) {
	const allowance = allowances[userId];
	const [value, setValue] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const remainingTokens = allowance ? Math.max(allowance.tokens_granted - allowance.tokens_used, 0) : null;
	(0, import_react.useEffect)(() => {
		setValue(remainingTokens);
	}, [remainingTokens]);
	const handleChange = (e) => {
		const newValue = parseInt(e.target.value, 10);
		if (!isNaN(newValue) && newValue >= 0) setValue(newValue);
		else if (e.target.value === "") setValue(0);
	};
	const handleBlur = async () => {
		if (!allowance || value === null || value === remainingTokens) return;
		setSaving(true);
		try {
			let newTokensGranted = allowance.tokens_granted;
			let newTokensUsed = allowance.tokens_used;
			if (value > allowance.tokens_granted) {
				newTokensGranted = value;
				newTokensUsed = 0;
			} else newTokensUsed = Math.max(allowance.tokens_granted - value, 0);
			const { error } = await supabase.from("ai_allowance_periods").update({
				tokens_granted: newTokensGranted,
				tokens_used: newTokensUsed
			}).eq("id", allowance.id);
			if (error) throw error;
			onUpdate(userId, {
				...allowance,
				tokens_granted: newTokensGranted,
				tokens_used: newTokensUsed
			});
			toast.success("Remaining tokens updated");
		} catch (error) {
			console.error("Error updating tokens:", error);
			toast.error("Failed to update tokens");
			setValue(remainingTokens);
		} finally {
			setSaving(false);
		}
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter") e.currentTarget.blur();
	};
	if (!allowance) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-muted-foreground",
		children: "—"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
		type: "number",
		min: 0,
		value: value ?? 0,
		onChange: handleChange,
		onBlur: handleBlur,
		onKeyDown: handleKeyDown,
		disabled: saving,
		className: "w-24 h-8 text-sm"
	});
}
function UserTokenModal({ open, onOpenChange, userId, displayName, onSave }) {
	const { user: adminUser } = useAuthContext();
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [allowance, setAllowance] = (0, import_react.useState)(null);
	const [tokensPerCredit, setTokensPerCredit] = (0, import_react.useState)(200);
	const [tokensGranted, setTokensGranted] = (0, import_react.useState)(0);
	const [tokensUsed, setTokensUsed] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (open && userId) fetchAllowanceData();
	}, [open, userId]);
	const fetchAllowanceData = async () => {
		setLoading(true);
		try {
			const [settingsResult, allowanceResult] = await Promise.all([supabase.from("ai_credit_settings").select("key, value_int").eq("key", "tokens_per_credit").maybeSingle(), supabase.from("ai_allowance_periods").select("*").eq("user_id", userId).lte("period_start", (/* @__PURE__ */ new Date()).toISOString()).gt("period_end", (/* @__PURE__ */ new Date()).toISOString()).order("period_end", { ascending: false }).limit(1).maybeSingle()]);
			if (settingsResult.data) setTokensPerCredit(settingsResult.data.value_int || 200);
			if (allowanceResult.data) {
				const data = allowanceResult.data;
				setAllowance(data);
				setTokensGranted(data.tokens_granted);
				setTokensUsed(data.tokens_used);
			} else {
				setAllowance(null);
				setTokensGranted(0);
				setTokensUsed(0);
			}
		} catch (error) {
			console.error("Error fetching allowance data:", error);
			toast.error("Failed to load token data");
		} finally {
			setLoading(false);
		}
	};
	const handleSave = async () => {
		if (!allowance) {
			toast.error("No allowance period found for this user");
			return;
		}
		if (!adminUser) {
			toast.error("Admin authentication required");
			return;
		}
		setSaving(true);
		try {
			const oldTokensGranted = allowance.tokens_granted;
			const oldTokensUsed = allowance.tokens_used;
			const tokensGrantedDelta = tokensGranted - oldTokensGranted;
			const tokensUsedDelta = tokensUsed - oldTokensUsed;
			const { error: updateError } = await supabase.from("ai_allowance_periods").update({
				tokens_granted: tokensGranted,
				tokens_used: tokensUsed
			}).eq("id", allowance.id);
			if (updateError) throw updateError;
			const { error: logError } = await supabase.from("llm_usage_events").insert({
				user_id: userId,
				idempotency_key: `admin_adjustment_${allowance.id}_${Date.now()}`,
				feature: "admin_balance_adjustment",
				total_tokens: tokensGrantedDelta,
				prompt_tokens: 0,
				completion_tokens: 0,
				credits_charged: 0,
				metadata: {
					admin_id: adminUser.id,
					admin_action: "balance_adjustment",
					allowance_period_id: allowance.id,
					target_user_id: userId,
					target_display_name: displayName,
					previous_tokens_granted: oldTokensGranted,
					new_tokens_granted: tokensGranted,
					tokens_granted_delta: tokensGrantedDelta,
					previous_tokens_used: oldTokensUsed,
					new_tokens_used: tokensUsed,
					tokens_used_delta: tokensUsedDelta,
					previous_remaining: oldTokensGranted - oldTokensUsed,
					new_remaining: tokensGranted - tokensUsed,
					adjusted_at: (/* @__PURE__ */ new Date()).toISOString()
				}
			});
			if (logError) {
				console.error("Failed to log admin adjustment:", logError);
				toast.warning("Balance updated but audit log failed");
			}
			const updatedAllowance = {
				...allowance,
				tokens_granted: tokensGranted,
				tokens_used: tokensUsed
			};
			setAllowance(updatedAllowance);
			onSave?.(updatedAllowance);
			toast.success("Token balance updated successfully");
			onOpenChange(false);
		} catch (error) {
			console.error("Error saving token balance:", error);
			toast.error("Failed to update token balance");
		} finally {
			setSaving(false);
		}
	};
	const remainingTokens = Math.max(tokensGranted - tokensUsed, 0);
	const creditsGranted = tokensGranted / tokensPerCredit;
	const creditsUsed = tokensUsed / tokensPerCredit;
	const creditsRemaining = remainingTokens / tokensPerCredit;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-[500px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Token & Plan Management" }) }),
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-center py-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
				}) : !allowance ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-8 text-center text-muted-foreground",
					children: "No active subscription period found for this user."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground",
								children: "User Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: displayName || "Unnamed User"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground",
								children: "Full User ID"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-sm break-all",
								children: userId
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground",
								children: "Subscription Period Start"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: format(new Date(allowance.period_start), "MMM d, yyyy HH:mm")
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground",
								children: "Subscription Period End"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: format(new Date(allowance.period_end), "MMM d, yyyy HH:mm")
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 border-t pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-semibold",
									children: "Token Balance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "tokens-granted",
											children: "Tokens Granted"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "tokens-granted",
											type: "number",
											min: 0,
											value: tokensGranted,
											onChange: (e) => setTokensGranted(parseInt(e.target.value) || 0)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "tokens-used",
											children: "Tokens Used"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "tokens-used",
											type: "number",
											min: 0,
											value: tokensUsed,
											onChange: (e) => setTokensUsed(parseInt(e.target.value) || 0)
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs text-muted-foreground",
									children: "Remaining Tokens"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl font-bold text-primary",
									children: remainingTokens.toLocaleString()
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 border-t pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
								className: "text-sm font-semibold",
								children: [
									"AI Credits",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-normal text-muted-foreground",
										children: [
											"(1 credit = ",
											tokensPerCredit.toLocaleString(),
											" tokens)"
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-3 gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs text-muted-foreground",
										children: "Granted"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-medium",
										children: Math.round(creditsGranted).toLocaleString()
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs text-muted-foreground",
										children: "Used"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-medium",
										children: Math.round(creditsUsed).toLocaleString()
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs text-muted-foreground",
										children: "Remaining"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-medium text-primary",
										children: Math.round(creditsRemaining).toLocaleString()
									})] })
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2 sm:gap-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => onOpenChange(false),
						children: "Close"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: handleSave,
						disabled: saving || loading || !allowance,
						children: [saving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Save"]
					})]
				})
			]
		})
	});
}
function UsersPanel() {
	const { user } = useAuthContext();
	const { isAdmin } = useUserRole();
	const [users, setUsers] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [savingUserId, setSavingUserId] = (0, import_react.useState)(null);
	const [deletingUserId, setDeletingUserId] = (0, import_react.useState)(null);
	const [editedUsers, setEditedUsers] = (0, import_react.useState)({});
	const [allowances, setAllowances] = (0, import_react.useState)({});
	const [tokenModalUser, setTokenModalUser] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isAdmin) {
			fetchUsers();
			initializeAndFetchAllowances();
		}
	}, [isAdmin]);
	const initializeAndFetchAllowances = async () => {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) return;
			const response = await supabase.functions.invoke("ensure-token-allowance", { body: { batch_init: true } });
			if (response.error) console.error("Error initializing allowances:", response.error);
		} catch (error) {
			console.error("Error in initializeAndFetchAllowances:", error);
		}
		await fetchAllowances();
	};
	const fetchUsers = async () => {
		setLoading(true);
		try {
			const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, display_name, avatar_url, created_at").order("created_at", { ascending: false });
			if (profilesError) throw profilesError;
			const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
			if (rolesError) throw rolesError;
			const roleMap = /* @__PURE__ */ new Map();
			(roles || []).forEach((r) => {
				roleMap.set(r.user_id, r.role);
			});
			const usersWithRoles = (profiles || []).map((p) => ({
				id: p.id,
				display_name: p.display_name,
				avatar_url: p.avatar_url,
				created_at: p.created_at,
				role: roleMap.get(p.id) || "free"
			}));
			setUsers(usersWithRoles);
		} catch (error) {
			console.error("Error fetching users:", error);
			toast.error("Failed to load users");
		} finally {
			setLoading(false);
		}
	};
	const fetchAllowances = async () => {
		try {
			const now = (/* @__PURE__ */ new Date()).toISOString();
			const { data, error } = await supabase.from("ai_allowance_periods").select("id, user_id, tokens_granted, tokens_used, period_start, period_end").lte("period_start", now).gt("period_end", now);
			if (error) throw error;
			const allowanceMap = {};
			(data || []).forEach((row) => {
				if (!allowanceMap[row.user_id] || row.period_end > allowanceMap[row.user_id].id) allowanceMap[row.user_id] = {
					id: row.id,
					user_id: row.user_id,
					tokens_granted: row.tokens_granted,
					tokens_used: row.tokens_used
				};
			});
			setAllowances(allowanceMap);
		} catch (error) {
			console.error("Error fetching allowances:", error);
		}
	};
	const handleAllowanceUpdate = (userId, newAllowance) => {
		setAllowances((prev) => ({
			...prev,
			[userId]: newAllowance
		}));
	};
	const handleRoleChange = (userId, value) => {
		setEditedUsers((prev) => ({
			...prev,
			[userId]: { role: value }
		}));
	};
	const handleSaveUser = async (userId) => {
		const changes = editedUsers[userId];
		if (!changes?.role) return;
		setSavingUserId(userId);
		try {
			const { error } = await supabase.from("user_roles").update({ role: changes.role }).eq("user_id", userId);
			if (error) throw error;
			setUsers((prev) => prev.map((u) => u.id === userId ? {
				...u,
				role: changes.role
			} : u));
			setEditedUsers((prev) => {
				const { [userId]: _, ...rest } = prev;
				return rest;
			});
			toast.success("User role updated successfully");
		} catch (error) {
			console.error("Error updating user:", error);
			toast.error("Failed to update user role");
		} finally {
			setSavingUserId(null);
		}
	};
	const handleDeleteUser = async (userId) => {
		if (userId === user?.id) {
			toast.error("You cannot delete your own account");
			return;
		}
		setDeletingUserId(userId);
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) throw new Error("Not authenticated");
			const response = await supabase.functions.invoke("delete-user", { body: { userId } });
			if (response.error) throw new Error(response.error.message || "Failed to delete user");
			if (response.data?.error) throw new Error(response.data.error);
			setUsers((prev) => prev.filter((u) => u.id !== userId));
			setEditedUsers((prev) => {
				const { [userId]: _, ...rest } = prev;
				return rest;
			});
			toast.success("User deleted successfully");
		} catch (error) {
			console.error("Error deleting user:", error);
			toast.error(error instanceof Error ? error.message : "Failed to delete user");
		} finally {
			setDeletingUserId(null);
		}
	};
	const filteredUsers = users.filter((u) => {
		const query = searchQuery.toLowerCase();
		return u.display_name?.toLowerCase().includes(query) || u.id.toLowerCase().includes(query);
	});
	const getInitials = (name) => {
		if (!name) return "U";
		return name.slice(0, 2).toUpperCase();
	};
	const getUserRole = (userId) => {
		const editedValue = editedUsers[userId]?.role;
		if (editedValue !== void 0) return editedValue;
		return users.find((u) => u.id === userId)?.role || "free";
	};
	const hasChanges = (userId) => {
		return !!editedUsers[userId] && Object.keys(editedUsers[userId]).length > 0;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Users Management" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full sm:w-72",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				placeholder: "Search by name or ID...",
				value: searchQuery,
				onChange: (e) => setSearchQuery(e.target.value),
				className: "pl-9"
			})]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardDescription, { children: [
		filteredUsers.length,
		" user",
		filteredUsers.length !== 1 ? "s" : "",
		" ",
		"found"
	] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-4",
		children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-full" }, i))
	}) : filteredUsers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-12 text-muted-foreground",
		children: searchQuery ? "No users match your search." : "No users found."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "User" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Role" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Remaining Tokens" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Created" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "w-8" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "w-16" })
		] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filteredUsers.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
					className: "h-8 w-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: u.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
						className: "text-xs",
						children: getInitials(u.display_name)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium truncate",
						children: u.display_name || "Unnamed User"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground truncate max-w-[200px]",
						children: u.id
					})]
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: getUserRole(u.id),
				onValueChange: (value) => handleRoleChange(u.id, value),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
					className: "w-36",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "free",
						children: "free"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "premium",
						children: "premium"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "premium_gift",
						children: "premium_gift"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "admin",
						children: "admin"
					})
				] })]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserTokenBalance, {
				userId: u.id,
				allowances,
				onUpdate: handleAllowanceUpdate
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				className: "text-sm text-muted-foreground",
				children: u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => setTokenModalUser({
					id: u.id,
					displayName: u.display_name
				}),
				title: "Manage tokens & plan",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "h-4 w-4 text-amber-500" })
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [hasChanges(u.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => handleSaveUser(u.id),
					disabled: savingUserId === u.id,
					className: "gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-3 w-3" }), savingUserId === u.id ? "Saving..." : "Save"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						className: "text-destructive hover:text-destructive hover:bg-destructive/10",
						disabled: u.id === user?.id || deletingUserId === u.id,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete User" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
					"Are you sure you want to delete",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: u.display_name || "this user"
					}),
					"? This action cannot be undone and will remove all their data."
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => handleDeleteUser(u.id),
					className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
					children: deletingUserId === u.id ? "Deleting..." : "Delete"
				})] })] })] })]
			}) })
		] }, u.id)) })] })
	}) })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserTokenModal, {
		open: !!tokenModalUser,
		onOpenChange: (open) => !open && setTokenModalUser(null),
		userId: tokenModalUser?.id || "",
		displayName: tokenModalUser?.displayName || null,
		onSave: (updatedAllowance) => {
			setAllowances((prev) => ({
				...prev,
				[updatedAllowance.user_id]: {
					id: updatedAllowance.id,
					user_id: updatedAllowance.user_id,
					tokens_granted: updatedAllowance.tokens_granted,
					tokens_used: updatedAllowance.tokens_used
				}
			}));
		}
	})] });
}
var LLMConfigPanel = (0, import_react.lazy)(() => import("./LLMConfigPanel-CQRzRAu4.mjs"));
var LLMUsagePanel = (0, import_react.lazy)(() => import("./LLMUsagePanel-ChmXyDZ8.mjs"));
function Admin() {
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuthContext();
	const { isAdmin, isLoading: roleLoading } = useUserRole();
	(0, import_react.useEffect)(() => {
		if (!authLoading && !roleLoading) {
			if (!user) {
				toast.error("You don't have permission to view the admin panel.");
				navigate("/");
				return;
			}
			if (!isAdmin) {
				toast.error("You don't have permission to view the admin panel.");
				navigate("/");
				return;
			}
		}
	}, [
		user,
		isAdmin,
		authLoading,
		roleLoading,
		navigate
	]);
	if (authLoading || roleLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 container mx-auto px-4 py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-48 mb-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (!user || !isAdmin) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 container mx-auto px-4 py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-8 w-8 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-bold tracking-tight",
						children: "Admin Dashboard"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "Manage users, credits, moderation and AI configuration"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "users",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "flex-wrap h-auto",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "users",
									className: "gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3.5 w-3.5" }), " Users"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "credits",
									className: "gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), " AI Credits"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "moderation",
									className: "gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-3.5 w-3.5" }), " Moderation"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "embeddings",
									className: "gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "h-3.5 w-3.5" }), " Embeddings"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
									value: "llm",
									className: "gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "h-3.5 w-3.5" }), " LLM Config"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "users",
							className: "mt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsersPanel, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "credits",
							className: "mt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AICreditSettings, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "moderation",
							className: "mt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModerationPanel, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "embeddings",
							className: "mt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmbeddingsBackfillPanel, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "llm",
							className: "mt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
								fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full" }),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LLMConfigPanel, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LLMUsagePanel, {})]
								})
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = Admin;
//#endregion
export { SplitComponent as component };
