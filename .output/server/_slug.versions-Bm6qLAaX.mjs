import { o as __toESM } from "./_runtime.mjs";
import { n as supabase } from "./_ssr/client-Bi_X_zk2.mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Badge } from "./_ssr/badge-DDdsxPGp.mjs";
import { $t as FileText, H as RotateCcw, I as ShieldAlert, Jt as GitBranch, Vn as ArrowLeft, en as Eye, gt as LoaderCircle, vn as Clock } from "./_libs/lucide-react.mjs";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, t as Dialog } from "./_ssr/dialog-s-1huv4W.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./_ssr/Footer-ClUC5jzd.mjs";
import { n as format } from "./_libs/date-fns.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./_ssr/alert-dialog-Dt930TVg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug.versions-Bm6qLAaX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VersionHistory() {
	const { id } = useParams$1();
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuthContext();
	const [prompt, setPrompt] = (0, import_react.useState)(null);
	const [versions, setVersions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [notFound, setNotFound] = (0, import_react.useState)(false);
	const [notAuthorized, setNotAuthorized] = (0, import_react.useState)(false);
	const [viewingVersion, setViewingVersion] = (0, import_react.useState)(null);
	const [restoringVersion, setRestoringVersion] = (0, import_react.useState)(null);
	const [isRestoring, setIsRestoring] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) navigate(`/auth?redirect=/library/${id}/versions`, { replace: true });
	}, [
		user,
		authLoading,
		navigate,
		id
	]);
	(0, import_react.useEffect)(() => {
		async function fetchData() {
			if (!id || !user) return;
			try {
				const { data: promptData, error: promptError } = await supabase.from("prompts").select("id, title, author_id").eq("id", id).maybeSingle();
				if (promptError) {
					console.error("Error fetching prompt:", promptError);
					setNotFound(true);
					return;
				}
				if (!promptData) {
					setNotFound(true);
					return;
				}
				if (promptData.author_id !== user.id) {
					setNotAuthorized(true);
					return;
				}
				setPrompt(promptData);
				const { data: versionsData, error: versionsError } = await supabase.from("prompt_versions").select("*").eq("prompt_id", id).order("version_number", { ascending: false });
				if (versionsError) console.error("Error fetching versions:", versionsError);
				else if (versionsData) setVersions(versionsData);
			} catch (err) {
				console.error("Error fetching data:", err);
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		}
		if (user) fetchData();
	}, [id, user]);
	const handleRestore = async () => {
		if (!restoringVersion || !id || !user) return;
		setIsRestoring(true);
		try {
			const [{ data: livePrompt, error: liveError }, { data: latest, error: latestError }] = await Promise.all([supabase.from("prompts").select("title, description, content, tags").eq("id", id).maybeSingle(), supabase.from("prompt_versions").select("version_number, title, description, content").eq("prompt_id", id).order("version_number", { ascending: false }).limit(1).maybeSingle()]);
			if (liveError || latestError || !livePrompt) {
				console.error("Error fetching current state:", liveError || latestError);
				toast.error("Failed to restore version. Please try again.");
				return;
			}
			let nextVersionNumber = (latest?.version_number ?? 0) + 1;
			if (!(latest && latest.title === livePrompt.title && (latest.description ?? "") === (livePrompt.description ?? "") && latest.content === livePrompt.content)) {
				const { error: snapshotError } = await supabase.from("prompt_versions").insert({
					prompt_id: id,
					version_number: nextVersionNumber,
					title: livePrompt.title,
					description: livePrompt.description,
					content: livePrompt.content,
					tags: livePrompt.tags,
					change_notes: `Snapshot before restoring v${restoringVersion.version_number}`
				});
				if (snapshotError) {
					console.error("Error snapshotting current content:", snapshotError);
					toast.error("Failed to preserve current content. Restore cancelled.");
					return;
				}
				nextVersionNumber += 1;
			}
			const { error: versionError } = await supabase.from("prompt_versions").insert({
				prompt_id: id,
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
			const { error: updateError } = await supabase.from("prompts").update({
				title: restoringVersion.title,
				description: restoringVersion.description || "",
				content: restoringVersion.content,
				tags: restoringVersion.tags
			}).eq("id", id).eq("author_id", user.id);
			if (updateError) {
				console.error("Error updating prompt:", updateError);
				toast.error("Version entry created but failed to update prompt.");
				return;
			}
			toast.success(`Restored to version v${restoringVersion.version_number}`);
			navigate(`/library/${id}/edit`);
		} catch (err) {
			console.error("Error restoring version:", err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsRestoring(false);
			setRestoringVersion(null);
		}
	};
	if (authLoading || loading && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (!user) return null;
	if (notFound) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-4 text-display-md font-bold text-foreground",
							children: "Prompt Not Found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "The prompt you're looking for doesn't exist."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/library",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Library"]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	if (notAuthorized) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4 flex justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-8 w-8 text-destructive" })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mb-4 text-display-md font-bold text-foreground",
							children: "Not Authorized"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-8 text-lg text-muted-foreground",
							children: "You don't have permission to view this prompt's version history."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/library",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Library"]
							})
						})
					]
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
				className: "flex-1 py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-4xl px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
							to: `/library/${id}/edit`,
							className: "mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Edit"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, { className: "h-6 w-6 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-display-sm font-bold text-foreground",
									children: "Version History"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted-foreground",
								children: [
									"Your saved versions of \"",
									prompt?.title,
									"\""
								]
							})]
						}),
						versions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border bg-card p-12 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-4 flex justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-16 w-16 items-center justify-center rounded-full bg-muted",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-8 w-8 text-muted-foreground" })
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mb-2 text-lg font-semibold text-foreground",
									children: "No versions yet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-6 text-muted-foreground",
									children: "Use \"Save as New Version\" on the edit page to create version snapshots."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: `/library/${id}/edit`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { children: "Go to Edit Page" })
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4",
							children: versions.map((version, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3 mb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
													variant: index === 0 ? "default" : "secondary",
													className: "shrink-0",
													children: ["v", version.version_number]
												}), index === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-xs",
													children: "Latest"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-lg font-medium text-foreground mb-1 truncate",
												children: version.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-sm text-muted-foreground mb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a") })]
											}),
											version.change_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-muted-foreground italic",
												children: [
													"\"",
													version.change_notes,
													"\""
												]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											onClick: () => setViewingVersion(version),
											className: "gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" }), "View"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "secondary",
											size: "sm",
											onClick: () => setRestoringVersion(version),
											className: "gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4" }), "Restore"]
										})]
									})]
								})
							}, version.id))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!viewingVersion,
				onOpenChange: () => setViewingVersion(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-3xl max-h-[80vh] overflow-hidden flex flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "secondary",
								children: ["v", viewingVersion?.version_number]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: viewingVersion?.title
							})]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 overflow-auto space-y-4",
							children: [
								viewingVersion?.change_notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-lg bg-muted/50 p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium",
												children: "Change notes:"
											}),
											" ",
											viewingVersion.change_notes
										]
									})
								}),
								viewingVersion?.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-medium text-foreground",
										children: "Description"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: viewingVersion.description
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-medium text-foreground",
										children: "Prompt Content"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "rounded-lg border border-border bg-muted/30 p-4 max-h-[400px] overflow-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
											className: "whitespace-pre-wrap font-mono text-sm text-foreground",
											children: viewingVersion?.content
										})
									})]
								}),
								viewingVersion?.tags && viewingVersion.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-medium text-foreground",
										children: "Tags"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: viewingVersion.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "secondary",
											children: tag
										}, tag))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "inline-block h-4 w-4 mr-1" }),
										"Created on",
										" ",
										viewingVersion && format(new Date(viewingVersion.created_at), "MMMM d, yyyy 'at' h:mm a")
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-2 pt-4 border-t",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => setViewingVersion(null),
								children: "Close"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => {
									setViewingVersion(null);
									setRestoringVersion(viewingVersion);
								},
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4" }), "Restore This Version"]
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
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
			})
		]
	});
}
var SplitComponent = VersionHistory;
//#endregion
export { SplitComponent as component };
