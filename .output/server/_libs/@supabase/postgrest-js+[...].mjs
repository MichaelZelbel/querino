import { n as __esmMin, t as __commonJSMin } from "../../_runtime.mjs";
//#region node_modules/unenv/dist/runtime/polyfill/globalthis.mjs
var globalthis_default;
var init_globalthis = __esmMin((() => {
	globalthis_default = globalThis;
}));
//#endregion
//#region node_modules/tslib/tslib.js
var require_tslib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	init_globalthis();
	/******************************************************************************
	Copyright (c) Microsoft Corporation.
	
	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.
	
	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	var __extends;
	var __assign;
	var __rest;
	var __decorate;
	var __param;
	var __esDecorate;
	var __runInitializers;
	var __propKey;
	var __setFunctionName;
	var __metadata;
	var __awaiter;
	var __generator;
	var __exportStar;
	var __values;
	var __read;
	var __spread;
	var __spreadArrays;
	var __spreadArray;
	var __await;
	var __asyncGenerator;
	var __asyncDelegator;
	var __asyncValues;
	var __makeTemplateObject;
	var __importStar;
	var __importDefault;
	var __classPrivateFieldGet;
	var __classPrivateFieldSet;
	var __classPrivateFieldIn;
	var __createBinding;
	var __addDisposableResource;
	var __disposeResources;
	var __rewriteRelativeImportExtension;
	(function(factory) {
		var root = typeof globalthis_default === "object" ? globalthis_default : typeof self === "object" ? self : typeof this === "object" ? this : {};
		if (typeof define === "function" && define.amd) define("tslib", ["exports"], function(exports$1) {
			factory(createExporter(root, createExporter(exports$1)));
		});
		else if (typeof module === "object" && typeof module.exports === "object") factory(createExporter(root, createExporter(module.exports)));
		else factory(createExporter(root));
		function createExporter(exports$2, previous) {
			if (exports$2 !== root) if (typeof Object.create === "function") Object.defineProperty(exports$2, "__esModule", { value: true });
			else exports$2.__esModule = true;
			return function(id, v) {
				return exports$2[id] = previous ? previous(id, v) : v;
			};
		}
	})(function(exporter) {
		var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
			d.__proto__ = b;
		} || function(d, b) {
			for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
		};
		__extends = function(d, b) {
			if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
		__assign = Object.assign || function(t) {
			for (var s, i = 1, n = arguments.length; i < n; i++) {
				s = arguments[i];
				for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
			}
			return t;
		};
		__rest = function(s, e) {
			var t = {};
			for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
			if (s != null && typeof Object.getOwnPropertySymbols === "function") {
				for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
			}
			return t;
		};
		__decorate = function(decorators, target, key, desc) {
			var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
			if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
			else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
			return c > 3 && r && Object.defineProperty(target, key, r), r;
		};
		__param = function(paramIndex, decorator) {
			return function(target, key) {
				decorator(target, key, paramIndex);
			};
		};
		__esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
			function accept(f) {
				if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
				return f;
			}
			var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
			var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
			var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
			var _, done = false;
			for (var i = decorators.length - 1; i >= 0; i--) {
				var context = {};
				for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
				for (var p in contextIn.access) context.access[p] = contextIn.access[p];
				context.addInitializer = function(f) {
					if (done) throw new TypeError("Cannot add initializers after decoration has completed");
					extraInitializers.push(accept(f || null));
				};
				var result = (0, decorators[i])(kind === "accessor" ? {
					get: descriptor.get,
					set: descriptor.set
				} : descriptor[key], context);
				if (kind === "accessor") {
					if (result === void 0) continue;
					if (result === null || typeof result !== "object") throw new TypeError("Object expected");
					if (_ = accept(result.get)) descriptor.get = _;
					if (_ = accept(result.set)) descriptor.set = _;
					if (_ = accept(result.init)) initializers.unshift(_);
				} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
				else descriptor[key] = _;
			}
			if (target) Object.defineProperty(target, contextIn.name, descriptor);
			done = true;
		};
		__runInitializers = function(thisArg, initializers, value) {
			var useValue = arguments.length > 2;
			for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
			return useValue ? value : void 0;
		};
		__propKey = function(x) {
			return typeof x === "symbol" ? x : "".concat(x);
		};
		__setFunctionName = function(f, name, prefix) {
			if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
			return Object.defineProperty(f, "name", {
				configurable: true,
				value: prefix ? "".concat(prefix, " ", name) : name
			});
		};
		__metadata = function(metadataKey, metadataValue) {
			if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
		};
		__awaiter = function(thisArg, _arguments, P, generator) {
			function adopt(value) {
				return value instanceof P ? value : new P(function(resolve) {
					resolve(value);
				});
			}
			return new (P || (P = Promise))(function(resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch (e) {
						reject(e);
					}
				}
				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch (e) {
						reject(e);
					}
				}
				function step(result) {
					result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
				}
				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
		};
		__generator = function(thisArg, body) {
			var _ = {
				label: 0,
				sent: function() {
					if (t[0] & 1) throw t[1];
					return t[1];
				},
				trys: [],
				ops: []
			}, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
			return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
				return this;
			}), g;
			function verb(n) {
				return function(v) {
					return step([n, v]);
				};
			}
			function step(op) {
				if (f) throw new TypeError("Generator is already executing.");
				while (g && (g = 0, op[0] && (_ = 0)), _) try {
					if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
					if (y = 0, t) op = [op[0] & 2, t.value];
					switch (op[0]) {
						case 0:
						case 1:
							t = op;
							break;
						case 4:
							_.label++;
							return {
								value: op[1],
								done: false
							};
						case 5:
							_.label++;
							y = op[1];
							op = [0];
							continue;
						case 7:
							op = _.ops.pop();
							_.trys.pop();
							continue;
						default:
							if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
								_ = 0;
								continue;
							}
							if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
								_.label = op[1];
								break;
							}
							if (op[0] === 6 && _.label < t[1]) {
								_.label = t[1];
								t = op;
								break;
							}
							if (t && _.label < t[2]) {
								_.label = t[2];
								_.ops.push(op);
								break;
							}
							if (t[2]) _.ops.pop();
							_.trys.pop();
							continue;
					}
					op = body.call(thisArg, _);
				} catch (e) {
					op = [6, e];
					y = 0;
				} finally {
					f = t = 0;
				}
				if (op[0] & 5) throw op[1];
				return {
					value: op[0] ? op[1] : void 0,
					done: true
				};
			}
		};
		__exportStar = function(m, o) {
			for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
		};
		__createBinding = Object.create ? (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			var desc = Object.getOwnPropertyDescriptor(m, k);
			if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
				enumerable: true,
				get: function() {
					return m[k];
				}
			};
			Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
			if (k2 === void 0) k2 = k;
			o[k2] = m[k];
		});
		__values = function(o) {
			var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
			if (m) return m.call(o);
			if (o && typeof o.length === "number") return { next: function() {
				if (o && i >= o.length) o = void 0;
				return {
					value: o && o[i++],
					done: !o
				};
			} };
			throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
		};
		__read = function(o, n) {
			var m = typeof Symbol === "function" && o[Symbol.iterator];
			if (!m) return o;
			var i = m.call(o), r, ar = [], e;
			try {
				while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
			} catch (error) {
				e = { error };
			} finally {
				try {
					if (r && !r.done && (m = i["return"])) m.call(i);
				} finally {
					if (e) throw e.error;
				}
			}
			return ar;
		};
		/** @deprecated */
		__spread = function() {
			for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
			return ar;
		};
		/** @deprecated */
		__spreadArrays = function() {
			for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
			for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
			return r;
		};
		__spreadArray = function(to, from, pack) {
			if (pack || arguments.length === 2) {
				for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
					if (!ar) ar = Array.prototype.slice.call(from, 0, i);
					ar[i] = from[i];
				}
			}
			return to.concat(ar || Array.prototype.slice.call(from));
		};
		__await = function(v) {
			return this instanceof __await ? (this.v = v, this) : new __await(v);
		};
		__asyncGenerator = function(thisArg, _arguments, generator) {
			if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
			var g = generator.apply(thisArg, _arguments || []), i, q = [];
			return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
				return this;
			}, i;
			function awaitReturn(f) {
				return function(v) {
					return Promise.resolve(v).then(f, reject);
				};
			}
			function verb(n, f) {
				if (g[n]) {
					i[n] = function(v) {
						return new Promise(function(a, b) {
							q.push([
								n,
								v,
								a,
								b
							]) > 1 || resume(n, v);
						});
					};
					if (f) i[n] = f(i[n]);
				}
			}
			function resume(n, v) {
				try {
					step(g[n](v));
				} catch (e) {
					settle(q[0][3], e);
				}
			}
			function step(r) {
				r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
			}
			function fulfill(value) {
				resume("next", value);
			}
			function reject(value) {
				resume("throw", value);
			}
			function settle(f, v) {
				if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
			}
		};
		__asyncDelegator = function(o) {
			var i, p;
			return i = {}, verb("next"), verb("throw", function(e) {
				throw e;
			}), verb("return"), i[Symbol.iterator] = function() {
				return this;
			}, i;
			function verb(n, f) {
				i[n] = o[n] ? function(v) {
					return (p = !p) ? {
						value: __await(o[n](v)),
						done: false
					} : f ? f(v) : v;
				} : f;
			}
		};
		__asyncValues = function(o) {
			if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
			var m = o[Symbol.asyncIterator], i;
			return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
				return this;
			}, i);
			function verb(n) {
				i[n] = o[n] && function(v) {
					return new Promise(function(resolve, reject) {
						v = o[n](v), settle(resolve, reject, v.done, v.value);
					});
				};
			}
			function settle(resolve, reject, d, v) {
				Promise.resolve(v).then(function(v) {
					resolve({
						value: v,
						done: d
					});
				}, reject);
			}
		};
		__makeTemplateObject = function(cooked, raw) {
			if (Object.defineProperty) Object.defineProperty(cooked, "raw", { value: raw });
			else cooked.raw = raw;
			return cooked;
		};
		var __setModuleDefault = Object.create ? (function(o, v) {
			Object.defineProperty(o, "default", {
				enumerable: true,
				value: v
			});
		}) : function(o, v) {
			o["default"] = v;
		};
		var ownKeys = function(o) {
			ownKeys = Object.getOwnPropertyNames || function(o) {
				var ar = [];
				for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
				return ar;
			};
			return ownKeys(o);
		};
		__importStar = function(mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null) {
				for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
			}
			__setModuleDefault(result, mod);
			return result;
		};
		__importDefault = function(mod) {
			return mod && mod.__esModule ? mod : { "default": mod };
		};
		__classPrivateFieldGet = function(receiver, state, kind, f) {
			if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
			if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
			return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
		};
		__classPrivateFieldSet = function(receiver, state, value, kind, f) {
			if (kind === "m") throw new TypeError("Private method is not writable");
			if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
			if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
			return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
		};
		__classPrivateFieldIn = function(state, receiver) {
			if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
			return typeof state === "function" ? receiver === state : state.has(receiver);
		};
		__addDisposableResource = function(env, value, async) {
			if (value !== null && value !== void 0) {
				if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
				var dispose, inner;
				if (async) {
					if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
					dispose = value[Symbol.asyncDispose];
				}
				if (dispose === void 0) {
					if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
					dispose = value[Symbol.dispose];
					if (async) inner = dispose;
				}
				if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
				if (inner) dispose = function() {
					try {
						inner.call(this);
					} catch (e) {
						return Promise.reject(e);
					}
				};
				env.stack.push({
					value,
					dispose,
					async
				});
			} else if (async) env.stack.push({ async: true });
			return value;
		};
		var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
			var e = new Error(message);
			return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
		};
		__disposeResources = function(env) {
			function fail(e) {
				env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
				env.hasError = true;
			}
			var r, s = 0;
			function next() {
				while (r = env.stack.pop()) try {
					if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
					if (r.dispose) {
						var result = r.dispose.call(r.value);
						if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
							fail(e);
							return next();
						});
					} else s |= 1;
				} catch (e) {
					fail(e);
				}
				if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
				if (env.hasError) throw env.error;
			}
			return next();
		};
		__rewriteRelativeImportExtension = function(path, preserveJsx) {
			if (typeof path === "string" && /^\.\.?\//.test(path)) return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
				return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
			});
			return path;
		};
		exporter("__extends", __extends);
		exporter("__assign", __assign);
		exporter("__rest", __rest);
		exporter("__decorate", __decorate);
		exporter("__param", __param);
		exporter("__esDecorate", __esDecorate);
		exporter("__runInitializers", __runInitializers);
		exporter("__propKey", __propKey);
		exporter("__setFunctionName", __setFunctionName);
		exporter("__metadata", __metadata);
		exporter("__awaiter", __awaiter);
		exporter("__generator", __generator);
		exporter("__exportStar", __exportStar);
		exporter("__createBinding", __createBinding);
		exporter("__values", __values);
		exporter("__read", __read);
		exporter("__spread", __spread);
		exporter("__spreadArrays", __spreadArrays);
		exporter("__spreadArray", __spreadArray);
		exporter("__await", __await);
		exporter("__asyncGenerator", __asyncGenerator);
		exporter("__asyncDelegator", __asyncDelegator);
		exporter("__asyncValues", __asyncValues);
		exporter("__makeTemplateObject", __makeTemplateObject);
		exporter("__importStar", __importStar);
		exporter("__importDefault", __importDefault);
		exporter("__classPrivateFieldGet", __classPrivateFieldGet);
		exporter("__classPrivateFieldSet", __classPrivateFieldSet);
		exporter("__classPrivateFieldIn", __classPrivateFieldIn);
		exporter("__addDisposableResource", __addDisposableResource);
		exporter("__disposeResources", __disposeResources);
		exporter("__rewriteRelativeImportExtension", __rewriteRelativeImportExtension);
	});
	0 && (module.exports = {
		__extends,
		__assign,
		__rest,
		__decorate,
		__param,
		__esDecorate,
		__runInitializers,
		__propKey,
		__setFunctionName,
		__metadata,
		__awaiter,
		__generator,
		__exportStar,
		__createBinding,
		__values,
		__read,
		__spread,
		__spreadArrays,
		__spreadArray,
		__await,
		__asyncGenerator,
		__asyncDelegator,
		__asyncValues,
		__makeTemplateObject,
		__importStar,
		__importDefault,
		__classPrivateFieldGet,
		__classPrivateFieldSet,
		__classPrivateFieldIn,
		__addDisposableResource,
		__disposeResources,
		__rewriteRelativeImportExtension
	});
}));
//#endregion
//#region node_modules/@supabase/postgrest-js/dist/cjs/PostgrestError.js
var require_PostgrestError = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	/**
	* Error format
	*
	* {@link https://postgrest.org/en/stable/api.html?highlight=options#errors-and-http-status-codes}
	*/
	var PostgrestError = class extends Error {
		/**
		* @example
		* ```ts
		* import PostgrestError from '@supabase/postgrest-js'
		*
		* throw new PostgrestError({
		*   message: 'Row level security prevented the request',
		*   details: 'RLS denied the insert',
		*   hint: 'Check your policies',
		*   code: 'PGRST301',
		* })
		* ```
		*/
		constructor(context) {
			super(context.message);
			this.name = "PostgrestError";
			this.details = context.details;
			this.hint = context.hint;
			this.code = context.code;
		}
	};
	exports.default = PostgrestError;
}));
//#endregion
//#region node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js
var require_PostgrestBuilder = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var PostgrestError_1 = require_tslib().__importDefault(require_PostgrestError());
	var PostgrestBuilder = class {
		/**
		* Creates a builder configured for a specific PostgREST request.
		*
		* @example
		* ```ts
		* import PostgrestQueryBuilder from '@supabase/postgrest-js'
		*
		* const builder = new PostgrestQueryBuilder(
		*   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
		*   { headers: new Headers({ apikey: 'public-anon-key' }) }
		* )
		* ```
		*/
		constructor(builder) {
			var _a, _b;
			this.shouldThrowOnError = false;
			this.method = builder.method;
			this.url = builder.url;
			this.headers = new Headers(builder.headers);
			this.schema = builder.schema;
			this.body = builder.body;
			this.shouldThrowOnError = (_a = builder.shouldThrowOnError) !== null && _a !== void 0 ? _a : false;
			this.signal = builder.signal;
			this.isMaybeSingle = (_b = builder.isMaybeSingle) !== null && _b !== void 0 ? _b : false;
			if (builder.fetch) this.fetch = builder.fetch;
			else this.fetch = fetch;
		}
		/**
		* If there's an error with the query, throwOnError will reject the promise by
		* throwing the error instead of returning it as part of a successful response.
		*
		* {@link https://github.com/supabase/supabase-js/issues/92}
		*/
		throwOnError() {
			this.shouldThrowOnError = true;
			return this;
		}
		/**
		* Set an HTTP header for the request.
		*/
		setHeader(name, value) {
			this.headers = new Headers(this.headers);
			this.headers.set(name, value);
			return this;
		}
		then(onfulfilled, onrejected) {
			if (this.schema === void 0) {} else if (["GET", "HEAD"].includes(this.method)) this.headers.set("Accept-Profile", this.schema);
			else this.headers.set("Content-Profile", this.schema);
			if (this.method !== "GET" && this.method !== "HEAD") this.headers.set("Content-Type", "application/json");
			const _fetch = this.fetch;
			let res = _fetch(this.url.toString(), {
				method: this.method,
				headers: this.headers,
				body: JSON.stringify(this.body),
				signal: this.signal
			}).then(async (res) => {
				var _a, _b, _c, _d;
				let error = null;
				let data = null;
				let count = null;
				let status = res.status;
				let statusText = res.statusText;
				if (res.ok) {
					if (this.method !== "HEAD") {
						const body = await res.text();
						if (body === "") {} else if (this.headers.get("Accept") === "text/csv") data = body;
						else if (this.headers.get("Accept") && ((_a = this.headers.get("Accept")) === null || _a === void 0 ? void 0 : _a.includes("application/vnd.pgrst.plan+text"))) data = body;
						else data = JSON.parse(body);
					}
					const countHeader = (_b = this.headers.get("Prefer")) === null || _b === void 0 ? void 0 : _b.match(/count=(exact|planned|estimated)/);
					const contentRange = (_c = res.headers.get("content-range")) === null || _c === void 0 ? void 0 : _c.split("/");
					if (countHeader && contentRange && contentRange.length > 1) count = parseInt(contentRange[1]);
					if (this.isMaybeSingle && this.method === "GET" && Array.isArray(data)) if (data.length > 1) {
						error = {
							code: "PGRST116",
							details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
							hint: null,
							message: "JSON object requested, multiple (or no) rows returned"
						};
						data = null;
						count = null;
						status = 406;
						statusText = "Not Acceptable";
					} else if (data.length === 1) data = data[0];
					else data = null;
				} else {
					const body = await res.text();
					try {
						error = JSON.parse(body);
						if (Array.isArray(error) && res.status === 404) {
							data = [];
							error = null;
							status = 200;
							statusText = "OK";
						}
					} catch (_e) {
						if (res.status === 404 && body === "") {
							status = 204;
							statusText = "No Content";
						} else error = { message: body };
					}
					if (error && this.isMaybeSingle && ((_d = error === null || error === void 0 ? void 0 : error.details) === null || _d === void 0 ? void 0 : _d.includes("0 rows"))) {
						error = null;
						status = 200;
						statusText = "OK";
					}
					if (error && this.shouldThrowOnError) throw new PostgrestError_1.default(error);
				}
				return {
					error,
					data,
					count,
					status,
					statusText
				};
			});
			if (!this.shouldThrowOnError) res = res.catch((fetchError) => {
				var _a, _b, _c, _d, _e, _f;
				let errorDetails = "";
				const cause = fetchError === null || fetchError === void 0 ? void 0 : fetchError.cause;
				if (cause) {
					const causeMessage = (_a = cause === null || cause === void 0 ? void 0 : cause.message) !== null && _a !== void 0 ? _a : "";
					const causeCode = (_b = cause === null || cause === void 0 ? void 0 : cause.code) !== null && _b !== void 0 ? _b : "";
					errorDetails = `${(_c = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _c !== void 0 ? _c : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`;
					errorDetails += `\n\nCaused by: ${(_d = cause === null || cause === void 0 ? void 0 : cause.name) !== null && _d !== void 0 ? _d : "Error"}: ${causeMessage}`;
					if (causeCode) errorDetails += ` (${causeCode})`;
					if (cause === null || cause === void 0 ? void 0 : cause.stack) errorDetails += `\n${cause.stack}`;
				} else errorDetails = (_e = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _e !== void 0 ? _e : "";
				return {
					error: {
						message: `${(_f = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _f !== void 0 ? _f : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
						details: errorDetails,
						hint: "",
						code: ""
					},
					data: null,
					count: null,
					status: 0,
					statusText: ""
				};
			});
			return res.then(onfulfilled, onrejected);
		}
		/**
		* Override the type of the returned `data`.
		*
		* @typeParam NewResult - The new result type to override with
		* @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
		*/
		returns() {
			/* istanbul ignore next */
			return this;
		}
		/**
		* Override the type of the returned `data` field in the response.
		*
		* @typeParam NewResult - The new type to cast the response data to
		* @typeParam Options - Optional type configuration (defaults to { merge: true })
		* @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
		* @example
		* ```typescript
		* // Merge with existing types (default behavior)
		* const query = supabase
		*   .from('users')
		*   .select()
		*   .overrideTypes<{ custom_field: string }>()
		*
		* // Replace existing types completely
		* const replaceQuery = supabase
		*   .from('users')
		*   .select()
		*   .overrideTypes<{ id: number; name: string }, { merge: false }>()
		* ```
		* @returns A PostgrestBuilder instance with the new type
		*/
		overrideTypes() {
			return this;
		}
	};
	exports.default = PostgrestBuilder;
}));
//#endregion
//#region node_modules/@supabase/postgrest-js/dist/cjs/PostgrestTransformBuilder.js
var require_PostgrestTransformBuilder = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var PostgrestBuilder_1 = require_tslib().__importDefault(require_PostgrestBuilder());
	var PostgrestTransformBuilder = class extends PostgrestBuilder_1.default {
		/**
		* Perform a SELECT on the query result.
		*
		* By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
		* return modified rows. By calling this method, modified rows are returned in
		* `data`.
		*
		* @param columns - The columns to retrieve, separated by commas
		*/
		select(columns) {
			let quoted = false;
			const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
				if (/\s/.test(c) && !quoted) return "";
				if (c === "\"") quoted = !quoted;
				return c;
			}).join("");
			this.url.searchParams.set("select", cleanedColumns);
			this.headers.append("Prefer", "return=representation");
			return this;
		}
		/**
		* Order the query result by `column`.
		*
		* You can call this method multiple times to order by multiple columns.
		*
		* You can order referenced tables, but it only affects the ordering of the
		* parent table if you use `!inner` in the query.
		*
		* @param column - The column to order by
		* @param options - Named parameters
		* @param options.ascending - If `true`, the result will be in ascending order
		* @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
		* `null`s appear last.
		* @param options.referencedTable - Set this to order a referenced table by
		* its columns
		* @param options.foreignTable - Deprecated, use `options.referencedTable`
		* instead
		*/
		order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
			const key = referencedTable ? `${referencedTable}.order` : "order";
			const existingOrder = this.url.searchParams.get(key);
			this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
			return this;
		}
		/**
		* Limit the query result by `count`.
		*
		* @param count - The maximum number of rows to return
		* @param options - Named parameters
		* @param options.referencedTable - Set this to limit rows of referenced
		* tables instead of the parent table
		* @param options.foreignTable - Deprecated, use `options.referencedTable`
		* instead
		*/
		limit(count, { foreignTable, referencedTable = foreignTable } = {}) {
			const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
			this.url.searchParams.set(key, `${count}`);
			return this;
		}
		/**
		* Limit the query result by starting at an offset `from` and ending at the offset `to`.
		* Only records within this range are returned.
		* This respects the query order and if there is no order clause the range could behave unexpectedly.
		* The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
		* and fourth rows of the query.
		*
		* @param from - The starting index from which to limit the result
		* @param to - The last index to which to limit the result
		* @param options - Named parameters
		* @param options.referencedTable - Set this to limit rows of referenced
		* tables instead of the parent table
		* @param options.foreignTable - Deprecated, use `options.referencedTable`
		* instead
		*/
		range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
			const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
			const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
			this.url.searchParams.set(keyOffset, `${from}`);
			this.url.searchParams.set(keyLimit, `${to - from + 1}`);
			return this;
		}
		/**
		* Set the AbortSignal for the fetch request.
		*
		* @param signal - The AbortSignal to use for the fetch request
		*/
		abortSignal(signal) {
			this.signal = signal;
			return this;
		}
		/**
		* Return `data` as a single object instead of an array of objects.
		*
		* Query result must be one row (e.g. using `.limit(1)`), otherwise this
		* returns an error.
		*/
		single() {
			this.headers.set("Accept", "application/vnd.pgrst.object+json");
			return this;
		}
		/**
		* Return `data` as a single object instead of an array of objects.
		*
		* Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
		* this returns an error.
		*/
		maybeSingle() {
			if (this.method === "GET") this.headers.set("Accept", "application/json");
			else this.headers.set("Accept", "application/vnd.pgrst.object+json");
			this.isMaybeSingle = true;
			return this;
		}
		/**
		* Return `data` as a string in CSV format.
		*/
		csv() {
			this.headers.set("Accept", "text/csv");
			return this;
		}
		/**
		* Return `data` as an object in [GeoJSON](https://geojson.org) format.
		*/
		geojson() {
			this.headers.set("Accept", "application/geo+json");
			return this;
		}
		/**
		* Return `data` as the EXPLAIN plan for the query.
		*
		* You need to enable the
		* [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
		* setting before using this method.
		*
		* @param options - Named parameters
		*
		* @param options.analyze - If `true`, the query will be executed and the
		* actual run time will be returned
		*
		* @param options.verbose - If `true`, the query identifier will be returned
		* and `data` will include the output columns of the query
		*
		* @param options.settings - If `true`, include information on configuration
		* parameters that affect query planning
		*
		* @param options.buffers - If `true`, include information on buffer usage
		*
		* @param options.wal - If `true`, include information on WAL record generation
		*
		* @param options.format - The format of the output, can be `"text"` (default)
		* or `"json"`
		*/
		explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
			var _a;
			const options = [
				analyze ? "analyze" : null,
				verbose ? "verbose" : null,
				settings ? "settings" : null,
				buffers ? "buffers" : null,
				wal ? "wal" : null
			].filter(Boolean).join("|");
			const forMediatype = (_a = this.headers.get("Accept")) !== null && _a !== void 0 ? _a : "application/json";
			this.headers.set("Accept", `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options};`);
			if (format === "json") return this;
			else return this;
		}
		/**
		* Rollback the query.
		*
		* `data` will still be returned, but the query is not committed.
		*/
		rollback() {
			this.headers.append("Prefer", "tx=rollback");
			return this;
		}
		/**
		* Override the type of the returned `data`.
		*
		* @typeParam NewResult - The new result type to override with
		* @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
		*/
		returns() {
			return this;
		}
		/**
		* Set the maximum number of rows that can be affected by the query.
		* Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
		*
		* @param value - The maximum number of rows that can be affected
		*/
		maxAffected(value) {
			this.headers.append("Prefer", "handling=strict");
			this.headers.append("Prefer", `max-affected=${value}`);
			return this;
		}
	};
	exports.default = PostgrestTransformBuilder;
}));
//#endregion
//#region node_modules/@supabase/postgrest-js/dist/cjs/PostgrestFilterBuilder.js
var require_PostgrestFilterBuilder = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var PostgrestTransformBuilder_1 = require_tslib().__importDefault(require_PostgrestTransformBuilder());
	var PostgrestReservedCharsRegexp = /* @__PURE__ */ new RegExp("[,()]");
	var PostgrestFilterBuilder = class extends PostgrestTransformBuilder_1.default {
		/**
		* Match only rows where `column` is equal to `value`.
		*
		* To check if the value of `column` is NULL, you should use `.is()` instead.
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		eq(column, value) {
			this.url.searchParams.append(column, `eq.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` is not equal to `value`.
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		neq(column, value) {
			this.url.searchParams.append(column, `neq.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` is greater than `value`.
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		gt(column, value) {
			this.url.searchParams.append(column, `gt.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` is greater than or equal to `value`.
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		gte(column, value) {
			this.url.searchParams.append(column, `gte.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` is less than `value`.
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		lt(column, value) {
			this.url.searchParams.append(column, `lt.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` is less than or equal to `value`.
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		lte(column, value) {
			this.url.searchParams.append(column, `lte.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` matches `pattern` case-sensitively.
		*
		* @param column - The column to filter on
		* @param pattern - The pattern to match with
		*/
		like(column, pattern) {
			this.url.searchParams.append(column, `like.${pattern}`);
			return this;
		}
		/**
		* Match only rows where `column` matches all of `patterns` case-sensitively.
		*
		* @param column - The column to filter on
		* @param patterns - The patterns to match with
		*/
		likeAllOf(column, patterns) {
			this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
			return this;
		}
		/**
		* Match only rows where `column` matches any of `patterns` case-sensitively.
		*
		* @param column - The column to filter on
		* @param patterns - The patterns to match with
		*/
		likeAnyOf(column, patterns) {
			this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
			return this;
		}
		/**
		* Match only rows where `column` matches `pattern` case-insensitively.
		*
		* @param column - The column to filter on
		* @param pattern - The pattern to match with
		*/
		ilike(column, pattern) {
			this.url.searchParams.append(column, `ilike.${pattern}`);
			return this;
		}
		/**
		* Match only rows where `column` matches all of `patterns` case-insensitively.
		*
		* @param column - The column to filter on
		* @param patterns - The patterns to match with
		*/
		ilikeAllOf(column, patterns) {
			this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
			return this;
		}
		/**
		* Match only rows where `column` matches any of `patterns` case-insensitively.
		*
		* @param column - The column to filter on
		* @param patterns - The patterns to match with
		*/
		ilikeAnyOf(column, patterns) {
			this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
			return this;
		}
		/**
		* Match only rows where `column` matches the PostgreSQL regex `pattern`
		* case-sensitively (using the `~` operator).
		*
		* @param column - The column to filter on
		* @param pattern - The PostgreSQL regular expression pattern to match with
		*/
		regexMatch(column, pattern) {
			this.url.searchParams.append(column, `match.${pattern}`);
			return this;
		}
		/**
		* Match only rows where `column` matches the PostgreSQL regex `pattern`
		* case-insensitively (using the `~*` operator).
		*
		* @param column - The column to filter on
		* @param pattern - The PostgreSQL regular expression pattern to match with
		*/
		regexIMatch(column, pattern) {
			this.url.searchParams.append(column, `imatch.${pattern}`);
			return this;
		}
		/**
		* Match only rows where `column` IS `value`.
		*
		* For non-boolean columns, this is only relevant for checking if the value of
		* `column` is NULL by setting `value` to `null`.
		*
		* For boolean columns, you can also set `value` to `true` or `false` and it
		* will behave the same way as `.eq()`.
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		is(column, value) {
			this.url.searchParams.append(column, `is.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` IS DISTINCT FROM `value`.
		*
		* Unlike `.neq()`, this treats `NULL` as a comparable value. Two `NULL` values
		* are considered equal (not distinct), and comparing `NULL` with any non-NULL
		* value returns true (distinct).
		*
		* @param column - The column to filter on
		* @param value - The value to filter with
		*/
		isDistinct(column, value) {
			this.url.searchParams.append(column, `isdistinct.${value}`);
			return this;
		}
		/**
		* Match only rows where `column` is included in the `values` array.
		*
		* @param column - The column to filter on
		* @param values - The values array to filter with
		*/
		in(column, values) {
			const cleanedValues = Array.from(new Set(values)).map((s) => {
				if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s)) return `"${s}"`;
				else return `${s}`;
			}).join(",");
			this.url.searchParams.append(column, `in.(${cleanedValues})`);
			return this;
		}
		/**
		* Only relevant for jsonb, array, and range columns. Match only rows where
		* `column` contains every element appearing in `value`.
		*
		* @param column - The jsonb, array, or range column to filter on
		* @param value - The jsonb, array, or range value to filter with
		*/
		contains(column, value) {
			if (typeof value === "string") this.url.searchParams.append(column, `cs.${value}`);
			else if (Array.isArray(value)) this.url.searchParams.append(column, `cs.{${value.join(",")}}`);
			else this.url.searchParams.append(column, `cs.${JSON.stringify(value)}`);
			return this;
		}
		/**
		* Only relevant for jsonb, array, and range columns. Match only rows where
		* every element appearing in `column` is contained by `value`.
		*
		* @param column - The jsonb, array, or range column to filter on
		* @param value - The jsonb, array, or range value to filter with
		*/
		containedBy(column, value) {
			if (typeof value === "string") this.url.searchParams.append(column, `cd.${value}`);
			else if (Array.isArray(value)) this.url.searchParams.append(column, `cd.{${value.join(",")}}`);
			else this.url.searchParams.append(column, `cd.${JSON.stringify(value)}`);
			return this;
		}
		/**
		* Only relevant for range columns. Match only rows where every element in
		* `column` is greater than any element in `range`.
		*
		* @param column - The range column to filter on
		* @param range - The range to filter with
		*/
		rangeGt(column, range) {
			this.url.searchParams.append(column, `sr.${range}`);
			return this;
		}
		/**
		* Only relevant for range columns. Match only rows where every element in
		* `column` is either contained in `range` or greater than any element in
		* `range`.
		*
		* @param column - The range column to filter on
		* @param range - The range to filter with
		*/
		rangeGte(column, range) {
			this.url.searchParams.append(column, `nxl.${range}`);
			return this;
		}
		/**
		* Only relevant for range columns. Match only rows where every element in
		* `column` is less than any element in `range`.
		*
		* @param column - The range column to filter on
		* @param range - The range to filter with
		*/
		rangeLt(column, range) {
			this.url.searchParams.append(column, `sl.${range}`);
			return this;
		}
		/**
		* Only relevant for range columns. Match only rows where every element in
		* `column` is either contained in `range` or less than any element in
		* `range`.
		*
		* @param column - The range column to filter on
		* @param range - The range to filter with
		*/
		rangeLte(column, range) {
			this.url.searchParams.append(column, `nxr.${range}`);
			return this;
		}
		/**
		* Only relevant for range columns. Match only rows where `column` is
		* mutually exclusive to `range` and there can be no element between the two
		* ranges.
		*
		* @param column - The range column to filter on
		* @param range - The range to filter with
		*/
		rangeAdjacent(column, range) {
			this.url.searchParams.append(column, `adj.${range}`);
			return this;
		}
		/**
		* Only relevant for array and range columns. Match only rows where
		* `column` and `value` have an element in common.
		*
		* @param column - The array or range column to filter on
		* @param value - The array or range value to filter with
		*/
		overlaps(column, value) {
			if (typeof value === "string") this.url.searchParams.append(column, `ov.${value}`);
			else this.url.searchParams.append(column, `ov.{${value.join(",")}}`);
			return this;
		}
		/**
		* Only relevant for text and tsvector columns. Match only rows where
		* `column` matches the query string in `query`.
		*
		* @param column - The text or tsvector column to filter on
		* @param query - The query text to match with
		* @param options - Named parameters
		* @param options.config - The text search configuration to use
		* @param options.type - Change how the `query` text is interpreted
		*/
		textSearch(column, query, { config, type } = {}) {
			let typePart = "";
			if (type === "plain") typePart = "pl";
			else if (type === "phrase") typePart = "ph";
			else if (type === "websearch") typePart = "w";
			const configPart = config === void 0 ? "" : `(${config})`;
			this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
			return this;
		}
		/**
		* Match only rows where each column in `query` keys is equal to its
		* associated value. Shorthand for multiple `.eq()`s.
		*
		* @param query - The object to filter with, with column names as keys mapped
		* to their filter values
		*/
		match(query) {
			Object.entries(query).forEach(([column, value]) => {
				this.url.searchParams.append(column, `eq.${value}`);
			});
			return this;
		}
		/**
		* Match only rows which doesn't satisfy the filter.
		*
		* Unlike most filters, `opearator` and `value` are used as-is and need to
		* follow [PostgREST
		* syntax](https://postgrest.org/en/stable/api.html#operators). You also need
		* to make sure they are properly sanitized.
		*
		* @param column - The column to filter on
		* @param operator - The operator to be negated to filter with, following
		* PostgREST syntax
		* @param value - The value to filter with, following PostgREST syntax
		*/
		not(column, operator, value) {
			this.url.searchParams.append(column, `not.${operator}.${value}`);
			return this;
		}
		/**
		* Match only rows which satisfy at least one of the filters.
		*
		* Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
		* syntax](https://postgrest.org/en/stable/api.html#operators). You also need
		* to make sure it's properly sanitized.
		*
		* It's currently not possible to do an `.or()` filter across multiple tables.
		*
		* @param filters - The filters to use, following PostgREST syntax
		* @param options - Named parameters
		* @param options.referencedTable - Set this to filter on referenced tables
		* instead of the parent table
		* @param options.foreignTable - Deprecated, use `referencedTable` instead
		*/
		or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
			const key = referencedTable ? `${referencedTable}.or` : "or";
			this.url.searchParams.append(key, `(${filters})`);
			return this;
		}
		/**
		* Match only rows which satisfy the filter. This is an escape hatch - you
		* should use the specific filter methods wherever possible.
		*
		* Unlike most filters, `opearator` and `value` are used as-is and need to
		* follow [PostgREST
		* syntax](https://postgrest.org/en/stable/api.html#operators). You also need
		* to make sure they are properly sanitized.
		*
		* @param column - The column to filter on
		* @param operator - The operator to filter with, following PostgREST syntax
		* @param value - The value to filter with, following PostgREST syntax
		*/
		filter(column, operator, value) {
			this.url.searchParams.append(column, `${operator}.${value}`);
			return this;
		}
	};
	exports.default = PostgrestFilterBuilder;
}));
//#endregion
//#region node_modules/@supabase/postgrest-js/dist/cjs/PostgrestQueryBuilder.js
var require_PostgrestQueryBuilder = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var PostgrestFilterBuilder_1 = require_tslib().__importDefault(require_PostgrestFilterBuilder());
	var PostgrestQueryBuilder = class {
		/**
		* Creates a query builder scoped to a Postgres table or view.
		*
		* @example
		* ```ts
		* import PostgrestQueryBuilder from '@supabase/postgrest-js'
		*
		* const query = new PostgrestQueryBuilder(
		*   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
		*   { headers: { apikey: 'public-anon-key' } }
		* )
		* ```
		*/
		constructor(url, { headers = {}, schema, fetch }) {
			this.url = url;
			this.headers = new Headers(headers);
			this.schema = schema;
			this.fetch = fetch;
		}
		/**
		* Perform a SELECT query on the table or view.
		*
		* @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
		*
		* @param options - Named parameters
		*
		* @param options.head - When set to `true`, `data` will not be returned.
		* Useful if you only need the count.
		*
		* @param options.count - Count algorithm to use to count rows in the table or view.
		*
		* `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
		* hood.
		*
		* `"planned"`: Approximated but fast count algorithm. Uses the Postgres
		* statistics under the hood.
		*
		* `"estimated"`: Uses exact count for low numbers and planned count for high
		* numbers.
		*/
		select(columns, options) {
			const { head = false, count } = options !== null && options !== void 0 ? options : {};
			const method = head ? "HEAD" : "GET";
			let quoted = false;
			const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
				if (/\s/.test(c) && !quoted) return "";
				if (c === "\"") quoted = !quoted;
				return c;
			}).join("");
			this.url.searchParams.set("select", cleanedColumns);
			if (count) this.headers.append("Prefer", `count=${count}`);
			return new PostgrestFilterBuilder_1.default({
				method,
				url: this.url,
				headers: this.headers,
				schema: this.schema,
				fetch: this.fetch
			});
		}
		/**
		* Perform an INSERT into the table or view.
		*
		* By default, inserted rows are not returned. To return it, chain the call
		* with `.select()`.
		*
		* @param values - The values to insert. Pass an object to insert a single row
		* or an array to insert multiple rows.
		*
		* @param options - Named parameters
		*
		* @param options.count - Count algorithm to use to count inserted rows.
		*
		* `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
		* hood.
		*
		* `"planned"`: Approximated but fast count algorithm. Uses the Postgres
		* statistics under the hood.
		*
		* `"estimated"`: Uses exact count for low numbers and planned count for high
		* numbers.
		*
		* @param options.defaultToNull - Make missing fields default to `null`.
		* Otherwise, use the default value for the column. Only applies for bulk
		* inserts.
		*/
		insert(values, { count, defaultToNull = true } = {}) {
			var _a;
			const method = "POST";
			if (count) this.headers.append("Prefer", `count=${count}`);
			if (!defaultToNull) this.headers.append("Prefer", `missing=default`);
			if (Array.isArray(values)) {
				const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
				if (columns.length > 0) {
					const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
					this.url.searchParams.set("columns", uniqueColumns.join(","));
				}
			}
			return new PostgrestFilterBuilder_1.default({
				method,
				url: this.url,
				headers: this.headers,
				schema: this.schema,
				body: values,
				fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
			});
		}
		/**
		* Perform an UPSERT on the table or view. Depending on the column(s) passed
		* to `onConflict`, `.upsert()` allows you to perform the equivalent of
		* `.insert()` if a row with the corresponding `onConflict` columns doesn't
		* exist, or if it does exist, perform an alternative action depending on
		* `ignoreDuplicates`.
		*
		* By default, upserted rows are not returned. To return it, chain the call
		* with `.select()`.
		*
		* @param values - The values to upsert with. Pass an object to upsert a
		* single row or an array to upsert multiple rows.
		*
		* @param options - Named parameters
		*
		* @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
		* duplicate rows are determined. Two rows are duplicates if all the
		* `onConflict` columns are equal.
		*
		* @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
		* `false`, duplicate rows are merged with existing rows.
		*
		* @param options.count - Count algorithm to use to count upserted rows.
		*
		* `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
		* hood.
		*
		* `"planned"`: Approximated but fast count algorithm. Uses the Postgres
		* statistics under the hood.
		*
		* `"estimated"`: Uses exact count for low numbers and planned count for high
		* numbers.
		*
		* @param options.defaultToNull - Make missing fields default to `null`.
		* Otherwise, use the default value for the column. This only applies when
		* inserting new rows, not when merging with existing rows under
		* `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
		*
		* @example Upsert a single row using a unique key
		* ```ts
		* // Upserting a single row, overwriting based on the 'username' unique column
		* const { data, error } = await supabase
		*   .from('users')
		*   .upsert({ username: 'supabot' }, { onConflict: 'username' })
		*
		* // Example response:
		* // {
		* //   data: [
		* //     { id: 4, message: 'bar', username: 'supabot' }
		* //   ],
		* //   error: null
		* // }
		* ```
		*
		* @example Upsert with conflict resolution and exact row counting
		* ```ts
		* // Upserting and returning exact count
		* const { data, error, count } = await supabase
		*   .from('users')
		*   .upsert(
		*     {
		*       id: 3,
		*       message: 'foo',
		*       username: 'supabot'
		*     },
		*     {
		*       onConflict: 'username',
		*       count: 'exact'
		*     }
		*   )
		*
		* // Example response:
		* // {
		* //   data: [
		* //     {
		* //       id: 42,
		* //       handle: "saoirse",
		* //       display_name: "Saoirse"
		* //     }
		* //   ],
		* //   count: 1,
		* //   error: null
		* // }
		* ```
		*/
		upsert(values, { onConflict, ignoreDuplicates = false, count, defaultToNull = true } = {}) {
			var _a;
			const method = "POST";
			this.headers.append("Prefer", `resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`);
			if (onConflict !== void 0) this.url.searchParams.set("on_conflict", onConflict);
			if (count) this.headers.append("Prefer", `count=${count}`);
			if (!defaultToNull) this.headers.append("Prefer", "missing=default");
			if (Array.isArray(values)) {
				const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
				if (columns.length > 0) {
					const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
					this.url.searchParams.set("columns", uniqueColumns.join(","));
				}
			}
			return new PostgrestFilterBuilder_1.default({
				method,
				url: this.url,
				headers: this.headers,
				schema: this.schema,
				body: values,
				fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
			});
		}
		/**
		* Perform an UPDATE on the table or view.
		*
		* By default, updated rows are not returned. To return it, chain the call
		* with `.select()` after filters.
		*
		* @param values - The values to update with
		*
		* @param options - Named parameters
		*
		* @param options.count - Count algorithm to use to count updated rows.
		*
		* `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
		* hood.
		*
		* `"planned"`: Approximated but fast count algorithm. Uses the Postgres
		* statistics under the hood.
		*
		* `"estimated"`: Uses exact count for low numbers and planned count for high
		* numbers.
		*/
		update(values, { count } = {}) {
			var _a;
			const method = "PATCH";
			if (count) this.headers.append("Prefer", `count=${count}`);
			return new PostgrestFilterBuilder_1.default({
				method,
				url: this.url,
				headers: this.headers,
				schema: this.schema,
				body: values,
				fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
			});
		}
		/**
		* Perform a DELETE on the table or view.
		*
		* By default, deleted rows are not returned. To return it, chain the call
		* with `.select()` after filters.
		*
		* @param options - Named parameters
		*
		* @param options.count - Count algorithm to use to count deleted rows.
		*
		* `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
		* hood.
		*
		* `"planned"`: Approximated but fast count algorithm. Uses the Postgres
		* statistics under the hood.
		*
		* `"estimated"`: Uses exact count for low numbers and planned count for high
		* numbers.
		*/
		delete({ count } = {}) {
			var _a;
			const method = "DELETE";
			if (count) this.headers.append("Prefer", `count=${count}`);
			return new PostgrestFilterBuilder_1.default({
				method,
				url: this.url,
				headers: this.headers,
				schema: this.schema,
				fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
			});
		}
	};
	exports.default = PostgrestQueryBuilder;
}));
//#endregion
//#region node_modules/@supabase/postgrest-js/dist/cjs/PostgrestClient.js
var require_PostgrestClient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var tslib_1 = require_tslib();
	var PostgrestQueryBuilder_1 = tslib_1.__importDefault(require_PostgrestQueryBuilder());
	var PostgrestFilterBuilder_1 = tslib_1.__importDefault(require_PostgrestFilterBuilder());
	exports.default = class PostgrestClient {
		/**
		* Creates a PostgREST client.
		*
		* @param url - URL of the PostgREST endpoint
		* @param options - Named parameters
		* @param options.headers - Custom headers
		* @param options.schema - Postgres schema to switch to
		* @param options.fetch - Custom fetch
		* @example
		* ```ts
		* import PostgrestClient from '@supabase/postgrest-js'
		*
		* const postgrest = new PostgrestClient('https://xyzcompany.supabase.co/rest/v1', {
		*   headers: { apikey: 'public-anon-key' },
		*   schema: 'public',
		* })
		* ```
		*/
		constructor(url, { headers = {}, schema, fetch } = {}) {
			this.url = url;
			this.headers = new Headers(headers);
			this.schemaName = schema;
			this.fetch = fetch;
		}
		/**
		* Perform a query on a table or a view.
		*
		* @param relation - The table or view name to query
		*/
		from(relation) {
			if (!relation || typeof relation !== "string" || relation.trim() === "") throw new Error("Invalid relation name: relation must be a non-empty string.");
			const url = new URL(`${this.url}/${relation}`);
			return new PostgrestQueryBuilder_1.default(url, {
				headers: new Headers(this.headers),
				schema: this.schemaName,
				fetch: this.fetch
			});
		}
		/**
		* Select a schema to query or perform an function (rpc) call.
		*
		* The schema needs to be on the list of exposed schemas inside Supabase.
		*
		* @param schema - The schema to query
		*/
		schema(schema) {
			return new PostgrestClient(this.url, {
				headers: this.headers,
				schema,
				fetch: this.fetch
			});
		}
		/**
		* Perform a function call.
		*
		* @param fn - The function name to call
		* @param args - The arguments to pass to the function call
		* @param options - Named parameters
		* @param options.head - When set to `true`, `data` will not be returned.
		* Useful if you only need the count.
		* @param options.get - When set to `true`, the function will be called with
		* read-only access mode.
		* @param options.count - Count algorithm to use to count rows returned by the
		* function. Only applicable for [set-returning
		* functions](https://www.postgresql.org/docs/current/functions-srf.html).
		*
		* `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
		* hood.
		*
		* `"planned"`: Approximated but fast count algorithm. Uses the Postgres
		* statistics under the hood.
		*
		* `"estimated"`: Uses exact count for low numbers and planned count for high
		* numbers.
		*
		* @example
		* ```ts
		* // For cross-schema functions where type inference fails, use overrideTypes:
		* const { data } = await supabase
		*   .schema('schema_b')
		*   .rpc('function_a', {})
		*   .overrideTypes<{ id: string; user_id: string }[]>()
		* ```
		*/
		rpc(fn, args = {}, { head = false, get = false, count } = {}) {
			var _a;
			let method;
			const url = new URL(`${this.url}/rpc/${fn}`);
			let body;
			if (head || get) {
				method = head ? "HEAD" : "GET";
				Object.entries(args).filter(([_, value]) => value !== void 0).map(([name, value]) => [name, Array.isArray(value) ? `{${value.join(",")}}` : `${value}`]).forEach(([name, value]) => {
					url.searchParams.append(name, value);
				});
			} else {
				method = "POST";
				body = args;
			}
			const headers = new Headers(this.headers);
			if (count) headers.set("Prefer", `count=${count}`);
			return new PostgrestFilterBuilder_1.default({
				method,
				url,
				headers,
				schema: this.schemaName,
				body,
				fetch: (_a = this.fetch) !== null && _a !== void 0 ? _a : fetch
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/postgrest-js/dist/cjs/index.js
var require_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PostgrestError = exports.PostgrestBuilder = exports.PostgrestTransformBuilder = exports.PostgrestFilterBuilder = exports.PostgrestQueryBuilder = exports.PostgrestClient = void 0;
	var tslib_1 = require_tslib();
	var PostgrestClient_1 = tslib_1.__importDefault(require_PostgrestClient());
	exports.PostgrestClient = PostgrestClient_1.default;
	var PostgrestQueryBuilder_1 = tslib_1.__importDefault(require_PostgrestQueryBuilder());
	exports.PostgrestQueryBuilder = PostgrestQueryBuilder_1.default;
	var PostgrestFilterBuilder_1 = tslib_1.__importDefault(require_PostgrestFilterBuilder());
	exports.PostgrestFilterBuilder = PostgrestFilterBuilder_1.default;
	var PostgrestTransformBuilder_1 = tslib_1.__importDefault(require_PostgrestTransformBuilder());
	exports.PostgrestTransformBuilder = PostgrestTransformBuilder_1.default;
	var PostgrestBuilder_1 = tslib_1.__importDefault(require_PostgrestBuilder());
	exports.PostgrestBuilder = PostgrestBuilder_1.default;
	var PostgrestError_1 = tslib_1.__importDefault(require_PostgrestError());
	exports.PostgrestError = PostgrestError_1.default;
	exports.default = {
		PostgrestClient: PostgrestClient_1.default,
		PostgrestQueryBuilder: PostgrestQueryBuilder_1.default,
		PostgrestFilterBuilder: PostgrestFilterBuilder_1.default,
		PostgrestTransformBuilder: PostgrestTransformBuilder_1.default,
		PostgrestBuilder: PostgrestBuilder_1.default,
		PostgrestError: PostgrestError_1.default
	};
}));
//#endregion
export { globalthis_default as n, init_globalthis as r, require_cjs as t };
