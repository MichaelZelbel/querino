import { a as __toESM } from "../_runtime.mjs";
import { n as supabase } from "./client-Bi_X_zk2.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as useNavigate$1 } from "./router-compat-xSZ_AoUj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useCloneArtifact-C6wTjE_T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* Shared clone hook. The four per-type clone hooks differed only in table,
* insert fields and post-clone route; they now delegate here.
*/
function createCloneHook(config) {
	return function useCloneArtifact() {
		const navigate = useNavigate$1();
		const [cloning, setCloning] = (0, import_react.useState)(false);
		const clone = async (source, userId) => {
			setCloning(true);
			try {
				const { data, error } = await supabase.from(config.table).insert({
					...config.buildInsert(source),
					title: `Copy of ${source.title}`,
					author_id: userId
				}).select("id, slug").single();
				if (error) {
					console.error(`Error cloning ${config.label}:`, error);
					toast.error(`Failed to clone ${config.label}`);
					return null;
				}
				toast.success(`${config.label[0].toUpperCase()}${config.label.slice(1)} cloned to your library!`);
				navigate(config.editPath(data));
				return data.id;
			} catch (err) {
				console.error(`Error cloning ${config.label}:`, err);
				toast.error(`Failed to clone ${config.label}`);
				return null;
			} finally {
				setCloning(false);
			}
		};
		return {
			clone,
			cloning
		};
	};
}
//#endregion
export { createCloneHook as t };
