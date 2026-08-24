import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { J as Plus, Yt as Folder, gt as LoaderCircle } from "../_libs/lucide-react.mjs";
import { i as useAuth, n as Link$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { i as useCollections } from "./useCollections-BePFdUZR.mjs";
import { t as CollectionCard } from "./CollectionCard-hfM5LfR1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/collections-4H5JtVca.js
var import_jsx_runtime = require_jsx_runtime();
function Collections() {
	const { user } = useAuth();
	const { data: myCollections, isLoading: loadingMy } = useCollections(user?.id);
	const { data: publicCollections, isLoading: loadingPublic } = useCollections();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 container mx-auto px-4 py-8 max-w-6xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl font-bold",
							children: "Collections"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground mt-1",
							children: "Curate and share sets of prompts, skills, and workflows"
						})] }), user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
								to: "/collections/new",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }), "Create Collection"]
							})
						})]
					}),
					user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mb-12",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-semibold mb-4",
							children: "My Collections"
						}), loadingMy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center py-12",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
						}) : myCollections && myCollections.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
							children: myCollections.map((collection) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollectionCard, {
								collection,
								showOwner: false
							}, collection.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center py-12 border border-dashed rounded-lg",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground mb-4",
									children: "You haven't created any collections yet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
										to: "/collections/new",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-2" }), "Create your first collection"]
									})
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-semibold mb-4",
						children: "Public Collections"
					}), loadingPublic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center py-12",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
					}) : publicCollections && publicCollections.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
						children: publicCollections.map((collection) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollectionCard, {
							collection,
							showOwner: true
						}, collection.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center py-12 border border-dashed rounded-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-12 w-12 mx-auto text-muted-foreground mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground",
							children: "No public collections yet"
						})]
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = Collections;
//#endregion
export { SplitComponent as component };
