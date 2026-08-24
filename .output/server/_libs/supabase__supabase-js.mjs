import { a as __toCommonJS, o as __toESM, t as __commonJSMin } from "../_runtime.mjs";
import { n as module_exports, t as init_module } from "./supabase__functions-js.mjs";
import { t as require_cjs } from "./supabase__postgrest-js.mjs";
import { n as module_exports$1, t as init_module$1 } from "./supabase__realtime-js.mjs";
import { n as module_exports$2, t as init_module$2 } from "./@supabase/storage-js+[...].mjs";
import { n as module_exports$3, t as init_module$3 } from "./supabase__auth-js.mjs";
//#region node_modules/@supabase/supabase-js/dist/main/lib/version.js
var require_version = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.version = void 0;
	exports.version = "2.86.2";
}));
//#endregion
//#region node_modules/@supabase/supabase-js/dist/main/lib/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DEFAULT_REALTIME_OPTIONS = exports.DEFAULT_AUTH_OPTIONS = exports.DEFAULT_DB_OPTIONS = exports.DEFAULT_GLOBAL_OPTIONS = exports.DEFAULT_HEADERS = void 0;
	var version_1 = require_version();
	var JS_ENV = "";
	if (typeof Deno !== "undefined") JS_ENV = "deno";
	else if (typeof document !== "undefined") JS_ENV = "web";
	else if (typeof navigator !== "undefined" && navigator.product === "ReactNative") JS_ENV = "react-native";
	else JS_ENV = "node";
	exports.DEFAULT_HEADERS = { "X-Client-Info": `supabase-js-${JS_ENV}/${version_1.version}` };
	exports.DEFAULT_GLOBAL_OPTIONS = { headers: exports.DEFAULT_HEADERS };
	exports.DEFAULT_DB_OPTIONS = { schema: "public" };
	exports.DEFAULT_AUTH_OPTIONS = {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		flowType: "implicit"
	};
	exports.DEFAULT_REALTIME_OPTIONS = {};
}));
//#endregion
//#region node_modules/@supabase/supabase-js/dist/main/lib/fetch.js
var require_fetch = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.fetchWithAuth = exports.resolveHeadersConstructor = exports.resolveFetch = void 0;
	var resolveFetch = (customFetch) => {
		if (customFetch) return (...args) => customFetch(...args);
		return (...args) => fetch(...args);
	};
	exports.resolveFetch = resolveFetch;
	var resolveHeadersConstructor = () => {
		return Headers;
	};
	exports.resolveHeadersConstructor = resolveHeadersConstructor;
	var fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
		const fetch = (0, exports.resolveFetch)(customFetch);
		const HeadersConstructor = (0, exports.resolveHeadersConstructor)();
		return async (input, init) => {
			var _a;
			const accessToken = (_a = await getAccessToken()) !== null && _a !== void 0 ? _a : supabaseKey;
			let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
			if (!headers.has("apikey")) headers.set("apikey", supabaseKey);
			if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
			return fetch(input, Object.assign(Object.assign({}, init), { headers }));
		};
	};
	exports.fetchWithAuth = fetchWithAuth;
}));
//#endregion
//#region node_modules/@supabase/supabase-js/dist/main/lib/helpers.js
var require_helpers = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isBrowser = void 0;
	exports.uuid = uuid;
	exports.ensureTrailingSlash = ensureTrailingSlash;
	exports.applySettingDefaults = applySettingDefaults;
	exports.validateSupabaseUrl = validateSupabaseUrl;
	function uuid() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0;
			return (c == "x" ? r : r & 3 | 8).toString(16);
		});
	}
	function ensureTrailingSlash(url) {
		return url.endsWith("/") ? url : url + "/";
	}
	var isBrowser = () => typeof window !== "undefined";
	exports.isBrowser = isBrowser;
	function applySettingDefaults(options, defaults) {
		var _a, _b;
		const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions } = options;
		const { db: DEFAULT_DB_OPTIONS, auth: DEFAULT_AUTH_OPTIONS, realtime: DEFAULT_REALTIME_OPTIONS, global: DEFAULT_GLOBAL_OPTIONS } = defaults;
		const result = {
			db: Object.assign(Object.assign({}, DEFAULT_DB_OPTIONS), dbOptions),
			auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), authOptions),
			realtime: Object.assign(Object.assign({}, DEFAULT_REALTIME_OPTIONS), realtimeOptions),
			storage: {},
			global: Object.assign(Object.assign(Object.assign({}, DEFAULT_GLOBAL_OPTIONS), globalOptions), { headers: Object.assign(Object.assign({}, (_a = DEFAULT_GLOBAL_OPTIONS === null || DEFAULT_GLOBAL_OPTIONS === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS.headers) !== null && _a !== void 0 ? _a : {}), (_b = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _b !== void 0 ? _b : {}) }),
			accessToken: async () => ""
		};
		if (options.accessToken) result.accessToken = options.accessToken;
		else delete result.accessToken;
		return result;
	}
	/**
	* Validates a Supabase client URL
	*
	* @param {string} supabaseUrl - The Supabase client URL string.
	* @returns {URL} - The validated base URL.
	* @throws {Error}
	*/
	function validateSupabaseUrl(supabaseUrl) {
		const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
		if (!trimmedUrl) throw new Error("supabaseUrl is required.");
		if (!trimmedUrl.match(/^https?:\/\//i)) throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
		try {
			return new URL(ensureTrailingSlash(trimmedUrl));
		} catch (_a) {
			throw Error("Invalid supabaseUrl: Provided URL is malformed.");
		}
	}
}));
//#endregion
//#region node_modules/@supabase/supabase-js/dist/main/lib/SupabaseAuthClient.js
var require_SupabaseAuthClient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SupabaseAuthClient = void 0;
	var auth_js_1 = (init_module$3(), __toCommonJS(module_exports$3));
	var SupabaseAuthClient = class extends auth_js_1.AuthClient {
		constructor(options) {
			super(options);
		}
	};
	exports.SupabaseAuthClient = SupabaseAuthClient;
}));
//#endregion
//#region node_modules/@supabase/supabase-js/dist/main/SupabaseClient.js
var require_SupabaseClient = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var functions_js_1 = (init_module(), __toCommonJS(module_exports));
	var postgrest_js_1 = require_cjs();
	var realtime_js_1 = (init_module$1(), __toCommonJS(module_exports$1));
	var storage_js_1 = (init_module$2(), __toCommonJS(module_exports$2));
	var constants_1 = require_constants();
	var fetch_1 = require_fetch();
	var helpers_1 = require_helpers();
	var SupabaseAuthClient_1 = require_SupabaseAuthClient();
	/**
	* Supabase Client.
	*
	* An isomorphic Javascript client for interacting with Postgres.
	*/
	var SupabaseClient = class {
		/**
		* Create a new client for use in the browser.
		* @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
		* @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
		* @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
		* @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
		* @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
		* @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
		* @param options.realtime Options passed along to realtime-js constructor.
		* @param options.storage Options passed along to the storage-js constructor.
		* @param options.global.fetch A custom fetch implementation.
		* @param options.global.headers Any additional headers to send with each network request.
		* @example
		* ```ts
		* import { createClient } from '@supabase/supabase-js'
		*
		* const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
		* const { data } = await supabase.from('profiles').select('*')
		* ```
		*/
		constructor(supabaseUrl, supabaseKey, options) {
			var _a, _b, _c;
			this.supabaseUrl = supabaseUrl;
			this.supabaseKey = supabaseKey;
			const baseUrl = (0, helpers_1.validateSupabaseUrl)(supabaseUrl);
			if (!supabaseKey) throw new Error("supabaseKey is required.");
			this.realtimeUrl = new URL("realtime/v1", baseUrl);
			this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws");
			this.authUrl = new URL("auth/v1", baseUrl);
			this.storageUrl = new URL("storage/v1", baseUrl);
			this.functionsUrl = new URL("functions/v1", baseUrl);
			const defaultStorageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
			const DEFAULTS = {
				db: constants_1.DEFAULT_DB_OPTIONS,
				realtime: constants_1.DEFAULT_REALTIME_OPTIONS,
				auth: Object.assign(Object.assign({}, constants_1.DEFAULT_AUTH_OPTIONS), { storageKey: defaultStorageKey }),
				global: constants_1.DEFAULT_GLOBAL_OPTIONS
			};
			const settings = (0, helpers_1.applySettingDefaults)(options !== null && options !== void 0 ? options : {}, DEFAULTS);
			this.storageKey = (_a = settings.auth.storageKey) !== null && _a !== void 0 ? _a : "";
			this.headers = (_b = settings.global.headers) !== null && _b !== void 0 ? _b : {};
			if (!settings.accessToken) this.auth = this._initSupabaseAuthClient((_c = settings.auth) !== null && _c !== void 0 ? _c : {}, this.headers, settings.global.fetch);
			else {
				this.accessToken = settings.accessToken;
				this.auth = new Proxy({}, { get: (_, prop) => {
					throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
				} });
			}
			this.fetch = (0, fetch_1.fetchWithAuth)(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
			this.realtime = this._initRealtimeClient(Object.assign({
				headers: this.headers,
				accessToken: this._getAccessToken.bind(this)
			}, settings.realtime));
			if (this.accessToken) this.accessToken().then((token) => this.realtime.setAuth(token)).catch((e) => console.warn("Failed to set initial Realtime auth token:", e));
			this.rest = new postgrest_js_1.PostgrestClient(new URL("rest/v1", baseUrl).href, {
				headers: this.headers,
				schema: settings.db.schema,
				fetch: this.fetch
			});
			this.storage = new storage_js_1.StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
			if (!settings.accessToken) this._listenForAuthEvents();
		}
		/**
		* Supabase Functions allows you to deploy and invoke edge functions.
		*/
		get functions() {
			return new functions_js_1.FunctionsClient(this.functionsUrl.href, {
				headers: this.headers,
				customFetch: this.fetch
			});
		}
		/**
		* Perform a query on a table or a view.
		*
		* @param relation - The table or view name to query
		*/
		from(relation) {
			return this.rest.from(relation);
		}
		/**
		* Select a schema to query or perform an function (rpc) call.
		*
		* The schema needs to be on the list of exposed schemas inside Supabase.
		*
		* @param schema - The schema to query
		*/
		schema(schema) {
			return this.rest.schema(schema);
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
		*/
		rpc(fn, args = {}, options = {
			head: false,
			get: false,
			count: void 0
		}) {
			return this.rest.rpc(fn, args, options);
		}
		/**
		* Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
		*
		* @param {string} name - The name of the Realtime channel.
		* @param {Object} opts - The options to pass to the Realtime channel.
		*
		*/
		channel(name, opts = { config: {} }) {
			return this.realtime.channel(name, opts);
		}
		/**
		* Returns all Realtime channels.
		*/
		getChannels() {
			return this.realtime.getChannels();
		}
		/**
		* Unsubscribes and removes Realtime channel from Realtime client.
		*
		* @param {RealtimeChannel} channel - The name of the Realtime channel.
		*
		*/
		removeChannel(channel) {
			return this.realtime.removeChannel(channel);
		}
		/**
		* Unsubscribes and removes all Realtime channels from Realtime client.
		*/
		removeAllChannels() {
			return this.realtime.removeAllChannels();
		}
		async _getAccessToken() {
			var _a, _b;
			if (this.accessToken) return await this.accessToken();
			const { data } = await this.auth.getSession();
			return (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : this.supabaseKey;
		}
		_initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug, throwOnError }, headers, fetch) {
			const authHeaders = {
				Authorization: `Bearer ${this.supabaseKey}`,
				apikey: `${this.supabaseKey}`
			};
			return new SupabaseAuthClient_1.SupabaseAuthClient({
				url: this.authUrl.href,
				headers: Object.assign(Object.assign({}, authHeaders), headers),
				storageKey,
				autoRefreshToken,
				persistSession,
				detectSessionInUrl,
				storage,
				userStorage,
				flowType,
				lock,
				debug,
				throwOnError,
				fetch,
				hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === "authorization")
			});
		}
		_initRealtimeClient(options) {
			return new realtime_js_1.RealtimeClient(this.realtimeUrl.href, Object.assign(Object.assign({}, options), { params: Object.assign({ apikey: this.supabaseKey }, options === null || options === void 0 ? void 0 : options.params) }));
		}
		_listenForAuthEvents() {
			return this.auth.onAuthStateChange((event, session) => {
				this._handleTokenChanged(event, "CLIENT", session === null || session === void 0 ? void 0 : session.access_token);
			});
		}
		_handleTokenChanged(event, source, token) {
			if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && this.changedAccessToken !== token) {
				this.changedAccessToken = token;
				this.realtime.setAuth(token);
			} else if (event === "SIGNED_OUT") {
				this.realtime.setAuth();
				if (source == "STORAGE") this.auth.signOut();
				this.changedAccessToken = void 0;
			}
		}
	};
	exports.default = SupabaseClient;
}));
//#endregion
//#region node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs
var import_main = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
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
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.createClient = exports.SupabaseClient = exports.FunctionRegion = exports.FunctionsError = exports.FunctionsRelayError = exports.FunctionsFetchError = exports.FunctionsHttpError = exports.PostgrestError = void 0;
	var SupabaseClient_1 = __importDefault(require_SupabaseClient());
	__exportStar((init_module$3(), __toCommonJS(module_exports$3)), exports);
	var postgrest_js_1 = require_cjs();
	Object.defineProperty(exports, "PostgrestError", {
		enumerable: true,
		get: function() {
			return postgrest_js_1.PostgrestError;
		}
	});
	var functions_js_1 = (init_module(), __toCommonJS(module_exports));
	Object.defineProperty(exports, "FunctionsHttpError", {
		enumerable: true,
		get: function() {
			return functions_js_1.FunctionsHttpError;
		}
	});
	Object.defineProperty(exports, "FunctionsFetchError", {
		enumerable: true,
		get: function() {
			return functions_js_1.FunctionsFetchError;
		}
	});
	Object.defineProperty(exports, "FunctionsRelayError", {
		enumerable: true,
		get: function() {
			return functions_js_1.FunctionsRelayError;
		}
	});
	Object.defineProperty(exports, "FunctionsError", {
		enumerable: true,
		get: function() {
			return functions_js_1.FunctionsError;
		}
	});
	Object.defineProperty(exports, "FunctionRegion", {
		enumerable: true,
		get: function() {
			return functions_js_1.FunctionRegion;
		}
	});
	__exportStar((init_module$1(), __toCommonJS(module_exports$1)), exports);
	var SupabaseClient_2 = require_SupabaseClient();
	Object.defineProperty(exports, "SupabaseClient", {
		enumerable: true,
		get: function() {
			return __importDefault(SupabaseClient_2).default;
		}
	});
	/**
	* Creates a new Supabase Client.
	*
	* @example
	* ```ts
	* import { createClient } from '@supabase/supabase-js'
	*
	* const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
	* const { data, error } = await supabase.from('profiles').select('*')
	* ```
	*/
	var createClient = (supabaseUrl, supabaseKey, options) => {
		return new SupabaseClient_1.default(supabaseUrl, supabaseKey, options);
	};
	exports.createClient = createClient;
	function shouldShowDeprecationWarning() {
		if (typeof window !== "undefined") return false;
		if (typeof process === "undefined") return false;
		const processVersion = process["version"];
		if (processVersion === void 0 || processVersion === null) return false;
		const versionMatch = processVersion.match(/^v(\d+)\./);
		if (!versionMatch) return false;
		return parseInt(versionMatch[1], 10) <= 18;
	}
	if (shouldShowDeprecationWarning()) console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
})))(), 1);
var { PostgrestError, FunctionsHttpError, FunctionsFetchError, FunctionsRelayError, FunctionsError, FunctionRegion, SupabaseClient, createClient, GoTrueAdminApi, GoTrueClient, AuthAdminApi, AuthClient, navigatorLock, NavigatorLockAcquireTimeoutError, lockInternals, processLock, SIGN_OUT_SCOPES, AuthError, AuthApiError, AuthUnknownError, CustomAuthError, AuthSessionMissingError, AuthInvalidTokenResponseError, AuthInvalidCredentialsError, AuthImplicitGrantRedirectError, AuthPKCEGrantCodeExchangeError, AuthRetryableFetchError, AuthWeakPasswordError, AuthInvalidJwtError, isAuthError, isAuthApiError, isAuthSessionMissingError, isAuthImplicitGrantRedirectError, isAuthRetryableFetchError, isAuthWeakPasswordError, RealtimePresence, RealtimeChannel, RealtimeClient, REALTIME_LISTEN_TYPES, REALTIME_POSTGRES_CHANGES_LISTEN_EVENT, REALTIME_PRESENCE_LISTEN_EVENTS, REALTIME_SUBSCRIBE_STATES, REALTIME_CHANNEL_STATES } = import_main.default || import_main;
import_main.default;
//#endregion
export { createClient as n, FunctionsHttpError as t };
