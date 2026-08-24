import { E as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-DfDjtN4g.mjs";
import { in as Download } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as buildMarkdownContent, l as downloadMarkdownFile, p as slugify } from "./Footer-ClUC5jzd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/DownloadMarkdownButton-DBKsRp2M.js
var import_jsx_runtime = require_jsx_runtime();
function DownloadMarkdownButton({ title, type, description, tags, framework, content, variant = "outline", size = "lg", className }) {
	const handleDownload = () => {
		try {
			const markdownContent = buildMarkdownContent({
				title,
				type,
				description,
				tags,
				framework,
				content
			});
			const filename = `${slugify(title)}.md`;
			downloadMarkdownFile(markdownContent, filename);
			toast.success(`Downloaded ${filename}`);
		} catch (err) {
			console.error("Error downloading markdown:", err);
			toast.error("Failed to download markdown file");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant,
		size,
		onClick: handleDownload,
		className: `gap-2 ${className || ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4" }), "Download .md"]
	});
}
//#endregion
export { DownloadMarkdownButton as t };
