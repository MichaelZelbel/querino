import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { $t as FileText, D as Tag, En as ChevronRight, H as RotateCcw, Jt as GitBranch, Vn as ArrowLeft, en as Eye, gt as LoaderCircle, kn as Check, qt as GitCompare, vn as Clock } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as format } from "../_libs/date-fns.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
import { t as ScrollArea } from "./scroll-area-D0AShDWm.mjs";
import { i as SheetTitle, n as SheetContent, r as SheetHeader, t as Sheet } from "./sheet-CmQHWRHQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/VersionHistoryPanel-Ba812uju.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VersionDetailView({ version, onBack, onRestore, onCompare }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col h-[calc(100vh-80px)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 px-4 py-3 border-b border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: onBack,
					className: "shrink-0",
					"aria-label": "Back",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "secondary",
						className: "shrink-0",
						children: ["v", version.version_number]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium text-foreground truncate",
						children: version.title
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(new Date(version.created_at), "MMMM d, yyyy 'at' h:mm a") })]
						}),
						version.change_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg bg-muted/50 p-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: "Change notes:"
									}),
									" ",
									version.change_notes
								]
							})
						}),
						version.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
								children: "Description"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-foreground",
								children: version.description
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
								children: "Prompt Content"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-lg border border-border bg-muted/30 p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "whitespace-pre-wrap font-mono text-sm text-foreground",
									children: version.content
								})
							})]
						}),
						version.tags && version.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
								className: "text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-3 w-3" }), "Tags"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1.5",
								children: version.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "text-xs",
									children: tag
								}, tag))
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 p-4 border-t border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: onCompare,
					className: "gap-2 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitCompare, { className: "h-4 w-4" }), "Compare with Current"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: onRestore,
					className: "gap-2 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4" }), "Restore"]
				})]
			})
		]
	});
}
function computeLineDiff(original, current) {
	const originalLines = original.split("\n");
	const currentLines = current.split("\n");
	const result = [];
	const maxLength = Math.max(originalLines.length, currentLines.length);
	for (let i = 0; i < maxLength; i++) {
		const origLine = originalLines[i];
		const currLine = currentLines[i];
		if (origLine === void 0 && currLine !== void 0) result.push({
			type: "added",
			content: currLine
		});
		else if (currLine === void 0 && origLine !== void 0) result.push({
			type: "removed",
			content: origLine
		});
		else if (origLine === currLine) result.push({
			type: "unchanged",
			content: origLine
		});
		else {
			result.push({
				type: "removed",
				content: origLine
			});
			result.push({
				type: "added",
				content: currLine
			});
		}
	}
	return result;
}
function MetadataCompare({ label, versionValue, currentValue }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-24 shrink-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
				children: label
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 min-w-0",
			children: versionValue !== currentValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "outline",
						className: "text-xs bg-muted shrink-0",
						children: [
							"v",
							label === "Title" ? "" : "",
							"Version"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-foreground truncate",
						children: versionValue || "(empty)"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "text-xs shrink-0",
						children: "Current"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-foreground truncate",
						children: currentValue || "(empty)"
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 text-green-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-muted-foreground",
					children: "Unchanged"
				})]
			})
		})]
	});
}
function TagsCompare({ versionTags, currentTags }) {
	const vTags = versionTags || [];
	const cTags = currentTags || [];
	const changed = JSON.stringify(vTags.sort()) !== JSON.stringify([...cTags].sort());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-24 shrink-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
				children: "Tags"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 min-w-0",
			children: changed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					className: "text-xs bg-muted mb-1",
					children: "Version"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1 mt-1",
					children: vTags.length > 0 ? vTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						className: "text-xs",
						children: tag
					}, tag)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "No tags"
					})
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					className: "text-xs mb-1",
					children: "Current"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1 mt-1",
					children: cTags.length > 0 ? cTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						className: "text-xs",
						children: tag
					}, tag)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "No tags"
					})
				})] })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 text-green-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-muted-foreground",
					children: "Unchanged"
				})]
			})
		})]
	});
}
function VersionCompareView({ version, currentPrompt, onBack, onRestore }) {
	const contentDiff = computeLineDiff(version.content, currentPrompt.content);
	const hasContentChanges = version.content !== currentPrompt.content;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col h-[calc(100vh-80px)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 px-4 py-3 border-b border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: onBack,
					className: "shrink-0",
					"aria-label": "Back",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2 min-w-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm font-medium text-foreground",
						children: [
							"Compare v",
							version.version_number,
							" with Current"
						]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4 space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3",
							children: "Metadata Changes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border divide-y divide-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetadataCompare, {
										label: "Title",
										versionValue: version.title,
										currentValue: currentPrompt.title
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetadataCompare, {
										label: "Description",
										versionValue: version.description,
										currentValue: currentPrompt.description
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TagsCompare, {
										versionTags: version.tags,
										currentTags: currentPrompt.tags
									})
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
							children: "Content Changes"
						}), !hasContentChanges ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border p-4 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-green-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted-foreground",
								children: "Content is identical"
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border overflow-hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 border-b border-border bg-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border",
									children: ["Version v", version.version_number]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-3 py-2 text-xs font-medium text-muted-foreground",
									children: "Current"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-[400px] overflow-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "text-xs font-mono",
									children: contentDiff.map((line, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `flex min-h-[20px] ${line.type === "added" ? "bg-green-100 dark:bg-green-950/50" : line.type === "removed" ? "bg-red-100 dark:bg-red-950/50" : ""}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-6 px-1 text-center text-muted-foreground select-none border-r border-border flex-shrink-0",
											children: line.type === "added" ? "+" : line.type === "removed" ? "-" : " "
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `flex-1 px-2 whitespace-pre-wrap break-all ${line.type === "added" ? "text-green-700 dark:text-green-300" : line.type === "removed" ? "text-red-700 dark:text-red-300" : "text-foreground"}`,
											children: line.content
										})]
									}, idx))
								})
							})]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 p-4 border-t border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: onBack,
					className: "flex-1",
					children: "Back to List"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: onRestore,
					className: "gap-2 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4" }),
						"Restore v",
						version.version_number
					]
				})]
			})
		]
	});
}
var PROMPT_CONFIG = {
	versionsTable: "prompt_versions",
	idColumn: "prompt_id",
	artifactTable: "prompts"
};
function VersionHistoryPanel({ open, onOpenChange, promptId, currentPrompt, onRestoreComplete, tableConfig = PROMPT_CONFIG }) {
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const [versions, setVersions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [viewMode, setViewMode] = (0, import_react.useState)("list");
	const [selectedVersion, setSelectedVersion] = (0, import_react.useState)(null);
	const [restoringVersion, setRestoringVersion] = (0, import_react.useState)(null);
	const [isRestoring, setIsRestoring] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		async function fetchVersions() {
			if (!open || !promptId) return;
			setLoading(true);
			try {
				const { data, error } = await supabase.from(tableConfig.versionsTable).select("*").eq(tableConfig.idColumn, promptId).order("version_number", { ascending: false });
				if (error) {
					console.error("Error fetching versions:", error);
					toast.error("Failed to load version history");
				} else if (data) setVersions(data);
			} catch (err) {
				console.error("Error fetching versions:", err);
				toast.error("Failed to load version history");
			} finally {
				setLoading(false);
			}
		}
		fetchVersions();
	}, [
		open,
		promptId,
		tableConfig.versionsTable
	]);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setViewMode("list");
			setSelectedVersion(null);
		}
	}, [open]);
	const handleViewVersion = (version) => {
		setSelectedVersion(version);
		setViewMode("detail");
	};
	const handleCompareVersion = (version) => {
		setSelectedVersion(version);
		setViewMode("compare");
	};
	const handleBackToList = () => {
		setViewMode("list");
		setSelectedVersion(null);
	};
	const handleRestore = async () => {
		if (!restoringVersion || !promptId || !user) return;
		setIsRestoring(true);
		try {
			const { data: latestRow, error: latestError } = await supabase.from(tableConfig.versionsTable).select("version_number, title, description, content, tags").eq(tableConfig.idColumn, promptId).order("version_number", { ascending: false }).limit(1).maybeSingle();
			if (latestError) {
				console.error("Error fetching latest version:", latestError);
				toast.error("Failed to restore version. Please try again.");
				return;
			}
			const latest = latestRow;
			let nextVersionNumber = (latest?.version_number ?? 0) + 1;
			if (!(latest && latest.title === currentPrompt.title && (latest.description ?? "") === (currentPrompt.description ?? "") && latest.content === currentPrompt.content)) {
				const { error: snapshotError } = await supabase.from(tableConfig.versionsTable).insert({
					[tableConfig.idColumn]: promptId,
					version_number: nextVersionNumber,
					title: currentPrompt.title,
					description: currentPrompt.description,
					content: currentPrompt.content,
					tags: currentPrompt.tags,
					change_notes: `Snapshot before restoring v${restoringVersion.version_number}`
				});
				if (snapshotError) {
					console.error("Error snapshotting current content:", snapshotError);
					toast.error("Failed to preserve current content. Restore cancelled.");
					return;
				}
				nextVersionNumber += 1;
			}
			const { error: versionError } = await supabase.from(tableConfig.versionsTable).insert({
				[tableConfig.idColumn]: promptId,
				version_number: nextVersionNumber,
				title: restoringVersion.title,
				description: restoringVersion.description,
				content: restoringVersion.content,
				tags: restoringVersion.tags,
				change_notes: `Restored from version v${restoringVersion.version_number}`
			});
			if (versionError) {
				console.error("Error creating restore version:", versionError);
				toast.error("Failed to restore version. Please try again.");
				return;
			}
			const { error: updateError } = await supabase.from(tableConfig.artifactTable).update({
				title: restoringVersion.title,
				description: restoringVersion.description || "",
				content: restoringVersion.content,
				tags: restoringVersion.tags
			}).eq("id", promptId).eq("author_id", user.id);
			if (updateError) {
				console.error("Error updating prompt:", updateError);
				toast.error("Version entry created but failed to update prompt.");
				return;
			}
			toast.success(`Restored to version v${restoringVersion.version_number}`);
			onOpenChange(false);
			if (onRestoreComplete) onRestoreComplete();
			else navigate(`/library/${promptId}/edit`);
		} catch (err) {
			console.error("Error restoring version:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsRestoring(false);
			setRestoringVersion(null);
		}
	};
	const renderContent = () => {
		if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-4 p-4",
			children: [
				1,
				2,
				3
			].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-5 w-16 mb-2" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-3/4 mb-2" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-3 w-1/2" })
				]
			}, i))
		});
		if (viewMode === "detail" && selectedVersion) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionDetailView, {
			version: selectedVersion,
			onBack: handleBackToList,
			onRestore: () => setRestoringVersion(selectedVersion),
			onCompare: () => handleCompareVersion(selectedVersion)
		});
		if (viewMode === "compare" && selectedVersion) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionCompareView, {
			version: selectedVersion,
			currentPrompt,
			onBack: handleBackToList,
			onRestore: () => setRestoringVersion(selectedVersion)
		});
		if (versions.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-12 px-4 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-8 w-8 text-muted-foreground" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mb-2 text-lg font-semibold text-foreground",
					children: "No versions yet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground max-w-[280px]",
					children: "Create versions when editing to track changes and safely roll back if needed."
				})
			]
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
			className: "h-[calc(100vh-120px)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3 p-4",
				children: versions.map((version, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										variant: index === 0 ? "default" : "secondary",
										className: "shrink-0 text-xs",
										children: ["v", version.version_number]
									}), index === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-xs",
										children: "Latest"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-medium text-foreground truncate",
									children: version.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 text-xs text-muted-foreground mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a") })]
								}),
								version.change_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground mt-1.5 italic line-clamp-1",
									children: [
										"\"",
										version.change_notes,
										"\""
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => handleViewVersion(version),
							className: "shrink-0",
							"aria-label": "View version",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 mt-3 pt-3 border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => handleViewVersion(version),
								className: "gap-1.5 text-xs flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }), "View"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => handleCompareVersion(version),
								className: "gap-1.5 text-xs flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitCompare, { className: "h-3 w-3" }), "Compare"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								size: "sm",
								onClick: () => setRestoringVersion(version),
								className: "gap-1.5 text-xs flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3 w-3" }), "Restore"]
							})
						]
					})]
				}, version.id))
			})
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			className: "w-full sm:max-w-md p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
				className: "px-4 py-4 border-b border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, { className: "h-5 w-5 text-primary" }), "Version History"]
				})
			}), renderContent()]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
		open: !!restoringVersion,
		onOpenChange: () => setRestoringVersion(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
			"Restore version v",
			restoringVersion?.version_number,
			"?"
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
			"This will update your prompt with the content from version v",
			restoringVersion?.version_number,
			"and create a new version entry. Your current changes will be preserved in the version history."
		] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
			disabled: isRestoring,
			children: "Cancel"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogAction, {
			onClick: handleRestore,
			disabled: isRestoring,
			className: "gap-2",
			children: [isRestoring && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Restore"]
		})] })] })
	})] });
}
//#endregion
export { VersionHistoryPanel as t };
