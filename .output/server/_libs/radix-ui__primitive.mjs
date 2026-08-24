//#region node_modules/@radix-ui/react-switch/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$13 = Object.defineProperty;
var __name$13 = (target, value) => __defProp$13(target, "name", {
	value,
	configurable: true
});
var canUseDOM$13 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$14(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$13(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$13(composeEventHandlers$14, "composeEventHandlers");
function getOwnerWindow$13(element) {
	if (!canUseDOM$13) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$13(getOwnerWindow$13, "getOwnerWindow");
function getOwnerDocument$13(element) {
	if (!canUseDOM$13) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$13(getOwnerDocument$13, "getOwnerDocument");
function getActiveElement$13(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$13(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$13(activeElement) && activeElement.contentDocument) return getActiveElement$13(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$13(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$13(getActiveElement$13, "getActiveElement");
function isFrame$13(element) {
	return element.tagName === "IFRAME";
}
__name$13(isFrame$13, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-select/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$12 = Object.defineProperty;
var __name$12 = (target, value) => __defProp$12(target, "name", {
	value,
	configurable: true
});
var canUseDOM$12 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$13(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$12(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$12(composeEventHandlers$13, "composeEventHandlers");
function getOwnerWindow$12(element) {
	if (!canUseDOM$12) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$12(getOwnerWindow$12, "getOwnerWindow");
function getOwnerDocument$12(element) {
	if (!canUseDOM$12) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$12(getOwnerDocument$12, "getOwnerDocument");
function getActiveElement$12(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$12(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$12(activeElement) && activeElement.contentDocument) return getActiveElement$12(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$12(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$12(getActiveElement$12, "getActiveElement");
function isFrame$12(element) {
	return element.tagName === "IFRAME";
}
__name$12(isFrame$12, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-dialog/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$11 = Object.defineProperty;
var __name$11 = (target, value) => __defProp$11(target, "name", {
	value,
	configurable: true
});
var canUseDOM$11 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$12(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$11(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$11(composeEventHandlers$12, "composeEventHandlers");
function getOwnerWindow$11(element) {
	if (!canUseDOM$11) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$11(getOwnerWindow$11, "getOwnerWindow");
function getOwnerDocument$11(element) {
	if (!canUseDOM$11) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$11(getOwnerDocument$11, "getOwnerDocument");
function getActiveElement$11(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$11(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$11(activeElement) && activeElement.contentDocument) return getActiveElement$11(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$11(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$11(getActiveElement$11, "getActiveElement");
function isFrame$11(element) {
	return element.tagName === "IFRAME";
}
__name$11(isFrame$11, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$10 = Object.defineProperty;
var __name$10 = (target, value) => __defProp$10(target, "name", {
	value,
	configurable: true
});
var canUseDOM$10 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$11(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$10(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$10(composeEventHandlers$11, "composeEventHandlers");
function getOwnerWindow$10(element) {
	if (!canUseDOM$10) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$10(getOwnerWindow$10, "getOwnerWindow");
function getOwnerDocument$10(element) {
	if (!canUseDOM$10) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$10(getOwnerDocument$10, "getOwnerDocument");
function getActiveElement$10(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$10(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$10(activeElement) && activeElement.contentDocument) return getActiveElement$10(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$10(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$10(getActiveElement$10, "getActiveElement");
function isFrame$10(element) {
	return element.tagName === "IFRAME";
}
__name$10(isFrame$10, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-menu/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$9 = Object.defineProperty;
var __name$9 = (target, value) => __defProp$9(target, "name", {
	value,
	configurable: true
});
var canUseDOM$9 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$10(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$9(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$9(composeEventHandlers$10, "composeEventHandlers");
function getOwnerWindow$9(element) {
	if (!canUseDOM$9) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$9(getOwnerWindow$9, "getOwnerWindow");
function getOwnerDocument$9(element) {
	if (!canUseDOM$9) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$9(getOwnerDocument$9, "getOwnerDocument");
function getActiveElement$9(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$9(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$9(activeElement) && activeElement.contentDocument) return getActiveElement$9(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$9(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$9(getActiveElement$9, "getActiveElement");
function isFrame$9(element) {
	return element.tagName === "IFRAME";
}
__name$9(isFrame$9, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$8 = Object.defineProperty;
var __name$8 = (target, value) => __defProp$8(target, "name", {
	value,
	configurable: true
});
var canUseDOM$8 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$9(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$8(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$8(composeEventHandlers$9, "composeEventHandlers");
function getOwnerWindow$8(element) {
	if (!canUseDOM$8) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$8(getOwnerWindow$8, "getOwnerWindow");
function getOwnerDocument$8(element) {
	if (!canUseDOM$8) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$8(getOwnerDocument$8, "getOwnerDocument");
function getActiveElement$8(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$8(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$8(activeElement) && activeElement.contentDocument) return getActiveElement$8(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$8(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$8(getActiveElement$8, "getActiveElement");
function isFrame$8(element) {
	return element.tagName === "IFRAME";
}
__name$8(isFrame$8, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-tooltip/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$7 = Object.defineProperty;
var __name$7 = (target, value) => __defProp$7(target, "name", {
	value,
	configurable: true
});
var canUseDOM$7 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$8(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$7(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$7(composeEventHandlers$8, "composeEventHandlers");
function getOwnerWindow$7(element) {
	if (!canUseDOM$7) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$7(getOwnerWindow$7, "getOwnerWindow");
function getOwnerDocument$7(element) {
	if (!canUseDOM$7) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$7(getOwnerDocument$7, "getOwnerDocument");
function getActiveElement$7(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$7(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$7(activeElement) && activeElement.contentDocument) return getActiveElement$7(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$7(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$7(getActiveElement$7, "getActiveElement");
function isFrame$7(element) {
	return element.tagName === "IFRAME";
}
__name$7(isFrame$7, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-tabs/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$6 = Object.defineProperty;
var __name$6 = (target, value) => __defProp$6(target, "name", {
	value,
	configurable: true
});
var canUseDOM$6 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$7(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$6(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$6(composeEventHandlers$7, "composeEventHandlers");
function getOwnerWindow$6(element) {
	if (!canUseDOM$6) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$6(getOwnerWindow$6, "getOwnerWindow");
function getOwnerDocument$6(element) {
	if (!canUseDOM$6) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$6(getOwnerDocument$6, "getOwnerDocument");
function getActiveElement$6(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$6(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$6(activeElement) && activeElement.contentDocument) return getActiveElement$6(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$6(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$6(getActiveElement$6, "getActiveElement");
function isFrame$6(element) {
	return element.tagName === "IFRAME";
}
__name$6(isFrame$6, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-checkbox/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$5 = Object.defineProperty;
var __name$5 = (target, value) => __defProp$5(target, "name", {
	value,
	configurable: true
});
var canUseDOM$5 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$6(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$5(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$5(composeEventHandlers$6, "composeEventHandlers");
function getOwnerWindow$5(element) {
	if (!canUseDOM$5) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$5(getOwnerWindow$5, "getOwnerWindow");
function getOwnerDocument$5(element) {
	if (!canUseDOM$5) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$5(getOwnerDocument$5, "getOwnerDocument");
function getActiveElement$5(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$5(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$5(activeElement) && activeElement.contentDocument) return getActiveElement$5(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$5(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$5(getActiveElement$5, "getActiveElement");
function isFrame$5(element) {
	return element.tagName === "IFRAME";
}
__name$5(isFrame$5, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-alert-dialog/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$4 = Object.defineProperty;
var __name$4 = (target, value) => __defProp$4(target, "name", {
	value,
	configurable: true
});
var canUseDOM$4 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$5(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$4(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$4(composeEventHandlers$5, "composeEventHandlers");
function getOwnerWindow$4(element) {
	if (!canUseDOM$4) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$4(getOwnerWindow$4, "getOwnerWindow");
function getOwnerDocument$4(element) {
	if (!canUseDOM$4) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$4(getOwnerDocument$4, "getOwnerDocument");
function getActiveElement$4(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$4(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$4(activeElement) && activeElement.contentDocument) return getActiveElement$4(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$4(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$4(getActiveElement$4, "getActiveElement");
function isFrame$4(element) {
	return element.tagName === "IFRAME";
}
__name$4(isFrame$4, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-scroll-area/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$3 = Object.defineProperty;
var __name$3 = (target, value) => __defProp$3(target, "name", {
	value,
	configurable: true
});
var canUseDOM$3 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$4(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$3(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$3(composeEventHandlers$4, "composeEventHandlers");
function getOwnerWindow$3(element) {
	if (!canUseDOM$3) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$3(getOwnerWindow$3, "getOwnerWindow");
function getOwnerDocument$3(element) {
	if (!canUseDOM$3) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$3(getOwnerDocument$3, "getOwnerDocument");
function getActiveElement$3(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$3(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$3(activeElement) && activeElement.contentDocument) return getActiveElement$3(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$3(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$3(getActiveElement$3, "getActiveElement");
function isFrame$3(element) {
	return element.tagName === "IFRAME";
}
__name$3(isFrame$3, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-popover/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$2 = Object.defineProperty;
var __name$2 = (target, value) => __defProp$2(target, "name", {
	value,
	configurable: true
});
var canUseDOM$2 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$3(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$2(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$2(composeEventHandlers$3, "composeEventHandlers");
function getOwnerWindow$2(element) {
	if (!canUseDOM$2) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$2(getOwnerWindow$2, "getOwnerWindow");
function getOwnerDocument$2(element) {
	if (!canUseDOM$2) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$2(getOwnerDocument$2, "getOwnerDocument");
function getActiveElement$2(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$2(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$2(activeElement) && activeElement.contentDocument) return getActiveElement$2(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$2(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$2(getActiveElement$2, "getActiveElement");
function isFrame$2(element) {
	return element.tagName === "IFRAME";
}
__name$2(isFrame$2, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-collapsible/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp$1 = Object.defineProperty;
var __name$1 = (target, value) => __defProp$1(target, "name", {
	value,
	configurable: true
});
var canUseDOM$1 = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$2(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name$1(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name$1(composeEventHandlers$2, "composeEventHandlers");
function getOwnerWindow$1(element) {
	if (!canUseDOM$1) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name$1(getOwnerWindow$1, "getOwnerWindow");
function getOwnerDocument$1(element) {
	if (!canUseDOM$1) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name$1(getOwnerDocument$1, "getOwnerDocument");
function getActiveElement$1(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument$1(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame$1(activeElement) && activeElement.contentDocument) return getActiveElement$1(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument$1(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name$1(getActiveElement$1, "getActiveElement");
function isFrame$1(element) {
	return element.tagName === "IFRAME";
}
__name$1(isFrame$1, "isFrame");
//#endregion
//#region node_modules/@radix-ui/react-toggle/node_modules/@radix-ui/primitive/dist/index.mjs
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", {
	value,
	configurable: true
});
var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
function composeEventHandlers$1(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return /* @__PURE__ */ __name(function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event || !event.defaultPrevented) return ourEventHandler?.(event);
	}, "handleEvent");
}
__name(composeEventHandlers$1, "composeEventHandlers");
function getOwnerWindow(element) {
	if (!canUseDOM) throw new Error("Cannot access window outside of the DOM");
	return element?.ownerDocument?.defaultView ?? window;
}
__name(getOwnerWindow, "getOwnerWindow");
function getOwnerDocument(element) {
	if (!canUseDOM) throw new Error("Cannot access document outside of the DOM");
	return element?.ownerDocument ?? document;
}
__name(getOwnerDocument, "getOwnerDocument");
function getActiveElement(node, activeDescendant = false) {
	const { activeElement } = getOwnerDocument(node);
	if (!activeElement?.nodeName) return null;
	if (isFrame(activeElement) && activeElement.contentDocument) return getActiveElement(activeElement.contentDocument.body, activeDescendant);
	if (activeDescendant) {
		const id = activeElement.getAttribute("aria-activedescendant");
		if (id) {
			const element = getOwnerDocument(activeElement).getElementById(id);
			if (element) return element;
		}
	}
	return activeElement;
}
__name(getActiveElement, "getActiveElement");
function isFrame(element) {
	return element.tagName === "IFRAME";
}
__name(isFrame, "isFrame");
//#endregion
//#region node_modules/@radix-ui/primitive/dist/index.mjs
function composeEventHandlers(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
	return function handleEvent(event) {
		originalEventHandler?.(event);
		if (checkForDefaultPrevented === false || !event.defaultPrevented) return ourEventHandler?.(event);
	};
}
//#endregion
export { composeEventHandlers$4 as a, composeEventHandlers$7 as c, composeEventHandlers$10 as d, composeEventHandlers$11 as f, composeEventHandlers$14 as h, composeEventHandlers$3 as i, composeEventHandlers$8 as l, composeEventHandlers$13 as m, composeEventHandlers$1 as n, composeEventHandlers$5 as o, composeEventHandlers$12 as p, composeEventHandlers$2 as r, composeEventHandlers$6 as s, composeEventHandlers as t, composeEventHandlers$9 as u };
