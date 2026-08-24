import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "./@floating-ui/react-dom+[...].mjs";
//#region node_modules/react-intersection-observer/dist/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var observerMap = /* @__PURE__ */ new Map();
var RootIds = /* @__PURE__ */ new WeakMap();
var rootId = 0;
var unsupportedValue;
function getRootId(root) {
	if (!root) return "0";
	if (RootIds.has(root)) return RootIds.get(root);
	rootId += 1;
	RootIds.set(root, rootId.toString());
	return RootIds.get(root);
}
function optionsToId(options) {
	return Object.keys(options).sort().filter((key) => options[key] !== void 0).map((key) => {
		return `${key}_${key === "root" ? getRootId(options.root) : options[key]}`;
	}).toString();
}
function createObserver(options) {
	const id = optionsToId(options);
	let instance = observerMap.get(id);
	if (!instance) {
		const elements = /* @__PURE__ */ new Map();
		let thresholds;
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				var _a2;
				const inView = entry.isIntersecting && thresholds.some((threshold) => entry.intersectionRatio >= threshold);
				if (options.trackVisibility && typeof entry.isVisible === "undefined") entry.isVisible = inView;
				(_a2 = elements.get(entry.target)) == null || _a2.forEach((callback) => {
					callback(inView, entry);
				});
			});
		}, options);
		thresholds = observer.thresholds || (Array.isArray(options.threshold) ? options.threshold : [options.threshold || 0]);
		instance = {
			id,
			observer,
			elements
		};
		observerMap.set(id, instance);
	}
	return instance;
}
function observe(element, callback, options = {}, fallbackInView = unsupportedValue) {
	if (typeof window.IntersectionObserver === "undefined" && fallbackInView !== void 0) {
		const bounds = element.getBoundingClientRect();
		callback(fallbackInView, {
			isIntersecting: fallbackInView,
			target: element,
			intersectionRatio: typeof options.threshold === "number" ? options.threshold : 0,
			time: 0,
			boundingClientRect: bounds,
			intersectionRect: bounds,
			rootBounds: bounds
		});
		return () => {};
	}
	const { id, observer, elements } = createObserver(options);
	const callbacks = elements.get(element) || [];
	if (!elements.has(element)) elements.set(element, callbacks);
	callbacks.push(callback);
	observer.observe(element);
	return function unobserve() {
		callbacks.splice(callbacks.indexOf(callback), 1);
		if (callbacks.length === 0) {
			elements.delete(element);
			observer.unobserve(element);
		}
		if (elements.size === 0) {
			observer.disconnect();
			observerMap.delete(id);
		}
	};
}
import_react.Component;
function useInView({ threshold, delay, trackVisibility, rootMargin, root, triggerOnce, skip, initialInView, fallbackInView, onChange } = {}) {
	var _a2;
	const [ref, setRef] = import_react.useState(null);
	const callback = import_react.useRef(onChange);
	const lastInViewRef = import_react.useRef(initialInView);
	const [state, setState] = import_react.useState({
		inView: !!initialInView,
		entry: void 0
	});
	callback.current = onChange;
	import_react.useEffect(() => {
		if (lastInViewRef.current === void 0) lastInViewRef.current = initialInView;
		if (skip || !ref) return;
		let unobserve;
		unobserve = observe(ref, (inView, entry) => {
			const previousInView = lastInViewRef.current;
			lastInViewRef.current = inView;
			if (previousInView === void 0 && !inView) return;
			setState({
				inView,
				entry
			});
			if (callback.current) callback.current(inView, entry);
			if (entry.isIntersecting && triggerOnce && unobserve) {
				unobserve();
				unobserve = void 0;
			}
		}, {
			root,
			rootMargin,
			threshold,
			trackVisibility,
			delay
		}, fallbackInView);
		return () => {
			if (unobserve) unobserve();
		};
	}, [
		Array.isArray(threshold) ? threshold.toString() : threshold,
		ref,
		root,
		rootMargin,
		triggerOnce,
		skip,
		trackVisibility,
		fallbackInView,
		delay
	]);
	const entryTarget = (_a2 = state.entry) == null ? void 0 : _a2.target;
	const previousEntryTarget = import_react.useRef(void 0);
	if (!ref && entryTarget && !triggerOnce && !skip && previousEntryTarget.current !== entryTarget) {
		previousEntryTarget.current = entryTarget;
		setState({
			inView: !!initialInView,
			entry: void 0
		});
		lastInViewRef.current = initialInView;
	}
	const result = [
		setRef,
		state.inView,
		state.entry
	];
	result.ref = result[0];
	result.inView = result[1];
	result.entry = result[2];
	return result;
}
var _a;
((_a = import_react.useInsertionEffect) != null ? _a : import_react.useLayoutEffect) != null || import_react.useEffect;
//#endregion
export { useInView as t };
