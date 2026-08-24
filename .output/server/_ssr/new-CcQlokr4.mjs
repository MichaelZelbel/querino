import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, t as Card } from "./card-4AsKRAzx.mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { t as Input } from "./input-DZABqqwC.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Textarea } from "./textarea-C03-A3RU.mjs";
import { t as Switch } from "./switch-BXNTxolN.mjs";
import { Vn as ArrowLeft, gt as LoaderCircle } from "../_libs/lucide-react.mjs";
import { i as useAuth, s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
import { n as Header, t as Footer } from "./Footer-ClUC5jzd.mjs";
import { a as useCreateCollection } from "./useCollections-BePFdUZR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-CcQlokr4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CollectionNew() {
	const navigate = useNavigate$1();
	const { user, loading: authLoading } = useAuth();
	const createCollection = useCreateCollection();
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [isPublic, setIsPublic] = (0, import_react.useState)(false);
	if (!authLoading && !user) {
		navigate("/auth?redirect=/collections/new");
		return null;
	}
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!title.trim() || !user) return;
		try {
			const collection = await createCollection.mutateAsync({
				title: title.trim(),
				description: description.trim() || void 0,
				is_public: isPublic,
				owner_id: user.id
			});
			navigate(`/collections/${collection.id}/edit`);
		} catch (error) {
			console.error("Error creating collection:", error);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 container mx-auto px-4 py-8 max-w-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					className: "mb-6",
					onClick: () => navigate("/collections"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Collections"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Create New Collection" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "title",
								children: "Title *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "title",
								value: title,
								onChange: (e) => setTitle(e.target.value),
								placeholder: "My awesome collection",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "description",
								children: "Description"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								id: "description",
								value: description,
								onChange: (e) => setDescription(e.target.value),
								placeholder: "What's this collection about?",
								rows: 3
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "public",
									children: "Make Public"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: "Public collections can be viewed by anyone"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								id: "public",
								checked: isPublic,
								onCheckedChange: setIsPublic
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full",
							disabled: !title.trim() || createCollection.isPending,
							children: createCollection.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }), "Creating..."] }) : "Create Collection"
						})
					]
				}) })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
var SplitComponent = CollectionNew;
//#endregion
export { SplitComponent as component };
