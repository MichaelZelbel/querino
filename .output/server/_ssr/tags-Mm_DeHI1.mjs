import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DReQYbEM.mjs";
import { J as Plus, b as Trash2, et as Pencil, gt as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { t as BlogAdminLayout } from "./BlogAdminLayout-CYRbvoqv.mjs";
import { i as useUpdateBlogTag, n as useCreateBlogTag, r as useDeleteBlogTag, t as useBlogTags } from "./useBlogTags-Dgvq7xq-.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tags-Mm_DeHI1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BlogAdminTags() {
	const { data: tags, isLoading } = useBlogTags();
	const createMutation = useCreateBlogTag();
	const updateMutation = useUpdateBlogTag();
	const deleteMutation = useDeleteBlogTag();
	const [editingTag, setEditingTag] = (0, import_react.useState)(null);
	const [isDialogOpen, setIsDialogOpen] = (0, import_react.useState)(false);
	const [deleteId, setDeleteId] = (0, import_react.useState)(null);
	const [tagName, setTagName] = (0, import_react.useState)("");
	const openNewDialog = () => {
		setEditingTag(null);
		setTagName("");
		setIsDialogOpen(true);
	};
	const openEditDialog = (tag) => {
		setEditingTag(tag);
		setTagName(tag.name);
		setIsDialogOpen(true);
	};
	const handleSave = async () => {
		if (!tagName.trim()) return;
		if (editingTag) await updateMutation.mutateAsync({
			id: editingTag.id,
			data: { name: tagName }
		});
		else await createMutation.mutateAsync({ name: tagName });
		setIsDialogOpen(false);
	};
	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
			setDeleteId(null);
		}
	};
	const isSaving = createMutation.isPending || updateMutation.isPending;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlogAdminLayout, {
		title: "Tags",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: openNewDialog,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }), "Add Tag"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-lg border border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Slug" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
						className: "text-center",
						children: "Posts"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "w-[100px]" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 4,
					className: "text-center py-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin mx-auto text-muted-foreground" })
				}) }) : tags && tags.length > 0 ? tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "font-medium",
						children: tag.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-muted-foreground",
						children: tag.slug
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						className: "text-center",
						children: tag.post_count
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "h-8 w-8",
							onClick: () => openEditDialog(tag),
							"aria-label": "Edit tag",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "h-8 w-8 text-destructive hover:text-destructive",
							onClick: () => setDeleteId(tag.id),
							"aria-label": "Delete tag",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
						})]
					}) })
				] }, tag.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 4,
					className: "text-center py-8 text-muted-foreground",
					children: "No tags yet. Click \"Add Tag\" to create one."
				}) }) })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isDialogOpen,
				onOpenChange: setIsDialogOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingTag ? "Edit Tag" : "New Tag" }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-4 py-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "name",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "name",
								value: tagName,
								onChange: (e) => setTagName(e.target.value),
								placeholder: "Tag name",
								onKeyDown: (e) => e.key === "Enter" && handleSave()
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setIsDialogOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: handleSave,
						disabled: !tagName.trim() || isSaving,
						children: [isSaving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }), editingTag ? "Update" : "Create"]
					})] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: !!deleteId,
				onOpenChange: () => setDeleteId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete Tag" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "Are you sure you want to delete this tag? Posts with this tag will not be deleted." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: handleDelete,
					className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
					children: "Delete"
				})] })] })
			})
		]
	});
}
var SplitComponent = BlogAdminTags;
//#endregion
export { SplitComponent as component };
