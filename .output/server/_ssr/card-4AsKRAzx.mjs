import { a as __toESM } from "../_runtime.mjs";
import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/card-4AsKRAzx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var cardVariants = cva("rounded-xl border bg-card text-card-foreground transition-all duration-300", {
	variants: { variant: {
		default: "border-border shadow-sm",
		elevated: "border-border/50 shadow-md hover:shadow-lg hover:-translate-y-0.5",
		interactive: "border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 cursor-pointer",
		prompt: "border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-1 hover:scale-[1.01] group cursor-pointer",
		glass: "border-border/30 bg-card/80 backdrop-blur-sm shadow-md",
		accent: "border-primary/20 bg-accent/50 shadow-sm hover:bg-accent/70"
	} },
	defaultVariants: { variant: "default" }
});
var Card = import_react.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn(cardVariants({
		variant,
		className
	})),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
	ref,
	className: cn("text-xl font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
//#endregion
export { CardHeader as a, CardFooter as i, CardContent as n, CardTitle as o, CardDescription as r, Card as t };
