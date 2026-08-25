import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Skeleton } from "./skeleton-cOr9hq3l.mjs";
import { Ut as Globe, V as Save, Vn as ArrowLeft, Wt as Github, _ as Twitter, gt as LoaderCircle, s as User, u as Upload } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useAuthContext, n as Link$1, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { n as useUnsavedChanges, t as SaveStateBadge } from "./SaveStateBadge-xDjAgC9q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/edit-Cf55tmDc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EditProfile() {
	const navigate = useNavigate$1();
	const { user, profile, loading: authLoading } = useAuthContext();
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const fileInputRef = (0, import_react.useRef)(null);
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [avatarUrl, setAvatarUrl] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	const [website, setWebsite] = (0, import_react.useState)("");
	const [twitter, setTwitter] = (0, import_react.useState)("");
	const [github, setGithub] = (0, import_react.useState)("");
	const { isDirty, savedAt, markSaved } = useUnsavedChanges({
		data: {
			displayName,
			avatarUrl,
			bio,
			website,
			twitter,
			github
		},
		isSaving: saving,
		onSave: () => handleSave()
	});
	(0, import_react.useEffect)(() => {
		if (!authLoading && !user) {
			navigate("/auth?redirect=/profile/edit");
			return;
		}
		if (user) loadProfile();
	}, [user, authLoading]);
	async function loadProfile() {
		try {
			const { data, error } = await supabase.from("profiles").select("display_name, avatar_url, bio, website, twitter, github").eq("id", user.id).maybeSingle();
			if (error) throw error;
			if (data) {
				setDisplayName(data.display_name || "");
				setAvatarUrl(data.avatar_url || "");
				setBio(data.bio || "");
				setWebsite(data.website || "");
				setTwitter(data.twitter || "");
				setGithub(data.github || "");
			}
			markSaved();
		} catch (err) {
			console.error("Error loading profile:", err);
			toast.error("Failed to load profile");
		} finally {
			setLoading(false);
		}
	}
	async function handleSave() {
		if (!user) return;
		setSaving(true);
		try {
			const { error } = await supabase.from("profiles").update({
				display_name: displayName.trim() || null,
				avatar_url: avatarUrl.trim() || null,
				bio: bio.trim() || null,
				website: website.trim() || null,
				twitter: twitter.trim().replace("@", "") || null,
				github: github.trim() || null,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", user.id);
			if (error) throw error;
			markSaved();
			toast.success("Profile updated successfully!");
			if (displayName.trim()) navigate(`/u/${encodeURIComponent(displayName.trim())}`);
			else navigate("/settings");
		} catch (err) {
			console.error("Error saving profile:", err);
			toast.error("Failed to save profile");
		} finally {
			setSaving(false);
		}
	}
	const getInitials = () => {
		if (displayName) return displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
		return "U";
	};
	const handleAvatarUpload = async (event) => {
		const file = event.target.files?.[0];
		if (!file || !user) return;
		if (![
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp"
		].includes(file.type)) {
			toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
			return;
		}
		if (file.size > 5242880) {
			toast.error("Image must be smaller than 5MB");
			return;
		}
		setUploading(true);
		try {
			const fileExt = file.name.split(".").pop();
			const fileName = `${user.id}/avatar.${fileExt}`;
			const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
			if (uploadError) throw uploadError;
			const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
			const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
			setAvatarUrl(urlWithCacheBust);
			toast.success("Avatar uploaded successfully!");
		} catch (err) {
			console.error("Error uploading avatar:", err);
			toast.error("Failed to upload avatar");
		} finally {
			setUploading(false);
		}
	};
	if (authLoading || loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-2xl px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-48 mb-8" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-96 w-full" })]
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
				className: "flex-1 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container mx-auto max-w-2xl px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
						to: "/settings",
						className: "mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" }), "Back to Settings"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-5 w-5" }), "Edit Profile"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Customize your public profile. This information will be visible to everyone." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
										className: "h-20 w-20",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: avatarUrl || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
											className: "bg-primary text-primary-foreground text-xl",
											children: getInitials()
										})]
									}), uploading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute inset-0 flex items-center justify-center bg-background/80 rounded-full",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" })
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Profile Picture" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: fileInputRef,
											type: "file",
											accept: "image/jpeg,image/png,image/gif,image/webp",
											className: "hidden",
											onChange: handleAvatarUpload
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "outline",
											className: "gap-2",
											onClick: () => fileInputRef.current?.click(),
											disabled: uploading,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }), uploading ? "Uploading..." : "Upload Image"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "JPEG, PNG, GIF, or WebP. Max 5MB."
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "displayName",
										children: "Display Name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "displayName",
										placeholder: "Your Name",
										value: displayName,
										onChange: (e) => setDisplayName(e.target.value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: ["This is how others will see you. Your profile URL will be /u/", displayName || "your-name"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "bio",
										children: "Bio"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										id: "bio",
										placeholder: "Tell others about yourself...",
										value: bio,
										onChange: (e) => setBio(e.target.value),
										rows: 3,
										maxLength: 500
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [bio.length, "/500 characters"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Social Links" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "yourwebsite.com",
												value: website,
												onChange: (e) => setWebsite(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Twitter, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "username",
												value: twitter,
												onChange: (e) => setTwitter(e.target.value)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-5 w-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "username",
												value: github,
												onChange: (e) => setGithub(e.target.value)
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-end items-center gap-3 pt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveStateBadge, {
										isDirty,
										isSaving: saving,
										savedAt,
										className: "mr-auto"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										onClick: () => navigate("/settings"),
										children: "Cancel"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: handleSave,
										disabled: saving,
										className: "gap-2",
										title: "Save (⌘S / Ctrl+S)",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), saving ? "Saving..." : "Save Profile"]
									})
								]
							})
						]
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = EditProfile;
//#endregion
export { SplitComponent as component };
