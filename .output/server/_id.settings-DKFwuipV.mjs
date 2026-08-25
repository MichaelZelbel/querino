import { a as __toESM } from "./_runtime.mjs";
import { E as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./_ssr/card-4AsKRAzx.mjs";
import { t as Button } from "./_ssr/button-DfDjtN4g.mjs";
import { t as Input } from "./_ssr/input-DZABqqwC.mjs";
import { t as Label } from "./_ssr/label-DBD1bRRP.mjs";
import { F as Shield, Hn as Activity, Vn as ArrowLeft, b as Trash2, c as UserPlus, cn as Copy, gt as LoaderCircle, on as Crown, s as User, xt as Link } from "./_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./_ssr/select-Byrv14ho.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { a as useAuthContext, c as useParams$1, n as Link$1, s as useNavigate$1 } from "./_ssr/router-compat-xSZ_AoUj.mjs";
import { a as useCurrentUserTeamRole, c as useTeam, d as useUpdateTeamMemberRole, l as useTeamMembers, n as AvatarFallback, o as useDeleteTeam, r as AvatarImage, s as useRemoveTeamMember, t as Avatar, u as useUpdateTeam } from "./_ssr/avatar-CLMN7E0g.mjs";
import { n as format } from "./_libs/date-fns.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, l as AlertDialogTrigger, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./_ssr/alert-dialog-Dt930TVg.mjs";
import { t as Separator } from "./_ssr/separator-B3hsz7IR.mjs";
import { a as useTeamInvites, i as useRevokeTeamInvite, r as useCreateTeamInvite, t as inviteUrl } from "./_ssr/useTeamInvites-B6EE7bcl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_id.settings-DKFwuipV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TeamSettings() {
	const { id: teamId } = useParams$1();
	const navigate = useNavigate$1();
	const { user } = useAuthContext();
	const { data: team, isLoading: teamLoading } = useTeam(teamId);
	const { data: members = [], isLoading: membersLoading } = useTeamMembers(teamId);
	const { data: userRole } = useCurrentUserTeamRole(teamId);
	const updateTeam = useUpdateTeam();
	const deleteTeam = useDeleteTeam();
	const updateMemberRole = useUpdateTeamMemberRole();
	const removeMember = useRemoveTeamMember();
	const { data: invites = [] } = useTeamInvites(teamId);
	const createInvite = useCreateTeamInvite();
	const revokeInvite = useRevokeTeamInvite();
	const [teamName, setTeamName] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (team) setTeamName(team.name);
	}, [team]);
	const canManage = userRole === "owner" || userRole === "admin";
	const isOwner = userRole === "owner";
	if (!user) {
		navigate("/auth?redirect=/team/" + teamId + "/settings");
		return null;
	}
	if (teamLoading || membersLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "container max-w-4xl py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "animate-pulse space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-48 bg-muted rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 bg-muted rounded" })]
		})
	});
	if (!team) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "container max-w-4xl py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted-foreground",
			children: "Team not found or you don't have access."
		})
	});
	if (!canManage) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "container max-w-4xl py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted-foreground",
			children: "You don't have permission to manage this team."
		})
	});
	const handleSaveSettings = async () => {
		try {
			await updateTeam.mutateAsync({
				teamId: team.id,
				updates: { name: teamName || team.name }
			});
			toast.success("Team settings saved");
		} catch (error) {
			toast.error("Failed to save settings");
		}
	};
	const handleCreateInvite = async () => {
		if (!user || !team) return;
		try {
			const invite = await createInvite.mutateAsync({
				teamId: team.id,
				userId: user.id
			});
			await navigator.clipboard.writeText(inviteUrl(invite.token)).catch(() => {});
			toast.success("Invite link created and copied to clipboard");
		} catch (error) {
			console.error("Error creating invite:", error);
			toast.error("Failed to create invite link");
		}
	};
	const handleCopyInvite = async (token) => {
		try {
			await navigator.clipboard.writeText(inviteUrl(token));
			toast.success("Invite link copied");
		} catch {
			toast.error("Failed to copy link");
		}
	};
	const handleRevokeInvite = async (inviteId) => {
		if (!team) return;
		try {
			await revokeInvite.mutateAsync({
				inviteId,
				teamId: team.id
			});
			toast.success("Invite revoked");
		} catch {
			toast.error("Failed to revoke invite");
		}
	};
	const handleDeleteTeam = async () => {
		try {
			await deleteTeam.mutateAsync(team.id);
			toast.success("Team deleted");
			navigate("/library");
		} catch (error) {
			toast.error("Failed to delete team");
		}
	};
	const handleRoleChange = async (memberId, newRole) => {
		try {
			await updateMemberRole.mutateAsync({
				memberId,
				role: newRole
			});
			toast.success("Role updated");
		} catch (error) {
			toast.error("Failed to update role");
		}
	};
	const handleRemoveMember = async (memberId) => {
		try {
			await removeMember.mutateAsync(memberId);
			toast.success("Member removed");
		} catch (error) {
			toast.error("Failed to remove member");
		}
	};
	const getRoleIcon = (role) => {
		switch (role) {
			case "owner": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-4 w-4 text-yellow-500" });
			case "admin": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-4 w-4 text-blue-500" });
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4 text-muted-foreground" });
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "container max-w-4xl py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				onClick: () => navigate(-1),
				className: "mb-6 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold",
					children: "Team Settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
					to: `/team/${teamId}/activity`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4 w-4" }), "View Activity"]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Team Information" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Basic settings for your team" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "team-name",
								children: "Team Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "team-name",
								value: teamName,
								onChange: (e) => setTeamName(e.target.value)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleSaveSettings,
							disabled: updateTeam.isPending,
							children: updateTeam.isPending ? "Saving..." : "Save Changes"
						})]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Team Members" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Manage who has access to this team" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [
							members.map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between py-3 border-b last:border-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
										className: "h-10 w-10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: member.profile?.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, { children: member.profile?.display_name?.charAt(0).toUpperCase() || "U" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: member.profile?.display_name || "Unknown User"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted-foreground capitalize flex items-center gap-1",
										children: [getRoleIcon(member.role), member.role]
									})] })]
								}), member.role !== "owner" && isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: member.role,
										onValueChange: (value) => handleRoleChange(member.id, value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "w-28",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "admin",
											children: "Admin"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "member",
											children: "Member"
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										onClick: () => handleRemoveMember(member.id),
										"aria-label": "Remove member",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
									})]
								})]
							}, member.id)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm font-medium text-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "h-4 w-4 inline mr-2" }), "Invite members with a link"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											onClick: handleCreateInvite,
											disabled: createInvite.isPending,
											className: "gap-2",
											children: [createInvite.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { className: "h-4 w-4" }), "Create invite link"]
										})
									}),
									invites.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2",
										children: invites.map((invite) => {
											const expired = new Date(invite.expires_at) < /* @__PURE__ */ new Date();
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 rounded-lg border border-border p-2 text-sm",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
														className: "min-w-0 flex-1 truncate bg-muted px-2 py-1 rounded text-xs",
														children: inviteUrl(invite.token)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "shrink-0 text-xs text-muted-foreground",
														children: [expired ? "Expired" : `Expires ${format(new Date(invite.expires_at), "MMM d")}`, invite.used_count > 0 && ` · ${invite.used_count} joined`]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-7 w-7 shrink-0",
														onClick: () => handleCopyInvite(invite.token),
														"aria-label": "Copy invite link",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-7 w-7 shrink-0",
														onClick: () => handleRevokeInvite(invite.id),
														"aria-label": "Revoke invite",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5 text-destructive" })
													})
												]
											}, invite.id);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Anyone with a link can join as a member until it expires (14 days) or is revoked."
									})
								]
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "GitHub Sync" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Sync team artifacts to a shared GitHub repository" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [
							team.github_repo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [
									"Syncing to ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: team.github_repo }),
									" (",
									team.github_branch || "main",
									team.github_folder ? `, /${team.github_folder}` : "",
									")."
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "No repository configured yet."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Configure the repository, access token, and test the connection in Settings while this team's workspace is active. Trigger syncs from the Library's \"Sync to GitHub\" button."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: "/settings",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									children: "Open GitHub Sync Settings"
								})
							})
						]
					})] }),
					isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "border-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-destructive",
							children: "Danger Zone"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Irreversible actions for this team" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "destructive",
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), "Delete Team"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete Team?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									"This will permanently delete the team",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-medium text-foreground",
										children: [
											"\"",
											team.name,
											"\""
										]
									}),
									". This action cannot be undone."
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "list-disc pl-5 text-sm text-muted-foreground space-y-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "All members will be removed from the team" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Pending invitations and join requests will be cancelled" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Team activity feed and shared pins will be deleted" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Artifacts created in this team workspace will remain in their authors' personal libraries, but will no longer be shared with other team members" })
									]
								})]
							})
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
							onClick: handleDeleteTeam,
							className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
							children: "Delete Team"
						})] })] })] }) })]
					})
				]
			})
		]
	});
}
var SplitComponent = TeamSettings;
//#endregion
export { SplitComponent as component };
