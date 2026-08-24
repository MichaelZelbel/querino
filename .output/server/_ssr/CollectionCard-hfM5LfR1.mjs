import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as CardHeader, n as CardContent, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Badge } from "./badge-DDdsxPGp.mjs";
import { Ut as Globe, Yt as Folder, ht as Lock } from "../_libs/lucide-react.mjs";
import { n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar } from "./avatar-CLMN7E0g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/CollectionCard-hfM5LfR1.js
var import_jsx_runtime = require_jsx_runtime();
function CollectionCard({ collection, showOwner = true }) {
	const ownerName = collection.owner?.display_name || "Anonymous";
	const ownerInitial = ownerName.charAt(0).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
		to: `/collections/${collection.id}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "h-full hover:shadow-lg transition-shadow cursor-pointer",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "pb-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold text-lg line-clamp-1",
							children: collection.title
						})]
					}), collection.is_public ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4 text-muted-foreground" })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-3",
				children: [collection.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground line-clamp-2",
					children: collection.description
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "secondary",
						children: [collection.item_count || 0, " items"]
					}), showOwner && collection.owner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
							className: "h-6 w-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, { src: collection.owner.avatar_url || void 0 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
								className: "text-xs",
								children: ownerInitial
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: ownerName
						})]
					})]
				})]
			})]
		})
	});
}
//#endregion
export { CollectionCard as t };
