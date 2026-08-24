import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { Mt as Image, b as Trash2, cn as Copy, et as Pencil, gt as LoaderCircle, kn as Check, u as Upload } from "../_libs/lucide-react.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-s-1huv4W.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as formatDistanceToNow } from "../_libs/date-fns.mjs";
import { t as BlogAdminLayout } from "./BlogAdminLayout-CYRbvoqv.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-Dt930TVg.mjs";
import { i as useUploadBlogMedia, n as useDeleteBlogMedia, r as useUpdateBlogMedia, t as useBlogMedia } from "./useBlogMedia-BH2C2dqg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/media-DgzhIXp3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatFileSize(bytes) {
	if (!bytes) return "—";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}
function BlogAdminMedia() {
	const { data: media, isLoading } = useBlogMedia();
	const uploadMutation = useUploadBlogMedia();
	const updateMutation = useUpdateBlogMedia();
	const deleteMutation = useDeleteBlogMedia();
	const fileInputRef = (0, import_react.useRef)(null);
	const [editingMedia, setEditingMedia] = (0, import_react.useState)(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = (0, import_react.useState)(false);
	const [deleteId, setDeleteId] = (0, import_react.useState)(null);
	const [altText, setAltText] = (0, import_react.useState)("");
	const [copiedId, setCopiedId] = (0, import_react.useState)(null);
	const handleFileChange = async (e) => {
		const files = e.target.files;
		if (!files?.length) return;
		for (const file of Array.from(files)) await uploadMutation.mutateAsync(file);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	const openEditDialog = (item) => {
		setEditingMedia(item);
		setAltText(item.alt_text || "");
		setIsEditDialogOpen(true);
	};
	const handleUpdate = async () => {
		if (!editingMedia) return;
		await updateMutation.mutateAsync({
			id: editingMedia.id,
			data: { alt_text: altText }
		});
		setIsEditDialogOpen(false);
	};
	const handleDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
			setDeleteId(null);
		}
	};
	const copyUrl = (url, id) => {
		navigator.clipboard.writeText(url);
		setCopiedId(id);
		toast.success("URL copied to clipboard");
		setTimeout(() => setCopiedId(null), 2e3);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BlogAdminLayout, {
		title: "Media Library",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: fileInputRef,
			type: "file",
			accept: "image/*",
			multiple: true,
			className: "hidden",
			onChange: handleFileChange
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: () => fileInputRef.current?.click(),
			disabled: uploadMutation.isPending,
			children: [uploadMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4 mr-2" }), "Upload"]
		})] }),
		children: [
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-center py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
			}) : media && media.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
				children: media.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "group relative bg-card border border-border rounded-lg overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "aspect-square bg-muted flex items-center justify-center",
							children: item.mime_type?.startsWith("image/") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: item.url,
								alt: item.alt_text || "",
								className: "w-full h-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-8 w-8 text-muted-foreground" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "secondary",
									className: "h-8 w-8",
									onClick: () => copyUrl(item.url, item.id),
									"aria-label": copiedId === item.id ? "Copied" : "Copy URL",
									children: copiedId === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "secondary",
									className: "h-8 w-8",
									onClick: () => openEditDialog(item),
									"aria-label": "Edit media",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "destructive",
									className: "h-8 w-8",
									onClick: () => setDeleteId(item.id),
									"aria-label": "Delete media",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground truncate",
								children: item.alt_text || "No alt text"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									item.width && item.height ? `${item.width}×${item.height}` : "—",
									" ",
									"• ",
									formatFileSize(item.file_size)
								]
							})]
						})
					]
				}, item.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center py-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground mb-4",
						children: "No media uploaded yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => fileInputRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4 mr-2" }), "Upload Images"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: isEditDialogOpen,
				onOpenChange: setIsEditDialogOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Media" }) }),
					editingMedia && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 py-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "aspect-video bg-muted rounded-lg overflow-hidden",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: editingMedia.url,
									alt: editingMedia.alt_text || "",
									className: "w-full h-full object-contain"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "alt",
									children: "Alt Text"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "alt",
									value: altText,
									onChange: (e) => setAltText(e.target.value),
									placeholder: "Describe this image..."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1 text-sm text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Size: ", formatFileSize(editingMedia.file_size)] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Dimensions: ",
										editingMedia.width,
										"×",
										editingMedia.height
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Uploaded:",
										" ",
										formatDistanceToNow(new Date(editingMedia.created_at), { addSuffix: true })
									] })
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => setIsEditDialogOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: handleUpdate,
						disabled: updateMutation.isPending,
						children: [updateMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }), "Save"]
					})] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: !!deleteId,
				onOpenChange: () => setDeleteId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Delete Media" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "Are you sure you want to delete this file? This action cannot be undone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: handleDelete,
					className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
					children: "Delete"
				})] })] })
			})
		]
	});
}
var SplitComponent = BlogAdminMedia;
//#endregion
export { SplitComponent as component };
