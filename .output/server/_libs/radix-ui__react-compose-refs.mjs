import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "./@floating-ui/react-dom+[...].mjs";
//#region node_modules/@radix-ui/react-switch/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var __defProp$5 = Object.defineProperty;
var __name$5 = (target, value) => __defProp$5(target, "name", {
	value,
	configurable: true
});
function setRef$5(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
__name$5(setRef$5, "setRef");
function composeRefs$5(...refs) {
	return (node) => {
		let hasCleanup = false;
		const cleanups = refs.map((ref) => {
			const cleanup = setRef$5(ref, node);
			if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup == "function") cleanup();
				else setRef$5(refs[i], null);
			}
		};
	};
}
__name$5(composeRefs$5, "composeRefs");
function useComposedRefs$5(...refs) {
	return import_react.useCallback(composeRefs$5(...refs), refs);
}
__name$5(useComposedRefs$5, "useComposedRefs");
//#endregion
//#region node_modules/@radix-ui/react-popper/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var __defProp$4 = Object.defineProperty;
var __name$4 = (target, value) => __defProp$4(target, "name", {
	value,
	configurable: true
});
function setRef$4(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
__name$4(setRef$4, "setRef");
function composeRefs$4(...refs) {
	return (node) => {
		let hasCleanup = false;
		const cleanups = refs.map((ref) => {
			const cleanup = setRef$4(ref, node);
			if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup == "function") cleanup();
				else setRef$4(refs[i], null);
			}
		};
	};
}
__name$4(composeRefs$4, "composeRefs");
function useComposedRefs$4(...refs) {
	return import_react.useCallback(composeRefs$4(...refs), refs);
}
__name$4(useComposedRefs$4, "useComposedRefs");
//#endregion
//#region node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var __defProp$3 = Object.defineProperty;
var __name$3 = (target, value) => __defProp$3(target, "name", {
	value,
	configurable: true
});
function setRef$3(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
__name$3(setRef$3, "setRef");
function composeRefs$3(...refs) {
	return (node) => {
		let hasCleanup = false;
		const cleanups = refs.map((ref) => {
			const cleanup = setRef$3(ref, node);
			if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup == "function") cleanup();
				else setRef$3(refs[i], null);
			}
		};
	};
}
__name$3(composeRefs$3, "composeRefs");
function useComposedRefs$3(...refs) {
	return import_react.useCallback(composeRefs$3(...refs), refs);
}
__name$3(useComposedRefs$3, "useComposedRefs");
//#endregion
//#region node_modules/@radix-ui/react-tooltip/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var __defProp$2 = Object.defineProperty;
var __name$2 = (target, value) => __defProp$2(target, "name", {
	value,
	configurable: true
});
function setRef$2(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
__name$2(setRef$2, "setRef");
function composeRefs$2(...refs) {
	return (node) => {
		let hasCleanup = false;
		const cleanups = refs.map((ref) => {
			const cleanup = setRef$2(ref, node);
			if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup == "function") cleanup();
				else setRef$2(refs[i], null);
			}
		};
	};
}
__name$2(composeRefs$2, "composeRefs");
function useComposedRefs$2(...refs) {
	return import_react.useCallback(composeRefs$2(...refs), refs);
}
__name$2(useComposedRefs$2, "useComposedRefs");
//#endregion
//#region node_modules/@radix-ui/react-scroll-area/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var __defProp$1 = Object.defineProperty;
var __name$1 = (target, value) => __defProp$1(target, "name", {
	value,
	configurable: true
});
function setRef$1(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
__name$1(setRef$1, "setRef");
function composeRefs$1(...refs) {
	return (node) => {
		let hasCleanup = false;
		const cleanups = refs.map((ref) => {
			const cleanup = setRef$1(ref, node);
			if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup == "function") cleanup();
				else setRef$1(refs[i], null);
			}
		};
	};
}
__name$1(composeRefs$1, "composeRefs");
function useComposedRefs$1(...refs) {
	return import_react.useCallback(composeRefs$1(...refs), refs);
}
__name$1(useComposedRefs$1, "useComposedRefs");
//#endregion
//#region node_modules/@radix-ui/react-popover/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", {
	value,
	configurable: true
});
function setRef(ref, value) {
	if (typeof ref === "function") return ref(value);
	else if (ref !== null && ref !== void 0) ref.current = value;
}
__name(setRef, "setRef");
function composeRefs(...refs) {
	return (node) => {
		let hasCleanup = false;
		const cleanups = refs.map((ref) => {
			const cleanup = setRef(ref, node);
			if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
			return cleanup;
		});
		if (hasCleanup) return () => {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				if (typeof cleanup == "function") cleanup();
				else setRef(refs[i], null);
			}
		};
	};
}
__name(composeRefs, "composeRefs");
function useComposedRefs(...refs) {
	return import_react.useCallback(composeRefs(...refs), refs);
}
__name(useComposedRefs, "useComposedRefs");
//#endregion
export { useComposedRefs$4 as a, useComposedRefs$3 as i, useComposedRefs$1 as n, useComposedRefs$5 as o, useComposedRefs$2 as r, useComposedRefs as t };
