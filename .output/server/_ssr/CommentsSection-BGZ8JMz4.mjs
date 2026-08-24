import { o as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { b as Trash2, dt as MessageCircle, et as Pencil, kn as Check, lt as MessageSquare, n as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useAuth, n as Link$1, o as useLocation$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
import { t as moderateContent } from "./moderateContent-Dd1HYPU1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/CommentsSection-BGZ8JMz4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var listeners = [];
var triggerNotification = (type, payload) => {
	listeners.forEach((listener) => listener(type, payload));
};
var useComments = (itemType, itemId) => {
	const { user } = useAuth();
	const [comments, setComments] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const fetchComments = (0, import_react.useCallback)(async () => {
		if (!itemId) return;
		setLoading(true);
		setError(null);
		try {
			const { data, error: fetchError } = await supabase.from("comments").select(`
          *,
          author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
        `).eq("item_type", itemType).eq("item_id", itemId).order("created_at", { ascending: true });
			if (fetchError) throw fetchError;
			const commentMap = /* @__PURE__ */ new Map();
			const rootComments = [];
			(data || []).forEach((comment) => {
				const formattedComment = {
					...comment,
					author: comment.author,
					replies: []
				};
				commentMap.set(comment.id, formattedComment);
			});
			commentMap.forEach((comment) => {
				if (comment.parent_id && commentMap.has(comment.parent_id)) commentMap.get(comment.parent_id).replies.push(comment);
				else if (!comment.parent_id) rootComments.push(comment);
			});
			setComments(rootComments);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [itemType, itemId]);
	(0, import_react.useEffect)(() => {
		fetchComments();
	}, [fetchComments]);
	const createComment = async (content, parentId) => {
		if (!user) throw new Error("Must be logged in to comment");
		const { data, error: createError } = await supabase.from("comments").insert({
			user_id: user.id,
			item_type: itemType,
			item_id: itemId,
			parent_id: parentId || null,
			content
		}).select(`
        *,
        author:profiles!comments_user_id_fkey(id, display_name, avatar_url)
      `).single();
		if (createError) throw createError;
		await supabase.from("activity_events").insert({
			actor_id: user.id,
			action: "comment",
			item_type: itemType,
			item_id: itemId,
			metadata: {
				commentId: data.id,
				parentId: parentId || null
			}
		});
		triggerNotification("new-comment", {
			itemType,
			itemId,
			commentId: data.id,
			parentId
		});
		await fetchComments();
		return data;
	};
	const editComment = async (commentId, content) => {
		if (!user) throw new Error("Must be logged in to edit");
		const { error: updateError } = await supabase.from("comments").update({ content }).eq("id", commentId).eq("user_id", user.id);
		if (updateError) throw updateError;
		await supabase.from("activity_events").insert({
			actor_id: user.id,
			action: "comment_edit",
			item_type: itemType,
			item_id: itemId,
			metadata: { commentId }
		});
		triggerNotification("comment-edit", {
			itemType,
			itemId,
			commentId
		});
		await fetchComments();
	};
	const deleteComment = async (commentId) => {
		if (!user) throw new Error("Must be logged in to delete");
		const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);
		if (deleteError) throw deleteError;
		await supabase.from("activity_events").insert({
			actor_id: user.id,
			action: "comment_delete",
			item_type: itemType,
			item_id: itemId,
			metadata: { commentId }
		});
		triggerNotification("comment-delete", {
			itemType,
			itemId,
			commentId
		});
		await fetchComments();
	};
	return {
		comments,
		loading,
		error,
		totalCount: comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0),
		createComment,
		editComment,
		deleteComment,
		refetch: fetchComments
	};
};
var CommentItem = ({ comment, onReply, onEdit, onDelete, isReply = false }) => {
	const { user } = useAuth();
	const [isReplying, setIsReplying] = (0, import_react.useState)(false);
	const [isEditing, setIsEditing] = (0, import_react.useState)(false);
	const [replyContent, setReplyContent] = (0, import_react.useState)("");
	const [editContent, setEditContent] = (0, import_react.useState)(comment.content);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [showDeleteDialog, setShowDeleteDialog] = (0, import_react.useState)(false);
	const isOwner = user?.id === comment.user_id;
	const displayName = comment.author?.display_name || "Anonymous";
	const initials = displayName.slice(0, 2).toUpperCase();
	const handleReply = async () => {
		if (!replyContent.trim()) return;
		setLoading(true);
		try {
			await onReply(comment.id, replyContent);
			setReplyContent("");
			setIsReplying(false);
		} finally {
			setLoading(false);
		}
	};
	const handleEdit = async () => {
		if (!editContent.trim()) return;
		setLoading(true);
		try {
			await onEdit(comment.id, editContent);
			setIsEditing(false);
		} finally {
			setLoading(false);
		}
	};
	const handleDeleteClick = () => {
		setShowDeleteDialog(true);
	};
	const handleConfirmDelete = async () => {
		setShowDeleteDialog(false);
		setLoading(true);
		try {
			await onDelete(comment.id);
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${isReply ? "ml-8 pl-4 border-l border-border" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
					to: `/u/${comment.author?.display_name || comment.user_id}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
						className: "h-8 w-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: comment.author?.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
							className: "text-xs",
							children: initials
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 flex-wrap",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: `/u/${comment.author?.display_name || comment.user_id}`,
									className: "font-medium text-sm hover:underline",
									children: displayName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
								}),
								comment.edited && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "(edited)"
								})
							]
						}),
						isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: editContent,
								onChange: (e) => setEditContent(e.target.value),
								className: "min-h-[80px]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									onClick: handleEdit,
									disabled: loading,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 mr-1" }), " Save"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => setIsEditing(false),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3 mr-1" }), " Cancel"]
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm whitespace-pre-wrap",
							children: comment.content
						}),
						!isEditing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mt-2",
							children: [user && !isReply && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-7 text-xs",
								onClick: () => setIsReplying(!isReplying),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3 w-3 mr-1" }), " Reply"]
							}), isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-7 text-xs",
								onClick: () => setIsEditing(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3 w-3 mr-1" }), " Edit"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-7 text-xs text-destructive hover:text-destructive",
								onClick: handleDeleteClick,
								disabled: loading,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3 mr-1" }), " Delete"]
							})] })]
						}),
						isReplying && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								placeholder: "Write a reply...",
								value: replyContent,
								onChange: (e) => setReplyContent(e.target.value),
								className: "min-h-[80px]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									onClick: handleReply,
									disabled: loading || !replyContent.trim(),
									children: "Reply"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => setIsReplying(false),
									children: "Cancel"
								})]
							})]
						})
					]
				})]
			}),
			comment.replies && comment.replies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-0",
				children: comment.replies.map((reply) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentItem, {
					comment: reply,
					onReply,
					onEdit,
					onDelete,
					isReply: true
				}, reply.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: showDeleteDialog,
				onOpenChange: setShowDeleteDialog,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete comment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This will permanently delete your comment. This action cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: handleConfirmDelete,
					className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
					children: "Delete comment"
				})] })] })
			})
		]
	});
};
var CommentsSection = ({ itemType, itemId, teamId }) => {
	const { pathname } = useLocation$1();
	const { user } = useAuth();
	const { comments, loading, error, totalCount, createComment, editComment, deleteComment } = useComments(itemType, itemId);
	const [newComment, setNewComment] = (0, import_react.useState)("");
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	if (teamId && !user) return null;
	const handleSubmit = async () => {
		if (!newComment.trim()) return;
		setSubmitting(true);
		try {
			const modResult = await moderateContent({ content: newComment }, "comment", "comment", itemId);
			if (!modResult.approved) {
				toast.error(modResult.reason || "Your comment could not be posted. It appears to violate our Community Guidelines.");
				return;
			}
			await createComment(newComment);
			setNewComment("");
			toast.success("Comment posted");
		} catch (err) {
			toast.error(err.message || "Failed to post comment");
		} finally {
			setSubmitting(false);
		}
	};
	const handleReply = async (parentId, content) => {
		try {
			const modResult = await moderateContent({ content }, "comment", "comment", itemId);
			if (!modResult.approved) {
				toast.error(modResult.reason || "Your reply could not be posted. It appears to violate our Community Guidelines.");
				return;
			}
			await createComment(content, parentId);
			toast.success("Reply posted");
		} catch (err) {
			toast.error(err.message || "Failed to post reply");
		}
	};
	const handleEdit = async (commentId, content) => {
		try {
			await editComment(commentId, content);
			toast.success("Comment updated");
		} catch (err) {
			toast.error(err.message || "Failed to update comment");
		}
	};
	const handleDelete = async (commentId) => {
		try {
			await deleteComment(commentId);
			toast.success("Comment deleted");
		} catch (err) {
			toast.error(err.message || "Failed to delete comment");
		}
	};
	if (error) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-12 border-t pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-5 w-5" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-semibold",
						children: "Discussion"
					}),
					totalCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm text-muted-foreground",
						children: [
							"(",
							totalCount,
							")"
						]
					})
				]
			}),
			user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					placeholder: "Share your thoughts...",
					value: newComment,
					onChange: (e) => setNewComment(e.target.value),
					className: "min-h-[100px]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: handleSubmit,
					disabled: submitting || !newComment.trim(),
					children: submitting ? "Posting..." : "Post Comment"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-6 p-4 bg-muted/50 rounded-lg text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: `/auth?redirect=${encodeURIComponent(pathname)}`,
							className: "text-primary hover:underline",
							children: "Sign in"
						}),
						" ",
						"to join the discussion"
					]
				})
			}),
			loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: [
					1,
					2,
					3
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-8 rounded-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-24" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-16 w-full" })]
					})]
				}, i))
			}),
			!loading && comments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground text-center py-8",
				children: "No comments yet — be the first to start a discussion!"
			}),
			!loading && comments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "divide-y",
				children: comments.map((comment) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommentItem, {
					comment,
					onReply: handleReply,
					onEdit: handleEdit,
					onDelete: handleDelete
				}, comment.id))
			})
		]
	});
};
//#endregion
export { CommentsSection as t };
