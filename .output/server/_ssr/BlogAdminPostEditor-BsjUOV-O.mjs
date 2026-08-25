import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { V as Save, Vn as ArrowLeft, bn as Circle, en as Eye, gt as LoaderCircle, kn as Check, wn as CircleAlert } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Byrv14ho.mjs";
import { c as useParams$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./tabs-B4ZFfXyf.mjs";
import { t as BlogAdminLayout } from "./BlogAdminLayout-CYRbvoqv.mjs";
import { t as useBlogCategories } from "./useBlogCategories-b1x0Bn4Y.mjs";
import { a as useUpdateBlogPost, r as useCreateBlogPost, t as useBlogPost } from "./useBlogPosts-1T2HoEIA.mjs";
import { t as useBlogTags } from "./useBlogTags-Dgvq7xq-.mjs";
import { t as Checkbox } from "./checkbox-B00mezr5.mjs";
import { t as Markdown } from "../_libs/react-markdown+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BlogAdminPostEditor-BsjUOV-O.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function deepEqual(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (typeof a !== "object" || a === null || b === null) return false;
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;
	for (const key of keysA) {
		if (!keysB.includes(key)) return false;
		if (!deepEqual(a[key], b[key])) return false;
	}
	return true;
}
function useAutosave({ data, onSave, delay = 2e3, enabled = true }) {
	const [status, setStatus] = (0, import_react.useState)("saved");
	const [lastSaved, setLastSaved] = (0, import_react.useState)(null);
	const timeoutRef = (0, import_react.useRef)(null);
	const isSavingRef = (0, import_react.useRef)(false);
	const pendingDataRef = (0, import_react.useRef)(null);
	const hasChanges = lastSaved !== null && !deepEqual(data, lastSaved);
	const performSave = (0, import_react.useCallback)(async (dataToSave) => {
		if (isSavingRef.current) {
			pendingDataRef.current = dataToSave;
			return;
		}
		isSavingRef.current = true;
		setStatus("saving");
		try {
			await onSave(dataToSave);
			setLastSaved(dataToSave);
			setStatus("saved");
			if (pendingDataRef.current && !deepEqual(pendingDataRef.current, dataToSave)) {
				const pendingData = pendingDataRef.current;
				pendingDataRef.current = null;
				isSavingRef.current = false;
				await performSave(pendingData);
				return;
			}
		} catch (error) {
			console.error("Autosave error:", error);
			setStatus("error");
		} finally {
			isSavingRef.current = false;
			pendingDataRef.current = null;
		}
	}, [onSave]);
	const forceSave = (0, import_react.useCallback)(async () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		await performSave(data);
	}, [data, performSave]);
	const resetLastSaved = (0, import_react.useCallback)((newData) => {
		setLastSaved(newData);
		setStatus("saved");
	}, []);
	(0, import_react.useEffect)(() => {
		if (!enabled || lastSaved === null) return;
		if (deepEqual(data, lastSaved)) return;
		setStatus("unsaved");
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			performSave(data);
		}, delay);
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [
		data,
		lastSaved,
		delay,
		enabled,
		performSave
	]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);
	return {
		status,
		lastSaved,
		hasChanges,
		resetLastSaved,
		forceSave
	};
}
function AutosaveIndicator({ status }) {
	const config = {
		saved: {
			icon: Check,
			text: "Saved",
			className: "text-green-600 dark:text-green-400"
		},
		saving: {
			icon: LoaderCircle,
			text: "Saving…",
			className: "text-muted-foreground",
			animate: true
		},
		unsaved: {
			icon: Circle,
			text: "Unsaved changes",
			className: "text-amber-600 dark:text-amber-400"
		},
		error: {
			icon: CircleAlert,
			text: "Save failed",
			className: "text-destructive"
		}
	}[status];
	const Icon = config.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex items-center gap-1.5 text-xs ${config.className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `h-3.5 w-3.5 ${config.animate ? "animate-spin" : ""}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: config.text })]
	});
}
function generateSlug(title) {
	return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}
function BlogAdminPostEditor() {
	const { id } = useParams$1();
	const navigate = useNavigate$1();
	const isNew = !id || id === "new";
	const { data: post, isLoading: postLoading } = useBlogPost(id || "");
	const { data: categories } = useBlogCategories();
	const { data: tags } = useBlogTags();
	const createMutation = useCreateBlogPost();
	const updateMutation = useUpdateBlogPost();
	const [formData, setFormData] = (0, import_react.useState)({
		title: "",
		slug: "",
		content: "",
		excerpt: "",
		status: "draft",
		published_at: null,
		featured_image_id: null,
		seo_title: "",
		seo_description: "",
		og_image_url: "",
		category_ids: [],
		tag_ids: []
	});
	const [slugManuallyEdited, setSlugManuallyEdited] = (0, import_react.useState)(false);
	const [previewTab, setPreviewTab] = (0, import_react.useState)("edit");
	(0, import_react.useEffect)(() => {
		if (post && !isNew) {
			setFormData({
				title: post.title,
				slug: post.slug,
				content: post.content || "",
				excerpt: post.excerpt || "",
				status: post.status,
				published_at: post.published_at,
				featured_image_id: post.featured_image_id,
				seo_title: post.seo_title || "",
				seo_description: post.seo_description || "",
				og_image_url: post.og_image_url || "",
				category_ids: post.categories?.map((c) => c.id) || [],
				tag_ids: post.tags?.map((t) => t.id) || []
			});
			setSlugManuallyEdited(true);
		}
	}, [post, isNew]);
	(0, import_react.useEffect)(() => {
		if (!slugManuallyEdited && formData.title) setFormData((prev) => ({
			...prev,
			slug: generateSlug(prev.title)
		}));
	}, [formData.title, slugManuallyEdited]);
	const autosaveData = (0, import_react.useMemo)(() => formData, [formData]);
	const { status: autosaveStatus, resetLastSaved } = useAutosave({
		data: autosaveData,
		onSave: async (data) => {
			if (!isNew && post && data.status === "draft") await updateMutation.mutateAsync({
				id: post.id,
				data
			});
		},
		delay: 3e3,
		enabled: !isNew && formData.status === "draft"
	});
	(0, import_react.useEffect)(() => {
		if (post && !isNew) resetLastSaved(autosaveData);
	}, [post, isNew]);
	const handleSave = async (newStatus) => {
		const dataToSave = {
			...formData,
			status: newStatus || formData.status,
			published_at: newStatus === "published" ? (/* @__PURE__ */ new Date()).toISOString() : formData.published_at
		};
		if (isNew) {
			const result = await createMutation.mutateAsync(dataToSave);
			if (result) navigate(`/blog/admin/posts/${result.id}/edit`);
		} else if (id) await updateMutation.mutateAsync({
			id,
			data: dataToSave
		});
	};
	const updateField = (key, value) => {
		setFormData((prev) => ({
			...prev,
			[key]: value
		}));
	};
	const toggleCategory = (catId) => {
		setFormData((prev) => ({
			...prev,
			category_ids: prev.category_ids.includes(catId) ? prev.category_ids.filter((id) => id !== catId) : [...prev.category_ids, catId]
		}));
	};
	const toggleTag = (tagId) => {
		setFormData((prev) => ({
			...prev,
			tag_ids: prev.tag_ids.includes(tagId) ? prev.tag_ids.filter((id) => id !== tagId) : [...prev.tag_ids, tagId]
		}));
	};
	if (postLoading && !isNew) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogAdminLayout, {
		title: "Loading...",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center py-12",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
		})
	});
	const isSaving = createMutation.isPending || updateMutation.isPending;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogAdminLayout, {
		title: isNew ? "New Post" : "Edit Post",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [
				!isNew && formData.status === "draft" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutosaveIndicator, { status: autosaveStatus }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: () => navigate("/blog/admin/posts"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"]
				}),
				formData.status !== "published" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: () => handleSave("draft"),
					disabled: isSaving,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4 mr-2" }), "Save Draft"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => handleSave("published"),
					disabled: isSaving,
					children: [isSaving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }), formData.status === "published" ? "Update" : "Publish"]
				})
			]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-2 space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "title",
							children: "Title"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "title",
							value: formData.title,
							onChange: (e) => updateField("title", e.target.value),
							placeholder: "Enter post title...",
							className: "text-lg"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "slug",
							children: "Slug"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex items-center text-sm text-muted-foreground",
								children: "/blog/"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "slug",
								value: formData.slug,
								onChange: (e) => {
									setSlugManuallyEdited(true);
									updateField("slug", e.target.value);
								},
								placeholder: "post-slug"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Content" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
								value: previewTab,
								onValueChange: (v) => setPreviewTab(v),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "h-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
										value: "edit",
										className: "text-xs px-3",
										children: "Edit"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
										value: "preview",
										className: "text-xs px-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3 mr-1" }), "Preview"]
									})]
								})
							})]
						}), previewTab === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: formData.content,
							onChange: (e) => updateField("content", e.target.value),
							placeholder: "Write your content in Markdown...",
							className: "min-h-[400px] font-mono text-sm"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-h-[400px] p-4 border border-input rounded-md bg-background prose prose-sm dark:prose-invert max-w-none",
							children: formData.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { children: formData.content }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground",
								children: "Nothing to preview yet..."
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "excerpt",
							children: "Excerpt"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "excerpt",
							value: formData.excerpt,
							onChange: (e) => updateField("excerpt", e.target.value),
							placeholder: "Brief summary of the post...",
							className: "min-h-[80px]"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-sm",
							children: "Publish"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: formData.status,
								onValueChange: (v) => updateField("status", v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "draft",
										children: "Draft"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "published",
										children: "Published"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "scheduled",
										children: "Scheduled"
									})
								] })]
							})]
						}), formData.status === "scheduled" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Publish Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "datetime-local",
								value: formData.published_at?.slice(0, 16) || "",
								onChange: (e) => updateField("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)
							})]
						})]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-sm",
							children: "Categories"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: categories && categories.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2 max-h-[200px] overflow-y-auto",
						children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
								id: `cat-${cat.id}`,
								checked: formData.category_ids.includes(cat.id),
								onCheckedChange: () => toggleCategory(cat.id)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: `cat-${cat.id}`,
								className: "text-sm cursor-pointer",
								children: cat.name
							})]
						}, cat.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No categories yet."
					}) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-sm",
							children: "Tags"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: tags && tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggleTag(tag.id),
							className: `px-2 py-1 text-xs rounded-full border transition-colors ${formData.tag_ids.includes(tag.id) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`,
							children: tag.name
						}, tag.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No tags yet."
					}) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-sm",
							children: "SEO"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "seo_title",
										children: "SEO Title"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "seo_title",
										value: formData.seo_title,
										onChange: (e) => updateField("seo_title", e.target.value),
										placeholder: formData.title || "SEO title..."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [(formData.seo_title || formData.title).length, "/60 characters"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "seo_description",
										children: "Meta Description"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "seo_description",
										value: formData.seo_description,
										onChange: (e) => updateField("seo_description", e.target.value),
										placeholder: "Brief description for search engines...",
										className: "min-h-[60px]"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [formData.seo_description.length, "/160 characters"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "og_image_url",
									children: "OG Image URL"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "og_image_url",
									value: formData.og_image_url,
									onChange: (e) => updateField("og_image_url", e.target.value),
									placeholder: "https://..."
								})]
							})
						]
					})] })
				]
			})]
		})
	});
}
//#endregion
export { BlogAdminPostEditor as t };
