import { n as __esmMin, r as __exportAll } from "../_runtime.mjs";
import { D as __awaiter, k as init_tslib_es6 } from "./@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/@supabase/functions-js/dist/module/helper.js
var resolveFetch;
var init_helper = __esmMin((() => {
	resolveFetch = (customFetch) => {
		if (customFetch) return (...args) => customFetch(...args);
		return (...args) => fetch(...args);
	};
}));
//#endregion
//#region node_modules/@supabase/functions-js/dist/module/types.js
var FunctionsError, FunctionsFetchError, FunctionsRelayError, FunctionsHttpError, FunctionRegion;
var init_types = __esmMin((() => {
	FunctionsError = class extends Error {
		constructor(message, name = "FunctionsError", context) {
			super(message);
			this.name = name;
			this.context = context;
		}
	};
	FunctionsFetchError = class extends FunctionsError {
		constructor(context) {
			super("Failed to send a request to the Edge Function", "FunctionsFetchError", context);
		}
	};
	FunctionsRelayError = class extends FunctionsError {
		constructor(context) {
			super("Relay Error invoking the Edge Function", "FunctionsRelayError", context);
		}
	};
	FunctionsHttpError = class extends FunctionsError {
		constructor(context) {
			super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context);
		}
	};
	(function(FunctionRegion) {
		FunctionRegion["Any"] = "any";
		FunctionRegion["ApNortheast1"] = "ap-northeast-1";
		FunctionRegion["ApNortheast2"] = "ap-northeast-2";
		FunctionRegion["ApSouth1"] = "ap-south-1";
		FunctionRegion["ApSoutheast1"] = "ap-southeast-1";
		FunctionRegion["ApSoutheast2"] = "ap-southeast-2";
		FunctionRegion["CaCentral1"] = "ca-central-1";
		FunctionRegion["EuCentral1"] = "eu-central-1";
		FunctionRegion["EuWest1"] = "eu-west-1";
		FunctionRegion["EuWest2"] = "eu-west-2";
		FunctionRegion["EuWest3"] = "eu-west-3";
		FunctionRegion["SaEast1"] = "sa-east-1";
		FunctionRegion["UsEast1"] = "us-east-1";
		FunctionRegion["UsWest1"] = "us-west-1";
		FunctionRegion["UsWest2"] = "us-west-2";
	})(FunctionRegion || (FunctionRegion = {}));
}));
//#endregion
//#region node_modules/@supabase/functions-js/dist/module/FunctionsClient.js
var FunctionsClient;
var init_FunctionsClient = __esmMin((() => {
	init_tslib_es6();
	init_helper();
	init_types();
	FunctionsClient = class {
		/**
		* Creates a new Functions client bound to an Edge Functions URL.
		*
		* @example
		* ```ts
		* import { FunctionsClient, FunctionRegion } from '@supabase/functions-js'
		*
		* const functions = new FunctionsClient('https://xyzcompany.supabase.co/functions/v1', {
		*   headers: { apikey: 'public-anon-key' },
		*   region: FunctionRegion.UsEast1,
		* })
		* ```
		*/
		constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
			this.url = url;
			this.headers = headers;
			this.region = region;
			this.fetch = resolveFetch(customFetch);
		}
		/**
		* Updates the authorization header
		* @param token - the new jwt token sent in the authorisation header
		* @example
		* ```ts
		* functions.setAuth(session.access_token)
		* ```
		*/
		setAuth(token) {
			this.headers.Authorization = `Bearer ${token}`;
		}
		/**
		* Invokes a function
		* @param functionName - The name of the Function to invoke.
		* @param options - Options for invoking the Function.
		* @example
		* ```ts
		* const { data, error } = await functions.invoke('hello-world', {
		*   body: { name: 'Ada' },
		* })
		* ```
		*/
		invoke(functionName_1) {
			return __awaiter(this, arguments, void 0, function* (functionName, options = {}) {
				var _a;
				let timeoutId;
				let timeoutController;
				try {
					const { headers, method, body: functionArgs, signal, timeout } = options;
					let _headers = {};
					let { region } = options;
					if (!region) region = this.region;
					const url = new URL(`${this.url}/${functionName}`);
					if (region && region !== "any") {
						_headers["x-region"] = region;
						url.searchParams.set("forceFunctionRegion", region);
					}
					let body;
					if (functionArgs && (headers && !Object.prototype.hasOwnProperty.call(headers, "Content-Type") || !headers)) if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
						_headers["Content-Type"] = "application/octet-stream";
						body = functionArgs;
					} else if (typeof functionArgs === "string") {
						_headers["Content-Type"] = "text/plain";
						body = functionArgs;
					} else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) body = functionArgs;
					else {
						_headers["Content-Type"] = "application/json";
						body = JSON.stringify(functionArgs);
					}
					else body = functionArgs;
					let effectiveSignal = signal;
					if (timeout) {
						timeoutController = new AbortController();
						timeoutId = setTimeout(() => timeoutController.abort(), timeout);
						if (signal) {
							effectiveSignal = timeoutController.signal;
							signal.addEventListener("abort", () => timeoutController.abort());
						} else effectiveSignal = timeoutController.signal;
					}
					const response = yield this.fetch(url.toString(), {
						method: method || "POST",
						headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
						body,
						signal: effectiveSignal
					}).catch((fetchError) => {
						throw new FunctionsFetchError(fetchError);
					});
					const isRelayError = response.headers.get("x-relay-error");
					if (isRelayError && isRelayError === "true") throw new FunctionsRelayError(response);
					if (!response.ok) throw new FunctionsHttpError(response);
					let responseType = ((_a = response.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "text/plain").split(";")[0].trim();
					let data;
					if (responseType === "application/json") data = yield response.json();
					else if (responseType === "application/octet-stream" || responseType === "application/pdf") data = yield response.blob();
					else if (responseType === "text/event-stream") data = response;
					else if (responseType === "multipart/form-data") data = yield response.formData();
					else data = yield response.text();
					return {
						data,
						error: null,
						response
					};
				} catch (error) {
					return {
						data: null,
						error,
						response: error instanceof FunctionsHttpError || error instanceof FunctionsRelayError ? error.context : void 0
					};
				} finally {
					if (timeoutId) clearTimeout(timeoutId);
				}
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/functions-js/dist/module/index.js
var module_exports = /* @__PURE__ */ __exportAll({
	FunctionRegion: () => FunctionRegion,
	FunctionsClient: () => FunctionsClient,
	FunctionsError: () => FunctionsError,
	FunctionsFetchError: () => FunctionsFetchError,
	FunctionsHttpError: () => FunctionsHttpError,
	FunctionsRelayError: () => FunctionsRelayError
});
var init_module = __esmMin((() => {
	init_FunctionsClient();
	init_types();
}));
//#endregion
export { module_exports as n, init_module as t };
