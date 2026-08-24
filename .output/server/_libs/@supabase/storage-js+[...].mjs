import { n as __esmMin, r as __exportAll } from "../../_runtime.mjs";
import { __awaiter } from "tslib";
//#region node_modules/@supabase/storage-js/dist/module/lib/errors.js
function isStorageError(error) {
	return typeof error === "object" && error !== null && "__isStorageError" in error;
}
var StorageError, StorageApiError, StorageUnknownError;
var init_errors$1 = __esmMin((() => {
	StorageError = class extends Error {
		constructor(message) {
			super(message);
			this.__isStorageError = true;
			this.name = "StorageError";
		}
	};
	StorageApiError = class extends StorageError {
		constructor(message, status, statusCode) {
			super(message);
			this.name = "StorageApiError";
			this.status = status;
			this.statusCode = statusCode;
		}
		toJSON() {
			return {
				name: this.name,
				message: this.message,
				status: this.status,
				statusCode: this.statusCode
			};
		}
	};
	StorageUnknownError = class extends StorageError {
		constructor(message, originalError) {
			super(message);
			this.name = "StorageUnknownError";
			this.originalError = originalError;
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/helpers.js
var resolveFetch$1, resolveResponse$1, recursiveToCamel, isPlainObject$1, isValidBucketName;
var init_helpers$1 = __esmMin((() => {
	resolveFetch$1 = (customFetch) => {
		if (customFetch) return (...args) => customFetch(...args);
		return (...args) => fetch(...args);
	};
	resolveResponse$1 = () => {
		return Response;
	};
	recursiveToCamel = (item) => {
		if (Array.isArray(item)) return item.map((el) => recursiveToCamel(el));
		else if (typeof item === "function" || item !== Object(item)) return item;
		const result = {};
		Object.entries(item).forEach(([key, value]) => {
			const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ""));
			result[newKey] = recursiveToCamel(value);
		});
		return result;
	};
	isPlainObject$1 = (value) => {
		if (typeof value !== "object" || value === null) return false;
		const prototype = Object.getPrototypeOf(value);
		return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
	};
	isValidBucketName = (bucketName) => {
		if (!bucketName || typeof bucketName !== "string") return false;
		if (bucketName.length === 0 || bucketName.length > 100) return false;
		if (bucketName.trim() !== bucketName) return false;
		if (bucketName.includes("/") || bucketName.includes("\\")) return false;
		return /^[\w!.\*'() &$@=;:+,?-]+$/.test(bucketName);
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/fetch.js
function _handleRequest$1(fetcher, method, url, options, parameters, body) {
	return __awaiter(this, void 0, void 0, function* () {
		return new Promise((resolve, reject) => {
			fetcher(url, _getRequestParams$1(method, options, parameters, body)).then((result) => {
				if (!result.ok) throw result;
				if (options === null || options === void 0 ? void 0 : options.noResolveJson) return result;
				return result.json();
			}).then((data) => resolve(data)).catch((error) => handleError$1(error, reject, options));
		});
	});
}
function get(fetcher, url, options, parameters) {
	return __awaiter(this, void 0, void 0, function* () {
		return _handleRequest$1(fetcher, "GET", url, options, parameters);
	});
}
function post$1(fetcher, url, body, options, parameters) {
	return __awaiter(this, void 0, void 0, function* () {
		return _handleRequest$1(fetcher, "POST", url, options, parameters, body);
	});
}
function put(fetcher, url, body, options, parameters) {
	return __awaiter(this, void 0, void 0, function* () {
		return _handleRequest$1(fetcher, "PUT", url, options, parameters, body);
	});
}
function head(fetcher, url, options, parameters) {
	return __awaiter(this, void 0, void 0, function* () {
		return _handleRequest$1(fetcher, "HEAD", url, Object.assign(Object.assign({}, options), { noResolveJson: true }), parameters);
	});
}
function remove(fetcher, url, body, options, parameters) {
	return __awaiter(this, void 0, void 0, function* () {
		return _handleRequest$1(fetcher, "DELETE", url, options, parameters, body);
	});
}
var _getErrorMessage$1, handleError$1, _getRequestParams$1;
var init_fetch$1 = __esmMin((() => {
	init_errors$1();
	init_helpers$1();
	_getErrorMessage$1 = (err) => {
		var _a;
		return err.msg || err.message || err.error_description || (typeof err.error === "string" ? err.error : (_a = err.error) === null || _a === void 0 ? void 0 : _a.message) || JSON.stringify(err);
	};
	handleError$1 = (error, reject, options) => __awaiter(void 0, void 0, void 0, function* () {
		if (error instanceof (yield resolveResponse$1()) && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) error.json().then((err) => {
			const status = error.status || 500;
			const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || status + "";
			reject(new StorageApiError(_getErrorMessage$1(err), status, statusCode));
		}).catch((err) => {
			reject(new StorageUnknownError(_getErrorMessage$1(err), err));
		});
		else reject(new StorageUnknownError(_getErrorMessage$1(error), error));
	});
	_getRequestParams$1 = (method, options, parameters, body) => {
		const params = {
			method,
			headers: (options === null || options === void 0 ? void 0 : options.headers) || {}
		};
		if (method === "GET" || !body) return params;
		if (isPlainObject$1(body)) {
			params.headers = Object.assign({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
			params.body = JSON.stringify(body);
		} else params.body = body;
		if (options === null || options === void 0 ? void 0 : options.duplex) params.duplex = options.duplex;
		return Object.assign(Object.assign({}, params), parameters);
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/StreamDownloadBuilder.js
var StreamDownloadBuilder;
var init_StreamDownloadBuilder = __esmMin((() => {
	init_errors$1();
	StreamDownloadBuilder = class {
		constructor(downloadFn, shouldThrowOnError) {
			this.downloadFn = downloadFn;
			this.shouldThrowOnError = shouldThrowOnError;
		}
		then(onfulfilled, onrejected) {
			return this.execute().then(onfulfilled, onrejected);
		}
		execute() {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: (yield this.downloadFn()).body,
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/BlobDownloadBuilder.js
var _a, BlobDownloadBuilder;
var init_BlobDownloadBuilder = __esmMin((() => {
	init_errors$1();
	init_StreamDownloadBuilder();
	BlobDownloadBuilder = class {
		constructor(downloadFn, shouldThrowOnError) {
			this.downloadFn = downloadFn;
			this.shouldThrowOnError = shouldThrowOnError;
			this[_a] = "BlobDownloadBuilder";
			this.promise = null;
		}
		asStream() {
			return new StreamDownloadBuilder(this.downloadFn, this.shouldThrowOnError);
		}
		then(onfulfilled, onrejected) {
			return this.getPromise().then(onfulfilled, onrejected);
		}
		catch(onrejected) {
			return this.getPromise().catch(onrejected);
		}
		finally(onfinally) {
			return this.getPromise().finally(onfinally);
		}
		getPromise() {
			if (!this.promise) this.promise = this.execute();
			return this.promise;
		}
		execute() {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield (yield this.downloadFn()).blob(),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
	};
	_a = Symbol.toStringTag;
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/StorageFileApi.js
var DEFAULT_SEARCH_OPTIONS, DEFAULT_FILE_OPTIONS, StorageFileApi;
var init_StorageFileApi = __esmMin((() => {
	init_errors$1();
	init_fetch$1();
	init_helpers$1();
	init_BlobDownloadBuilder();
	DEFAULT_SEARCH_OPTIONS = {
		limit: 100,
		offset: 0,
		sortBy: {
			column: "name",
			order: "asc"
		}
	};
	DEFAULT_FILE_OPTIONS = {
		cacheControl: "3600",
		contentType: "text/plain;charset=UTF-8",
		upsert: false
	};
	StorageFileApi = class {
		constructor(url, headers = {}, bucketId, fetch) {
			this.shouldThrowOnError = false;
			this.url = url;
			this.headers = headers;
			this.bucketId = bucketId;
			this.fetch = resolveFetch$1(fetch);
		}
		/**
		* Enable throwing errors instead of returning them.
		*
		* @category File Buckets
		*/
		throwOnError() {
			this.shouldThrowOnError = true;
			return this;
		}
		/**
		* Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
		*
		* @param method HTTP method.
		* @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
		* @param fileBody The body of the file to be stored in the bucket.
		*/
		uploadOrUpdate(method, path, fileBody, fileOptions) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					let body;
					const options = Object.assign(Object.assign({}, DEFAULT_FILE_OPTIONS), fileOptions);
					let headers = Object.assign(Object.assign({}, this.headers), method === "POST" && { "x-upsert": String(options.upsert) });
					const metadata = options.metadata;
					if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
						body = new FormData();
						body.append("cacheControl", options.cacheControl);
						if (metadata) body.append("metadata", this.encodeMetadata(metadata));
						body.append("", fileBody);
					} else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
						body = fileBody;
						if (!body.has("cacheControl")) body.append("cacheControl", options.cacheControl);
						if (metadata && !body.has("metadata")) body.append("metadata", this.encodeMetadata(metadata));
					} else {
						body = fileBody;
						headers["cache-control"] = `max-age=${options.cacheControl}`;
						headers["content-type"] = options.contentType;
						if (metadata) headers["x-metadata"] = this.toBase64(this.encodeMetadata(metadata));
						if ((typeof ReadableStream !== "undefined" && body instanceof ReadableStream || body && typeof body === "object" && "pipe" in body && typeof body.pipe === "function") && !options.duplex) options.duplex = "half";
					}
					if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers) headers = Object.assign(Object.assign({}, headers), fileOptions.headers);
					const cleanPath = this._removeEmptyFolders(path);
					const _path = this._getFinalPath(cleanPath);
					const data = yield (method == "PUT" ? put : post$1)(this.fetch, `${this.url}/object/${_path}`, body, Object.assign({ headers }, (options === null || options === void 0 ? void 0 : options.duplex) ? { duplex: options.duplex } : {}));
					return {
						data: {
							path: cleanPath,
							id: data.Id,
							fullPath: data.Key
						},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Uploads a file to an existing bucket.
		*
		* @category File Buckets
		* @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
		* @param fileBody The body of the file to be stored in the bucket.
		* @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
		* @returns Promise with response containing file path, id, and fullPath or error
		*
		* @example Upload file
		* ```js
		* const avatarFile = event.target.files[0]
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .upload('public/avatar1.png', avatarFile, {
		*     cacheControl: '3600',
		*     upsert: false
		*   })
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "path": "public/avatar1.png",
		*     "fullPath": "avatars/public/avatar1.png"
		*   },
		*   "error": null
		* }
		* ```
		*
		* @example Upload file using `ArrayBuffer` from base64 file data
		* ```js
		* import { decode } from 'base64-arraybuffer'
		*
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .upload('public/avatar1.png', decode('base64FileData'), {
		*     contentType: 'image/png'
		*   })
		* ```
		*/
		upload(path, fileBody, fileOptions) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
			});
		}
		/**
		* Upload a file with a token generated from `createSignedUploadUrl`.
		*
		* @category File Buckets
		* @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
		* @param token The token generated from `createSignedUploadUrl`
		* @param fileBody The body of the file to be stored in the bucket.
		* @param fileOptions HTTP headers (cacheControl, contentType, etc.).
		* **Note:** The `upsert` option has no effect here. To enable upsert behavior,
		* pass `{ upsert: true }` when calling `createSignedUploadUrl()` instead.
		* @returns Promise with response containing file path and fullPath or error
		*
		* @example Upload to a signed URL
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "path": "folder/cat.jpg",
		*     "fullPath": "avatars/folder/cat.jpg"
		*   },
		*   "error": null
		* }
		* ```
		*/
		uploadToSignedUrl(path, token, fileBody, fileOptions) {
			return __awaiter(this, void 0, void 0, function* () {
				const cleanPath = this._removeEmptyFolders(path);
				const _path = this._getFinalPath(cleanPath);
				const url = new URL(this.url + `/object/upload/sign/${_path}`);
				url.searchParams.set("token", token);
				try {
					let body;
					const options = Object.assign({ upsert: DEFAULT_FILE_OPTIONS.upsert }, fileOptions);
					const headers = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(options.upsert) });
					if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
						body = new FormData();
						body.append("cacheControl", options.cacheControl);
						body.append("", fileBody);
					} else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
						body = fileBody;
						body.append("cacheControl", options.cacheControl);
					} else {
						body = fileBody;
						headers["cache-control"] = `max-age=${options.cacheControl}`;
						headers["content-type"] = options.contentType;
					}
					return {
						data: {
							path: cleanPath,
							fullPath: (yield put(this.fetch, url.toString(), body, { headers })).Key
						},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Creates a signed upload URL.
		* Signed upload URLs can be used to upload files to the bucket without further authentication.
		* They are valid for 2 hours.
		*
		* @category File Buckets
		* @param path The file path, including the current file name. For example `folder/image.png`.
		* @param options.upsert If set to true, allows the file to be overwritten if it already exists.
		* @returns Promise with response containing signed upload URL, token, and path or error
		*
		* @example Create Signed Upload URL
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .createSignedUploadUrl('folder/cat.jpg')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
		*     "path": "folder/cat.jpg",
		*     "token": "<TOKEN>"
		*   },
		*   "error": null
		* }
		* ```
		*/
		createSignedUploadUrl(path, options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					let _path = this._getFinalPath(path);
					const headers = Object.assign({}, this.headers);
					if (options === null || options === void 0 ? void 0 : options.upsert) headers["x-upsert"] = "true";
					const data = yield post$1(this.fetch, `${this.url}/object/upload/sign/${_path}`, {}, { headers });
					const url = new URL(this.url + data.url);
					const token = url.searchParams.get("token");
					if (!token) throw new StorageError("No token returned by API");
					return {
						data: {
							signedUrl: url.toString(),
							path,
							token
						},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Replaces an existing file at the specified path with a new one.
		*
		* @category File Buckets
		* @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
		* @param fileBody The body of the file to be stored in the bucket.
		* @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
		* @returns Promise with response containing file path, id, and fullPath or error
		*
		* @example Update file
		* ```js
		* const avatarFile = event.target.files[0]
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .update('public/avatar1.png', avatarFile, {
		*     cacheControl: '3600',
		*     upsert: true
		*   })
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "path": "public/avatar1.png",
		*     "fullPath": "avatars/public/avatar1.png"
		*   },
		*   "error": null
		* }
		* ```
		*
		* @example Update file using `ArrayBuffer` from base64 file data
		* ```js
		* import {decode} from 'base64-arraybuffer'
		*
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .update('public/avatar1.png', decode('base64FileData'), {
		*     contentType: 'image/png'
		*   })
		* ```
		*/
		update(path, fileBody, fileOptions) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
			});
		}
		/**
		* Moves an existing file to a new path in the same bucket.
		*
		* @category File Buckets
		* @param fromPath The original file path, including the current file name. For example `folder/image.png`.
		* @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
		* @param options The destination options.
		* @returns Promise with response containing success message or error
		*
		* @example Move file
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .move('public/avatar1.png', 'private/avatar2.png')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "message": "Successfully moved"
		*   },
		*   "error": null
		* }
		* ```
		*/
		move(fromPath, toPath, options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post$1(this.fetch, `${this.url}/object/move`, {
							bucketId: this.bucketId,
							sourceKey: fromPath,
							destinationKey: toPath,
							destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
						}, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Copies an existing file to a new path in the same bucket.
		*
		* @category File Buckets
		* @param fromPath The original file path, including the current file name. For example `folder/image.png`.
		* @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
		* @param options The destination options.
		* @returns Promise with response containing copied file path or error
		*
		* @example Copy file
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .copy('public/avatar1.png', 'private/avatar2.png')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "path": "avatars/private/avatar2.png"
		*   },
		*   "error": null
		* }
		* ```
		*/
		copy(fromPath, toPath, options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: { path: (yield post$1(this.fetch, `${this.url}/object/copy`, {
							bucketId: this.bucketId,
							sourceKey: fromPath,
							destinationKey: toPath,
							destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
						}, { headers: this.headers })).Key },
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
		*
		* @category File Buckets
		* @param path The file path, including the current file name. For example `folder/image.png`.
		* @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
		* @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
		* @param options.transform Transform the asset before serving it to the client.
		* @returns Promise with response containing signed URL or error
		*
		* @example Create Signed URL
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .createSignedUrl('folder/avatar1.png', 60)
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
		*   },
		*   "error": null
		* }
		* ```
		*
		* @example Create a signed URL for an asset with transformations
		* ```js
		* const { data } = await supabase
		*   .storage
		*   .from('avatars')
		*   .createSignedUrl('folder/avatar1.png', 60, {
		*     transform: {
		*       width: 100,
		*       height: 100,
		*     }
		*   })
		* ```
		*
		* @example Create a signed URL which triggers the download of the asset
		* ```js
		* const { data } = await supabase
		*   .storage
		*   .from('avatars')
		*   .createSignedUrl('folder/avatar1.png', 60, {
		*     download: true,
		*   })
		* ```
		*/
		createSignedUrl(path, expiresIn, options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					let _path = this._getFinalPath(path);
					let data = yield post$1(this.fetch, `${this.url}/object/sign/${_path}`, Object.assign({ expiresIn }, (options === null || options === void 0 ? void 0 : options.transform) ? { transform: options.transform } : {}), { headers: this.headers });
					const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
					data = { signedUrl: encodeURI(`${this.url}${data.signedURL}${downloadQueryParam}`) };
					return {
						data,
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
		*
		* @category File Buckets
		* @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
		* @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
		* @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
		* @returns Promise with response containing array of objects with signedUrl, path, and error or error
		*
		* @example Create Signed URLs
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": [
		*     {
		*       "error": null,
		*       "path": "folder/avatar1.png",
		*       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
		*       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
		*     },
		*     {
		*       "error": null,
		*       "path": "folder/avatar2.png",
		*       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
		*       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
		*     }
		*   ],
		*   "error": null
		* }
		* ```
		*/
		createSignedUrls(paths, expiresIn, options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					const data = yield post$1(this.fetch, `${this.url}/object/sign/${this.bucketId}`, {
						expiresIn,
						paths
					}, { headers: this.headers });
					const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
					return {
						data: data.map((datum) => Object.assign(Object.assign({}, datum), { signedUrl: datum.signedURL ? encodeURI(`${this.url}${datum.signedURL}${downloadQueryParam}`) : null })),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
		*
		* @category File Buckets
		* @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
		* @param options.transform Transform the asset before serving it to the client.
		* @returns BlobDownloadBuilder instance for downloading the file
		*
		* @example Download file
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .download('folder/avatar1.png')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": <BLOB>,
		*   "error": null
		* }
		* ```
		*
		* @example Download file with transformations
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .download('folder/avatar1.png', {
		*     transform: {
		*       width: 100,
		*       height: 100,
		*       quality: 80
		*     }
		*   })
		* ```
		*/
		download(path, options) {
			const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image/authenticated" : "object";
			const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
			const queryString = transformationQuery ? `?${transformationQuery}` : "";
			const _path = this._getFinalPath(path);
			const downloadFn = () => get(this.fetch, `${this.url}/${renderPath}/${_path}${queryString}`, {
				headers: this.headers,
				noResolveJson: true
			});
			return new BlobDownloadBuilder(downloadFn, this.shouldThrowOnError);
		}
		/**
		* Retrieves the details of an existing file.
		*
		* @category File Buckets
		* @param path The file path, including the file name. For example `folder/image.png`.
		* @returns Promise with response containing file metadata or error
		*
		* @example Get file info
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .info('folder/avatar1.png')
		* ```
		*/
		info(path) {
			return __awaiter(this, void 0, void 0, function* () {
				const _path = this._getFinalPath(path);
				try {
					const data = yield get(this.fetch, `${this.url}/object/info/${_path}`, { headers: this.headers });
					return {
						data: recursiveToCamel(data),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Checks the existence of a file.
		*
		* @category File Buckets
		* @param path The file path, including the file name. For example `folder/image.png`.
		* @returns Promise with response containing boolean indicating file existence or error
		*
		* @example Check file existence
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .exists('folder/avatar1.png')
		* ```
		*/
		exists(path) {
			return __awaiter(this, void 0, void 0, function* () {
				const _path = this._getFinalPath(path);
				try {
					yield head(this.fetch, `${this.url}/object/${_path}`, { headers: this.headers });
					return {
						data: true,
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error) && error instanceof StorageUnknownError) {
						const originalError = error.originalError;
						if ([400, 404].includes(originalError === null || originalError === void 0 ? void 0 : originalError.status)) return {
							data: false,
							error
						};
					}
					throw error;
				}
			});
		}
		/**
		* A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
		* This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
		*
		* @category File Buckets
		* @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
		* @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
		* @param options.transform Transform the asset before serving it to the client.
		* @returns Object with public URL
		*
		* @example Returns the URL for an asset in a public bucket
		* ```js
		* const { data } = supabase
		*   .storage
		*   .from('public-bucket')
		*   .getPublicUrl('folder/avatar1.png')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
		*   }
		* }
		* ```
		*
		* @example Returns the URL for an asset in a public bucket with transformations
		* ```js
		* const { data } = supabase
		*   .storage
		*   .from('public-bucket')
		*   .getPublicUrl('folder/avatar1.png', {
		*     transform: {
		*       width: 100,
		*       height: 100,
		*     }
		*   })
		* ```
		*
		* @example Returns the URL which triggers the download of an asset in a public bucket
		* ```js
		* const { data } = supabase
		*   .storage
		*   .from('public-bucket')
		*   .getPublicUrl('folder/avatar1.png', {
		*     download: true,
		*   })
		* ```
		*/
		getPublicUrl(path, options) {
			const _path = this._getFinalPath(path);
			const _queryString = [];
			const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `download=${options.download === true ? "" : options.download}` : "";
			if (downloadQueryParam !== "") _queryString.push(downloadQueryParam);
			const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image" : "object";
			const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
			if (transformationQuery !== "") _queryString.push(transformationQuery);
			let queryString = _queryString.join("&");
			if (queryString !== "") queryString = `?${queryString}`;
			return { data: { publicUrl: encodeURI(`${this.url}/${renderPath}/public/${_path}${queryString}`) } };
		}
		/**
		* Deletes files within the same bucket
		*
		* @category File Buckets
		* @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
		* @returns Promise with response containing array of deleted file objects or error
		*
		* @example Delete file
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .remove(['folder/avatar1.png'])
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": [],
		*   "error": null
		* }
		* ```
		*/
		remove(paths) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield remove(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: paths }, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Get file metadata
		* @param id the file id to retrieve metadata
		*/
		/**
		* Update file metadata
		* @param id the file id to update metadata
		* @param meta the new file metadata
		*/
		/**
		* Lists all the files and folders within a path of the bucket.
		*
		* @category File Buckets
		* @param path The folder path.
		* @param options Search options including limit (defaults to 100), offset, sortBy, and search
		* @param parameters Optional fetch parameters including signal for cancellation
		* @returns Promise with response containing array of files or error
		*
		* @example List files in a bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .list('folder', {
		*     limit: 100,
		*     offset: 0,
		*     sortBy: { column: 'name', order: 'asc' },
		*   })
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": [
		*     {
		*       "name": "avatar1.png",
		*       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
		*       "updated_at": "2024-05-22T23:06:05.580Z",
		*       "created_at": "2024-05-22T23:04:34.443Z",
		*       "last_accessed_at": "2024-05-22T23:04:34.443Z",
		*       "metadata": {
		*         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
		*         "size": 32175,
		*         "mimetype": "image/png",
		*         "cacheControl": "max-age=3600",
		*         "lastModified": "2024-05-22T23:06:05.574Z",
		*         "contentLength": 32175,
		*         "httpStatusCode": 200
		*       }
		*     }
		*   ],
		*   "error": null
		* }
		* ```
		*
		* @example Search files in a bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .from('avatars')
		*   .list('folder', {
		*     limit: 100,
		*     offset: 0,
		*     sortBy: { column: 'name', order: 'asc' },
		*     search: 'jon'
		*   })
		* ```
		*/
		list(path, options, parameters) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					const body = Object.assign(Object.assign(Object.assign({}, DEFAULT_SEARCH_OPTIONS), options), { prefix: path || "" });
					return {
						data: yield post$1(this.fetch, `${this.url}/object/list/${this.bucketId}`, body, { headers: this.headers }, parameters),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* @experimental this method signature might change in the future
		*
		* @category File Buckets
		* @param options search options
		* @param parameters
		*/
		listV2(options, parameters) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					const body = Object.assign({}, options);
					return {
						data: yield post$1(this.fetch, `${this.url}/object/list-v2/${this.bucketId}`, body, { headers: this.headers }, parameters),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		encodeMetadata(metadata) {
			return JSON.stringify(metadata);
		}
		toBase64(data) {
			if (typeof Buffer !== "undefined") return Buffer.from(data).toString("base64");
			return btoa(data);
		}
		_getFinalPath(path) {
			return `${this.bucketId}/${path.replace(/^\/+/, "")}`;
		}
		_removeEmptyFolders(path) {
			return path.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
		}
		transformOptsToQueryString(transform) {
			const params = [];
			if (transform.width) params.push(`width=${transform.width}`);
			if (transform.height) params.push(`height=${transform.height}`);
			if (transform.resize) params.push(`resize=${transform.resize}`);
			if (transform.format) params.push(`format=${transform.format}`);
			if (transform.quality) params.push(`quality=${transform.quality}`);
			return params.join("&");
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/version.js
var version;
var init_version = __esmMin((() => {
	version = "2.86.2";
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/constants.js
var DEFAULT_HEADERS$1;
var init_constants$1 = __esmMin((() => {
	init_version();
	DEFAULT_HEADERS$1 = { "X-Client-Info": `storage-js/${version}` };
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/StorageBucketApi.js
var StorageBucketApi;
var init_StorageBucketApi = __esmMin((() => {
	init_constants$1();
	init_errors$1();
	init_fetch$1();
	init_helpers$1();
	StorageBucketApi = class {
		constructor(url, headers = {}, fetch, opts) {
			this.shouldThrowOnError = false;
			const baseUrl = new URL(url);
			if (opts === null || opts === void 0 ? void 0 : opts.useNewHostname) {
				if (/supabase\.(co|in|red)$/.test(baseUrl.hostname) && !baseUrl.hostname.includes("storage.supabase.")) baseUrl.hostname = baseUrl.hostname.replace("supabase.", "storage.supabase.");
			}
			this.url = baseUrl.href.replace(/\/$/, "");
			this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS$1), headers);
			this.fetch = resolveFetch$1(fetch);
		}
		/**
		* Enable throwing errors instead of returning them.
		*
		* @category File Buckets
		*/
		throwOnError() {
			this.shouldThrowOnError = true;
			return this;
		}
		/**
		* Retrieves the details of all Storage buckets within an existing project.
		*
		* @category File Buckets
		* @param options Query parameters for listing buckets
		* @param options.limit Maximum number of buckets to return
		* @param options.offset Number of buckets to skip
		* @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
		* @param options.sortOrder Sort order ('asc' or 'desc')
		* @param options.search Search term to filter bucket names
		* @returns Promise with response containing array of buckets or error
		*
		* @example List buckets
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .listBuckets()
		* ```
		*
		* @example List buckets with options
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .listBuckets({
		*     limit: 10,
		*     offset: 0,
		*     sortColumn: 'created_at',
		*     sortOrder: 'desc',
		*     search: 'prod'
		*   })
		* ```
		*/
		listBuckets(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					const queryString = this.listBucketOptionsToQueryString(options);
					return {
						data: yield get(this.fetch, `${this.url}/bucket${queryString}`, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Retrieves the details of an existing Storage bucket.
		*
		* @category File Buckets
		* @param id The unique identifier of the bucket you would like to retrieve.
		* @returns Promise with response containing bucket details or error
		*
		* @example Get bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .getBucket('avatars')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "id": "avatars",
		*     "name": "avatars",
		*     "owner": "",
		*     "public": false,
		*     "file_size_limit": 1024,
		*     "allowed_mime_types": [
		*       "image/png"
		*     ],
		*     "created_at": "2024-05-22T22:26:05.100Z",
		*     "updated_at": "2024-05-22T22:26:05.100Z"
		*   },
		*   "error": null
		* }
		* ```
		*/
		getBucket(id) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield get(this.fetch, `${this.url}/bucket/${id}`, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Creates a new Storage bucket
		*
		* @category File Buckets
		* @param id A unique identifier for the bucket you are creating.
		* @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
		* @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
		* The global file size limit takes precedence over this value.
		* The default value is null, which doesn't set a per bucket file size limit.
		* @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
		* The default value is null, which allows files with all mime types to be uploaded.
		* Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
		* @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
		*   - default bucket type is `STANDARD`
		* @returns Promise with response containing newly created bucket name or error
		*
		* @example Create bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .createBucket('avatars', {
		*     public: false,
		*     allowedMimeTypes: ['image/png'],
		*     fileSizeLimit: 1024
		*   })
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "name": "avatars"
		*   },
		*   "error": null
		* }
		* ```
		*/
		createBucket(id_1) {
			return __awaiter(this, arguments, void 0, function* (id, options = { public: false }) {
				try {
					return {
						data: yield post$1(this.fetch, `${this.url}/bucket`, {
							id,
							name: id,
							type: options.type,
							public: options.public,
							file_size_limit: options.fileSizeLimit,
							allowed_mime_types: options.allowedMimeTypes
						}, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Updates a Storage bucket
		*
		* @category File Buckets
		* @param id A unique identifier for the bucket you are updating.
		* @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
		* @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
		* The global file size limit takes precedence over this value.
		* The default value is null, which doesn't set a per bucket file size limit.
		* @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
		* The default value is null, which allows files with all mime types to be uploaded.
		* Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
		* @returns Promise with response containing success message or error
		*
		* @example Update bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .updateBucket('avatars', {
		*     public: false,
		*     allowedMimeTypes: ['image/png'],
		*     fileSizeLimit: 1024
		*   })
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "message": "Successfully updated"
		*   },
		*   "error": null
		* }
		* ```
		*/
		updateBucket(id, options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield put(this.fetch, `${this.url}/bucket/${id}`, {
							id,
							name: id,
							public: options.public,
							file_size_limit: options.fileSizeLimit,
							allowed_mime_types: options.allowedMimeTypes
						}, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Removes all objects inside a single bucket.
		*
		* @category File Buckets
		* @param id The unique identifier of the bucket you would like to empty.
		* @returns Promise with success message or error
		*
		* @example Empty bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .emptyBucket('avatars')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "message": "Successfully emptied"
		*   },
		*   "error": null
		* }
		* ```
		*/
		emptyBucket(id) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post$1(this.fetch, `${this.url}/bucket/${id}/empty`, {}, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
		* You must first `empty()` the bucket.
		*
		* @category File Buckets
		* @param id The unique identifier of the bucket you would like to delete.
		* @returns Promise with success message or error
		*
		* @example Delete bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .deleteBucket('avatars')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "message": "Successfully deleted"
		*   },
		*   "error": null
		* }
		* ```
		*/
		deleteBucket(id) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield remove(this.fetch, `${this.url}/bucket/${id}`, {}, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		listBucketOptionsToQueryString(options) {
			const params = {};
			if (options) {
				if ("limit" in options) params.limit = String(options.limit);
				if ("offset" in options) params.offset = String(options.offset);
				if (options.search) params.search = options.search;
				if (options.sortColumn) params.sortColumn = options.sortColumn;
				if (options.sortOrder) params.sortOrder = options.sortOrder;
			}
			return Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
		}
	};
}));
//#endregion
//#region node_modules/iceberg-js/dist/index.mjs
function buildUrl(baseUrl, path, query) {
	const url = new URL(path, baseUrl);
	if (query) {
		for (const [key, value] of Object.entries(query)) if (value !== void 0) url.searchParams.set(key, value);
	}
	return url.toString();
}
async function buildAuthHeaders(auth) {
	if (!auth || auth.type === "none") return {};
	if (auth.type === "bearer") return { Authorization: `Bearer ${auth.token}` };
	if (auth.type === "header") return { [auth.name]: auth.value };
	if (auth.type === "custom") return await auth.getHeaders();
	return {};
}
function createFetchClient(options) {
	const fetchFn = options.fetchImpl ?? globalThis.fetch;
	return { async request({ method, path, query, body, headers }) {
		const url = buildUrl(options.baseUrl, path, query);
		const authHeaders = await buildAuthHeaders(options.auth);
		const res = await fetchFn(url, {
			method,
			headers: {
				...body ? { "Content-Type": "application/json" } : {},
				...authHeaders,
				...headers
			},
			body: body ? JSON.stringify(body) : void 0
		});
		const text = await res.text();
		const isJson = (res.headers.get("content-type") || "").includes("application/json");
		const data = isJson && text ? JSON.parse(text) : text;
		if (!res.ok) {
			const errBody = isJson ? data : void 0;
			const errorDetail = errBody?.error;
			throw new IcebergError(errorDetail?.message ?? `Request failed with status ${res.status}`, {
				status: res.status,
				icebergType: errorDetail?.type,
				icebergCode: errorDetail?.code,
				details: errBody
			});
		}
		return {
			status: res.status,
			headers: res.headers,
			data
		};
	} };
}
function namespaceToPath(namespace) {
	return namespace.join("");
}
function namespaceToPath2(namespace) {
	return namespace.join("");
}
var IcebergError, NamespaceOperations, TableOperations, IcebergRestCatalog;
var init_dist = __esmMin((() => {
	IcebergError = class extends Error {
		constructor(message, opts) {
			super(message);
			this.name = "IcebergError";
			this.status = opts.status;
			this.icebergType = opts.icebergType;
			this.icebergCode = opts.icebergCode;
			this.details = opts.details;
			this.isCommitStateUnknown = opts.icebergType === "CommitStateUnknownException" || [
				500,
				502,
				504
			].includes(opts.status) && opts.icebergType?.includes("CommitState") === true;
		}
		/**
		* Returns true if the error is a 404 Not Found error.
		*/
		isNotFound() {
			return this.status === 404;
		}
		/**
		* Returns true if the error is a 409 Conflict error.
		*/
		isConflict() {
			return this.status === 409;
		}
		/**
		* Returns true if the error is a 419 Authentication Timeout error.
		*/
		isAuthenticationTimeout() {
			return this.status === 419;
		}
	};
	NamespaceOperations = class {
		constructor(client, prefix = "") {
			this.client = client;
			this.prefix = prefix;
		}
		async listNamespaces(parent) {
			const query = parent ? { parent: namespaceToPath(parent.namespace) } : void 0;
			return (await this.client.request({
				method: "GET",
				path: `${this.prefix}/namespaces`,
				query
			})).data.namespaces.map((ns) => ({ namespace: ns }));
		}
		async createNamespace(id, metadata) {
			const request = {
				namespace: id.namespace,
				properties: metadata?.properties
			};
			return (await this.client.request({
				method: "POST",
				path: `${this.prefix}/namespaces`,
				body: request
			})).data;
		}
		async dropNamespace(id) {
			await this.client.request({
				method: "DELETE",
				path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
			});
		}
		async loadNamespaceMetadata(id) {
			return { properties: (await this.client.request({
				method: "GET",
				path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
			})).data.properties };
		}
		async namespaceExists(id) {
			try {
				await this.client.request({
					method: "HEAD",
					path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
				});
				return true;
			} catch (error) {
				if (error instanceof IcebergError && error.status === 404) return false;
				throw error;
			}
		}
		async createNamespaceIfNotExists(id, metadata) {
			try {
				return await this.createNamespace(id, metadata);
			} catch (error) {
				if (error instanceof IcebergError && error.status === 409) return;
				throw error;
			}
		}
	};
	TableOperations = class {
		constructor(client, prefix = "", accessDelegation) {
			this.client = client;
			this.prefix = prefix;
			this.accessDelegation = accessDelegation;
		}
		async listTables(namespace) {
			return (await this.client.request({
				method: "GET",
				path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`
			})).data.identifiers;
		}
		async createTable(namespace, request) {
			const headers = {};
			if (this.accessDelegation) headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
			return (await this.client.request({
				method: "POST",
				path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`,
				body: request,
				headers
			})).data.metadata;
		}
		async updateTable(id, request) {
			const response = await this.client.request({
				method: "POST",
				path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
				body: request
			});
			return {
				"metadata-location": response.data["metadata-location"],
				metadata: response.data.metadata
			};
		}
		async dropTable(id, options) {
			await this.client.request({
				method: "DELETE",
				path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
				query: { purgeRequested: String(options?.purge ?? false) }
			});
		}
		async loadTable(id) {
			const headers = {};
			if (this.accessDelegation) headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
			return (await this.client.request({
				method: "GET",
				path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
				headers
			})).data.metadata;
		}
		async tableExists(id) {
			const headers = {};
			if (this.accessDelegation) headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
			try {
				await this.client.request({
					method: "HEAD",
					path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
					headers
				});
				return true;
			} catch (error) {
				if (error instanceof IcebergError && error.status === 404) return false;
				throw error;
			}
		}
		async createTableIfNotExists(namespace, request) {
			try {
				return await this.createTable(namespace, request);
			} catch (error) {
				if (error instanceof IcebergError && error.status === 409) return await this.loadTable({
					namespace: namespace.namespace,
					name: request.name
				});
				throw error;
			}
		}
	};
	IcebergRestCatalog = class {
		/**
		* Creates a new Iceberg REST Catalog client.
		*
		* @param options - Configuration options for the catalog client
		*/
		constructor(options) {
			let prefix = "v1";
			if (options.catalogName) prefix += `/${options.catalogName}`;
			const baseUrl = options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`;
			this.client = createFetchClient({
				baseUrl,
				auth: options.auth,
				fetchImpl: options.fetch
			});
			this.accessDelegation = options.accessDelegation?.join(",");
			this.namespaceOps = new NamespaceOperations(this.client, prefix);
			this.tableOps = new TableOperations(this.client, prefix, this.accessDelegation);
		}
		/**
		* Lists all namespaces in the catalog.
		*
		* @param parent - Optional parent namespace to list children under
		* @returns Array of namespace identifiers
		*
		* @example
		* ```typescript
		* // List all top-level namespaces
		* const namespaces = await catalog.listNamespaces();
		*
		* // List namespaces under a parent
		* const children = await catalog.listNamespaces({ namespace: ['analytics'] });
		* ```
		*/
		async listNamespaces(parent) {
			return this.namespaceOps.listNamespaces(parent);
		}
		/**
		* Creates a new namespace in the catalog.
		*
		* @param id - Namespace identifier to create
		* @param metadata - Optional metadata properties for the namespace
		* @returns Response containing the created namespace and its properties
		*
		* @example
		* ```typescript
		* const response = await catalog.createNamespace(
		*   { namespace: ['analytics'] },
		*   { properties: { owner: 'data-team' } }
		* );
		* console.log(response.namespace); // ['analytics']
		* console.log(response.properties); // { owner: 'data-team', ... }
		* ```
		*/
		async createNamespace(id, metadata) {
			return this.namespaceOps.createNamespace(id, metadata);
		}
		/**
		* Drops a namespace from the catalog.
		*
		* The namespace must be empty (contain no tables) before it can be dropped.
		*
		* @param id - Namespace identifier to drop
		*
		* @example
		* ```typescript
		* await catalog.dropNamespace({ namespace: ['analytics'] });
		* ```
		*/
		async dropNamespace(id) {
			await this.namespaceOps.dropNamespace(id);
		}
		/**
		* Loads metadata for a namespace.
		*
		* @param id - Namespace identifier to load
		* @returns Namespace metadata including properties
		*
		* @example
		* ```typescript
		* const metadata = await catalog.loadNamespaceMetadata({ namespace: ['analytics'] });
		* console.log(metadata.properties);
		* ```
		*/
		async loadNamespaceMetadata(id) {
			return this.namespaceOps.loadNamespaceMetadata(id);
		}
		/**
		* Lists all tables in a namespace.
		*
		* @param namespace - Namespace identifier to list tables from
		* @returns Array of table identifiers
		*
		* @example
		* ```typescript
		* const tables = await catalog.listTables({ namespace: ['analytics'] });
		* console.log(tables); // [{ namespace: ['analytics'], name: 'events' }, ...]
		* ```
		*/
		async listTables(namespace) {
			return this.tableOps.listTables(namespace);
		}
		/**
		* Creates a new table in the catalog.
		*
		* @param namespace - Namespace to create the table in
		* @param request - Table creation request including name, schema, partition spec, etc.
		* @returns Table metadata for the created table
		*
		* @example
		* ```typescript
		* const metadata = await catalog.createTable(
		*   { namespace: ['analytics'] },
		*   {
		*     name: 'events',
		*     schema: {
		*       type: 'struct',
		*       fields: [
		*         { id: 1, name: 'id', type: 'long', required: true },
		*         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
		*       ],
		*       'schema-id': 0
		*     },
		*     'partition-spec': {
		*       'spec-id': 0,
		*       fields: [
		*         { source_id: 2, field_id: 1000, name: 'ts_day', transform: 'day' }
		*       ]
		*     }
		*   }
		* );
		* ```
		*/
		async createTable(namespace, request) {
			return this.tableOps.createTable(namespace, request);
		}
		/**
		* Updates an existing table's metadata.
		*
		* Can update the schema, partition spec, or properties of a table.
		*
		* @param id - Table identifier to update
		* @param request - Update request with fields to modify
		* @returns Response containing the metadata location and updated table metadata
		*
		* @example
		* ```typescript
		* const response = await catalog.updateTable(
		*   { namespace: ['analytics'], name: 'events' },
		*   {
		*     properties: { 'read.split.target-size': '134217728' }
		*   }
		* );
		* console.log(response['metadata-location']); // s3://...
		* console.log(response.metadata); // TableMetadata object
		* ```
		*/
		async updateTable(id, request) {
			return this.tableOps.updateTable(id, request);
		}
		/**
		* Drops a table from the catalog.
		*
		* @param id - Table identifier to drop
		*
		* @example
		* ```typescript
		* await catalog.dropTable({ namespace: ['analytics'], name: 'events' });
		* ```
		*/
		async dropTable(id, options) {
			await this.tableOps.dropTable(id, options);
		}
		/**
		* Loads metadata for a table.
		*
		* @param id - Table identifier to load
		* @returns Table metadata including schema, partition spec, location, etc.
		*
		* @example
		* ```typescript
		* const metadata = await catalog.loadTable({ namespace: ['analytics'], name: 'events' });
		* console.log(metadata.schema);
		* console.log(metadata.location);
		* ```
		*/
		async loadTable(id) {
			return this.tableOps.loadTable(id);
		}
		/**
		* Checks if a namespace exists in the catalog.
		*
		* @param id - Namespace identifier to check
		* @returns True if the namespace exists, false otherwise
		*
		* @example
		* ```typescript
		* const exists = await catalog.namespaceExists({ namespace: ['analytics'] });
		* console.log(exists); // true or false
		* ```
		*/
		async namespaceExists(id) {
			return this.namespaceOps.namespaceExists(id);
		}
		/**
		* Checks if a table exists in the catalog.
		*
		* @param id - Table identifier to check
		* @returns True if the table exists, false otherwise
		*
		* @example
		* ```typescript
		* const exists = await catalog.tableExists({ namespace: ['analytics'], name: 'events' });
		* console.log(exists); // true or false
		* ```
		*/
		async tableExists(id) {
			return this.tableOps.tableExists(id);
		}
		/**
		* Creates a namespace if it does not exist.
		*
		* If the namespace already exists, returns void. If created, returns the response.
		*
		* @param id - Namespace identifier to create
		* @param metadata - Optional metadata properties for the namespace
		* @returns Response containing the created namespace and its properties, or void if it already exists
		*
		* @example
		* ```typescript
		* const response = await catalog.createNamespaceIfNotExists(
		*   { namespace: ['analytics'] },
		*   { properties: { owner: 'data-team' } }
		* );
		* if (response) {
		*   console.log('Created:', response.namespace);
		* } else {
		*   console.log('Already exists');
		* }
		* ```
		*/
		async createNamespaceIfNotExists(id, metadata) {
			return this.namespaceOps.createNamespaceIfNotExists(id, metadata);
		}
		/**
		* Creates a table if it does not exist.
		*
		* If the table already exists, returns its metadata instead.
		*
		* @param namespace - Namespace to create the table in
		* @param request - Table creation request including name, schema, partition spec, etc.
		* @returns Table metadata for the created or existing table
		*
		* @example
		* ```typescript
		* const metadata = await catalog.createTableIfNotExists(
		*   { namespace: ['analytics'] },
		*   {
		*     name: 'events',
		*     schema: {
		*       type: 'struct',
		*       fields: [
		*         { id: 1, name: 'id', type: 'long', required: true },
		*         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
		*       ],
		*       'schema-id': 0
		*     }
		*   }
		* );
		* ```
		*/
		async createTableIfNotExists(namespace, request) {
			return this.tableOps.createTableIfNotExists(namespace, request);
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/StorageAnalyticsClient.js
var StorageAnalyticsClient;
var init_StorageAnalyticsClient = __esmMin((() => {
	init_dist();
	init_constants$1();
	init_errors$1();
	init_fetch$1();
	init_helpers$1();
	StorageAnalyticsClient = class {
		/**
		* @alpha
		*
		* Creates a new StorageAnalyticsClient instance
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Analytics Buckets
		* @param url - The base URL for the storage API
		* @param headers - HTTP headers to include in requests
		* @param fetch - Optional custom fetch implementation
		*
		* @example
		* ```typescript
		* const client = new StorageAnalyticsClient(url, headers)
		* ```
		*/
		constructor(url, headers = {}, fetch) {
			this.shouldThrowOnError = false;
			this.url = url.replace(/\/$/, "");
			this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS$1), headers);
			this.fetch = resolveFetch$1(fetch);
		}
		/**
		* @alpha
		*
		* Enable throwing errors instead of returning them in the response
		* When enabled, failed operations will throw instead of returning { data: null, error }
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Analytics Buckets
		* @returns This instance for method chaining
		*/
		throwOnError() {
			this.shouldThrowOnError = true;
			return this;
		}
		/**
		* @alpha
		*
		* Creates a new analytics bucket using Iceberg tables
		* Analytics buckets are optimized for analytical queries and data processing
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Analytics Buckets
		* @param name A unique name for the bucket you are creating
		* @returns Promise with response containing newly created analytics bucket or error
		*
		* @example Create analytics bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .analytics
		*   .createBucket('analytics-data')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "name": "analytics-data",
		*     "type": "ANALYTICS",
		*     "format": "iceberg",
		*     "created_at": "2024-05-22T22:26:05.100Z",
		*     "updated_at": "2024-05-22T22:26:05.100Z"
		*   },
		*   "error": null
		* }
		* ```
		*/
		createBucket(name) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post$1(this.fetch, `${this.url}/bucket`, { name }, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* @alpha
		*
		* Retrieves the details of all Analytics Storage buckets within an existing project
		* Only returns buckets of type 'ANALYTICS'
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Analytics Buckets
		* @param options Query parameters for listing buckets
		* @param options.limit Maximum number of buckets to return
		* @param options.offset Number of buckets to skip
		* @param options.sortColumn Column to sort by ('name', 'created_at', 'updated_at')
		* @param options.sortOrder Sort order ('asc' or 'desc')
		* @param options.search Search term to filter bucket names
		* @returns Promise with response containing array of analytics buckets or error
		*
		* @example List analytics buckets
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .analytics
		*   .listBuckets({
		*     limit: 10,
		*     offset: 0,
		*     sortColumn: 'created_at',
		*     sortOrder: 'desc'
		*   })
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": [
		*     {
		*       "name": "analytics-data",
		*       "type": "ANALYTICS",
		*       "format": "iceberg",
		*       "created_at": "2024-05-22T22:26:05.100Z",
		*       "updated_at": "2024-05-22T22:26:05.100Z"
		*     }
		*   ],
		*   "error": null
		* }
		* ```
		*/
		listBuckets(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					const queryParams = new URLSearchParams();
					if ((options === null || options === void 0 ? void 0 : options.limit) !== void 0) queryParams.set("limit", options.limit.toString());
					if ((options === null || options === void 0 ? void 0 : options.offset) !== void 0) queryParams.set("offset", options.offset.toString());
					if (options === null || options === void 0 ? void 0 : options.sortColumn) queryParams.set("sortColumn", options.sortColumn);
					if (options === null || options === void 0 ? void 0 : options.sortOrder) queryParams.set("sortOrder", options.sortOrder);
					if (options === null || options === void 0 ? void 0 : options.search) queryParams.set("search", options.search);
					const queryString = queryParams.toString();
					const url = queryString ? `${this.url}/bucket?${queryString}` : `${this.url}/bucket`;
					return {
						data: yield get(this.fetch, url, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* @alpha
		*
		* Deletes an existing analytics bucket
		* A bucket can't be deleted with existing objects inside it
		* You must first empty the bucket before deletion
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Analytics Buckets
		* @param bucketName The unique identifier of the bucket you would like to delete
		* @returns Promise with response containing success message or error
		*
		* @example Delete analytics bucket
		* ```js
		* const { data, error } = await supabase
		*   .storage
		*   .analytics
		*   .deleteBucket('analytics-data')
		* ```
		*
		* Response:
		* ```json
		* {
		*   "data": {
		*     "message": "Successfully deleted"
		*   },
		*   "error": null
		* }
		* ```
		*/
		deleteBucket(bucketName) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield remove(this.fetch, `${this.url}/bucket/${bucketName}`, {}, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/**
		* @alpha
		*
		* Get an Iceberg REST Catalog client configured for a specific analytics bucket
		* Use this to perform advanced table and namespace operations within the bucket
		* The returned client provides full access to the Apache Iceberg REST Catalog API
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Analytics Buckets
		* @param bucketName - The name of the analytics bucket (warehouse) to connect to
		* @returns Configured IcebergRestCatalog instance for advanced Iceberg operations
		*
		* @example Get catalog and create table
		* ```js
		* // First, create an analytics bucket
		* const { data: bucket, error: bucketError } = await supabase
		*   .storage
		*   .analytics
		*   .createBucket('analytics-data')
		*
		* // Get the Iceberg catalog for that bucket
		* const catalog = supabase.storage.analytics.from('analytics-data')
		*
		* // Create a namespace
		* await catalog.createNamespace({ namespace: ['default'] })
		*
		* // Create a table with schema
		* await catalog.createTable(
		*   { namespace: ['default'] },
		*   {
		*     name: 'events',
		*     schema: {
		*       type: 'struct',
		*       fields: [
		*         { id: 1, name: 'id', type: 'long', required: true },
		*         { id: 2, name: 'timestamp', type: 'timestamp', required: true },
		*         { id: 3, name: 'user_id', type: 'string', required: false }
		*       ],
		*       'schema-id': 0,
		*       'identifier-field-ids': [1]
		*     },
		*     'partition-spec': {
		*       'spec-id': 0,
		*       fields: []
		*     },
		*     'write-order': {
		*       'order-id': 0,
		*       fields: []
		*     },
		*     properties: {
		*       'write.format.default': 'parquet'
		*     }
		*   }
		* )
		* ```
		*
		* @example List tables in namespace
		* ```js
		* const catalog = supabase.storage.analytics.from('analytics-data')
		*
		* // List all tables in the default namespace
		* const tables = await catalog.listTables({ namespace: ['default'] })
		* console.log(tables) // [{ namespace: ['default'], name: 'events' }]
		* ```
		*
		* @example Working with namespaces
		* ```js
		* const catalog = supabase.storage.analytics.from('analytics-data')
		*
		* // List all namespaces
		* const namespaces = await catalog.listNamespaces()
		*
		* // Create namespace with properties
		* await catalog.createNamespace(
		*   { namespace: ['production'] },
		*   { properties: { owner: 'data-team', env: 'prod' } }
		* )
		* ```
		*
		* @example Cleanup operations
		* ```js
		* const catalog = supabase.storage.analytics.from('analytics-data')
		*
		* // Drop table with purge option (removes all data)
		* await catalog.dropTable(
		*   { namespace: ['default'], name: 'events' },
		*   { purge: true }
		* )
		*
		* // Drop namespace (must be empty)
		* await catalog.dropNamespace({ namespace: ['default'] })
		* ```
		*
		* @example Error handling with catalog operations
		* ```js
		* import { IcebergError } from 'iceberg-js'
		*
		* const catalog = supabase.storage.analytics.from('analytics-data')
		*
		* try {
		*   await catalog.dropTable({ namespace: ['default'], name: 'events' }, { purge: true })
		* } catch (error) {
		*   // Handle 404 errors (resource not found)
		*   const is404 =
		*     (error instanceof IcebergError && error.status === 404) ||
		*     error?.status === 404 ||
		*     error?.details?.error?.code === 404
		*
		*   if (is404) {
		*     console.log('Table does not exist')
		*   } else {
		*     throw error // Re-throw other errors
		*   }
		* }
		* ```
		*
		* @remarks
		* This method provides a bridge between Supabase's bucket management and the standard
		* Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter.
		* All authentication and configuration is handled automatically using your Supabase credentials.
		*
		* **Error Handling**: Operations may throw `IcebergError` from the iceberg-js library.
		* Always handle 404 errors gracefully when checking for resource existence.
		*
		* **Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently
		* deletes all table data. Without it, the table is marked as deleted but data remains.
		*
		* **Library Dependency**: The returned catalog is an instance of `IcebergRestCatalog`
		* from iceberg-js. For complete API documentation and advanced usage, refer to the
		* [iceberg-js documentation](https://supabase.github.io/iceberg-js/).
		*
		* For advanced Iceberg operations beyond bucket management, you can also install and use
		* the `iceberg-js` package directly with manual configuration.
		*/
		from(bucketName) {
			if (!isValidBucketName(bucketName)) throw new StorageError("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
			return new IcebergRestCatalog({
				baseUrl: this.url,
				catalogName: bucketName,
				auth: {
					type: "custom",
					getHeaders: () => __awaiter(this, void 0, void 0, function* () {
						return this.headers;
					})
				},
				fetch: this.fetch
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/constants.js
var DEFAULT_HEADERS;
var init_constants = __esmMin((() => {
	init_version();
	DEFAULT_HEADERS = {
		"X-Client-Info": `storage-js/${version}`,
		"Content-Type": "application/json"
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/errors.js
/**
* Type guard to check if an error is a StorageVectorsError
* @param error - The error to check
* @returns True if the error is a StorageVectorsError
*/
function isStorageVectorsError(error) {
	return typeof error === "object" && error !== null && "__isStorageVectorsError" in error;
}
var StorageVectorsError, StorageVectorsApiError, StorageVectorsUnknownError, StorageVectorsErrorCode;
var init_errors = __esmMin((() => {
	StorageVectorsError = class extends Error {
		constructor(message) {
			super(message);
			this.__isStorageVectorsError = true;
			this.name = "StorageVectorsError";
		}
	};
	StorageVectorsApiError = class extends StorageVectorsError {
		constructor(message, status, statusCode) {
			super(message);
			this.name = "StorageVectorsApiError";
			this.status = status;
			this.statusCode = statusCode;
		}
		toJSON() {
			return {
				name: this.name,
				message: this.message,
				status: this.status,
				statusCode: this.statusCode
			};
		}
	};
	StorageVectorsUnknownError = class extends StorageVectorsError {
		constructor(message, originalError) {
			super(message);
			this.name = "StorageVectorsUnknownError";
			this.originalError = originalError;
		}
	};
	(function(StorageVectorsErrorCode) {
		/** Internal server fault (HTTP 500) */
		StorageVectorsErrorCode["InternalError"] = "InternalError";
		/** Resource already exists / conflict (HTTP 409) */
		StorageVectorsErrorCode["S3VectorConflictException"] = "S3VectorConflictException";
		/** Resource not found (HTTP 404) */
		StorageVectorsErrorCode["S3VectorNotFoundException"] = "S3VectorNotFoundException";
		/** Delete bucket while not empty (HTTP 400) */
		StorageVectorsErrorCode["S3VectorBucketNotEmpty"] = "S3VectorBucketNotEmpty";
		/** Exceeds bucket quota/limit (HTTP 400) */
		StorageVectorsErrorCode["S3VectorMaxBucketsExceeded"] = "S3VectorMaxBucketsExceeded";
		/** Exceeds index quota/limit (HTTP 400) */
		StorageVectorsErrorCode["S3VectorMaxIndexesExceeded"] = "S3VectorMaxIndexesExceeded";
	})(StorageVectorsErrorCode || (StorageVectorsErrorCode = {}));
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/helpers.js
var resolveFetch, resolveResponse, isPlainObject, normalizeToFloat32, validateVectorDimension;
var init_helpers = __esmMin((() => {
	resolveFetch = (customFetch) => {
		if (customFetch) return (...args) => customFetch(...args);
		return (...args) => fetch(...args);
	};
	resolveResponse = () => {
		return Response;
	};
	isPlainObject = (value) => {
		if (typeof value !== "object" || value === null) return false;
		const prototype = Object.getPrototypeOf(value);
		return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
	};
	normalizeToFloat32 = (values) => {
		return Array.from(new Float32Array(values));
	};
	validateVectorDimension = (vector, expectedDimension) => {
		if (expectedDimension !== void 0 && vector.float32.length !== expectedDimension) throw new Error(`Vector dimension mismatch: expected ${expectedDimension}, got ${vector.float32.length}`);
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/fetch.js
/**
* Internal request handler that wraps fetch with error handling
* @param fetcher - Fetch function to use
* @param method - HTTP method
* @param url - Request URL
* @param options - Custom fetch options
* @param parameters - Additional fetch parameters
* @param body - Request body
* @returns Promise with parsed response or error
*/
function _handleRequest(fetcher, method, url, options, parameters, body) {
	return __awaiter(this, void 0, void 0, function* () {
		return new Promise((resolve, reject) => {
			fetcher(url, _getRequestParams(method, options, parameters, body)).then((result) => {
				if (!result.ok) throw result;
				if (options === null || options === void 0 ? void 0 : options.noResolveJson) return result;
				const contentType = result.headers.get("content-type");
				if (!contentType || !contentType.includes("application/json")) return {};
				return result.json();
			}).then((data) => resolve(data)).catch((error) => handleError(error, reject, options));
		});
	});
}
/**
* Performs a POST request
* @param fetcher - Fetch function to use
* @param url - Request URL
* @param body - Request body to be JSON stringified
* @param options - Custom fetch options
* @param parameters - Additional fetch parameters
* @returns Promise with parsed response
*/
function post(fetcher, url, body, options, parameters) {
	return __awaiter(this, void 0, void 0, function* () {
		return _handleRequest(fetcher, "POST", url, options, parameters, body);
	});
}
var _getErrorMessage, handleError, _getRequestParams;
var init_fetch = __esmMin((() => {
	init_errors();
	init_helpers();
	_getErrorMessage = (err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err);
	handleError = (error, reject, options) => __awaiter(void 0, void 0, void 0, function* () {
		if (error && typeof error === "object" && "status" in error && "ok" in error && typeof error.status === "number" && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) {
			const status = error.status || 500;
			const responseError = error;
			if (typeof responseError.json === "function") responseError.json().then((err) => {
				const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 ? void 0 : err.code) || status + "";
				reject(new StorageVectorsApiError(_getErrorMessage(err), status, statusCode));
			}).catch(() => {
				const statusCode = status + "";
				const message = responseError.statusText || `HTTP ${status} error`;
				reject(new StorageVectorsApiError(message, status, statusCode));
			});
			else {
				const statusCode = status + "";
				const message = responseError.statusText || `HTTP ${status} error`;
				reject(new StorageVectorsApiError(message, status, statusCode));
			}
		} else reject(new StorageVectorsUnknownError(_getErrorMessage(error), error));
	});
	_getRequestParams = (method, options, parameters, body) => {
		const params = {
			method,
			headers: (options === null || options === void 0 ? void 0 : options.headers) || {}
		};
		if (method === "GET" || !body) return params;
		if (isPlainObject(body)) {
			params.headers = Object.assign({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
			params.body = JSON.stringify(body);
		} else params.body = body;
		return Object.assign(Object.assign({}, params), parameters);
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/VectorIndexApi.js
var VectorIndexApi;
var init_VectorIndexApi = __esmMin((() => {
	init_constants();
	init_errors();
	init_fetch();
	init_helpers();
	VectorIndexApi = class {
		/** Creates a new VectorIndexApi instance */
		constructor(url, headers = {}, fetch) {
			this.shouldThrowOnError = false;
			this.url = url.replace(/\/$/, "");
			this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), headers);
			this.fetch = resolveFetch(fetch);
		}
		/** Enable throwing errors instead of returning them in the response */
		throwOnError() {
			this.shouldThrowOnError = true;
			return this;
		}
		/** Creates a new vector index within a bucket */
		createIndex(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: (yield post(this.fetch, `${this.url}/CreateIndex`, options, { headers: this.headers })) || {},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Retrieves metadata for a specific vector index */
		getIndex(vectorBucketName, indexName) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post(this.fetch, `${this.url}/GetIndex`, {
							vectorBucketName,
							indexName
						}, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Lists vector indexes within a bucket with optional filtering and pagination */
		listIndexes(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post(this.fetch, `${this.url}/ListIndexes`, options, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Deletes a vector index and all its data */
		deleteIndex(vectorBucketName, indexName) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: (yield post(this.fetch, `${this.url}/DeleteIndex`, {
							vectorBucketName,
							indexName
						}, { headers: this.headers })) || {},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/VectorDataApi.js
var VectorDataApi;
var init_VectorDataApi = __esmMin((() => {
	init_constants();
	init_errors();
	init_fetch();
	init_helpers();
	VectorDataApi = class {
		/** Creates a new VectorDataApi instance */
		constructor(url, headers = {}, fetch) {
			this.shouldThrowOnError = false;
			this.url = url.replace(/\/$/, "");
			this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), headers);
			this.fetch = resolveFetch(fetch);
		}
		/** Enable throwing errors instead of returning them in the response */
		throwOnError() {
			this.shouldThrowOnError = true;
			return this;
		}
		/** Inserts or updates vectors in batch (1-500 per request) */
		putVectors(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					if (options.vectors.length < 1 || options.vectors.length > 500) throw new Error("Vector batch size must be between 1 and 500 items");
					return {
						data: (yield post(this.fetch, `${this.url}/PutVectors`, options, { headers: this.headers })) || {},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Retrieves vectors by their keys in batch */
		getVectors(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post(this.fetch, `${this.url}/GetVectors`, options, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Lists vectors in an index with pagination */
		listVectors(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					if (options.segmentCount !== void 0) {
						if (options.segmentCount < 1 || options.segmentCount > 16) throw new Error("segmentCount must be between 1 and 16");
						if (options.segmentIndex !== void 0) {
							if (options.segmentIndex < 0 || options.segmentIndex >= options.segmentCount) throw new Error(`segmentIndex must be between 0 and ${options.segmentCount - 1}`);
						}
					}
					return {
						data: yield post(this.fetch, `${this.url}/ListVectors`, options, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Queries for similar vectors using approximate nearest neighbor search */
		queryVectors(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post(this.fetch, `${this.url}/QueryVectors`, options, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Deletes vectors by their keys in batch (1-500 per request) */
		deleteVectors(options) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					if (options.keys.length < 1 || options.keys.length > 500) throw new Error("Keys batch size must be between 1 and 500 items");
					return {
						data: (yield post(this.fetch, `${this.url}/DeleteVectors`, options, { headers: this.headers })) || {},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/VectorBucketApi.js
var VectorBucketApi;
var init_VectorBucketApi = __esmMin((() => {
	init_constants();
	init_errors();
	init_fetch();
	init_helpers();
	VectorBucketApi = class {
		/** Creates a new VectorBucketApi instance */
		constructor(url, headers = {}, fetch) {
			this.shouldThrowOnError = false;
			this.url = url.replace(/\/$/, "");
			this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), headers);
			this.fetch = resolveFetch(fetch);
		}
		/** Enable throwing errors instead of returning them in the response */
		throwOnError() {
			this.shouldThrowOnError = true;
			return this;
		}
		/** Creates a new vector bucket */
		createBucket(vectorBucketName) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: (yield post(this.fetch, `${this.url}/CreateVectorBucket`, { vectorBucketName }, { headers: this.headers })) || {},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Retrieves metadata for a specific vector bucket */
		getBucket(vectorBucketName) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: yield post(this.fetch, `${this.url}/GetVectorBucket`, { vectorBucketName }, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Lists vector buckets with optional filtering and pagination */
		listBuckets() {
			return __awaiter(this, arguments, void 0, function* (options = {}) {
				try {
					return {
						data: yield post(this.fetch, `${this.url}/ListVectorBuckets`, options, { headers: this.headers }),
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
		/** Deletes a vector bucket (must be empty first) */
		deleteBucket(vectorBucketName) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					return {
						data: (yield post(this.fetch, `${this.url}/DeleteVectorBucket`, { vectorBucketName }, { headers: this.headers })) || {},
						error: null
					};
				} catch (error) {
					if (this.shouldThrowOnError) throw error;
					if (isStorageVectorsError(error)) return {
						data: null,
						error
					};
					throw error;
				}
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/StorageVectorsClient.js
var StorageVectorsClient, VectorBucketScope, VectorIndexScope;
var init_StorageVectorsClient = __esmMin((() => {
	init_VectorIndexApi();
	init_VectorDataApi();
	init_VectorBucketApi();
	StorageVectorsClient = class extends VectorBucketApi {
		/**
		* @alpha
		*
		* Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param url - Base URL of the Storage Vectors REST API.
		* @param options.headers - Optional headers (for example `Authorization`) applied to every request.
		* @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
		*
		* @example
		* ```typescript
		* const client = new StorageVectorsClient(url, options)
		* ```
		*/
		constructor(url, options = {}) {
			super(url, options.headers || {}, options.fetch);
		}
		/**
		*
		* @alpha
		*
		* Access operations for a specific vector bucket
		* Returns a scoped client for index and vector operations within the bucket
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param vectorBucketName - Name of the vector bucket
		* @returns Bucket-scoped client with index and vector operations
		*
		* @example
		* ```typescript
		* const bucket = supabase.storage.vectors.from('embeddings-prod')
		* ```
		*/
		from(vectorBucketName) {
			return new VectorBucketScope(this.url, this.headers, vectorBucketName, this.fetch);
		}
		/**
		*
		* @alpha
		*
		* Creates a new vector bucket
		* Vector buckets are containers for vector indexes and their data
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param vectorBucketName - Unique name for the vector bucket
		* @returns Promise with empty response on success or error
		*
		* @example
		* ```typescript
		* const { data, error } = await supabase
		*   .storage
		*   .vectors
		*   .createBucket('embeddings-prod')
		* ```
		*/
		createBucket(vectorBucketName) {
			const _super = Object.create(null, { createBucket: { get: () => super.createBucket } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.createBucket.call(this, vectorBucketName);
			});
		}
		/**
		*
		* @alpha
		*
		* Retrieves metadata for a specific vector bucket
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param vectorBucketName - Name of the vector bucket
		* @returns Promise with bucket metadata or error
		*
		* @example
		* ```typescript
		* const { data, error } = await supabase
		*   .storage
		*   .vectors
		*   .getBucket('embeddings-prod')
		*
		* console.log('Bucket created:', data?.vectorBucket.creationTime)
		* ```
		*/
		getBucket(vectorBucketName) {
			const _super = Object.create(null, { getBucket: { get: () => super.getBucket } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.getBucket.call(this, vectorBucketName);
			});
		}
		/**
		*
		* @alpha
		*
		* Lists all vector buckets with optional filtering and pagination
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Optional filters (prefix, maxResults, nextToken)
		* @returns Promise with list of buckets or error
		*
		* @example
		* ```typescript
		* const { data, error } = await supabase
		*   .storage
		*   .vectors
		*   .listBuckets({ prefix: 'embeddings-' })
		*
		* data?.vectorBuckets.forEach(bucket => {
		*   console.log(bucket.vectorBucketName)
		* })
		* ```
		*/
		listBuckets() {
			const _super = Object.create(null, { listBuckets: { get: () => super.listBuckets } });
			return __awaiter(this, arguments, void 0, function* (options = {}) {
				return _super.listBuckets.call(this, options);
			});
		}
		/**
		*
		* @alpha
		*
		* Deletes a vector bucket (bucket must be empty)
		* All indexes must be deleted before deleting the bucket
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param vectorBucketName - Name of the vector bucket to delete
		* @returns Promise with empty response on success or error
		*
		* @example
		* ```typescript
		* const { data, error } = await supabase
		*   .storage
		*   .vectors
		*   .deleteBucket('embeddings-old')
		* ```
		*/
		deleteBucket(vectorBucketName) {
			const _super = Object.create(null, { deleteBucket: { get: () => super.deleteBucket } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.deleteBucket.call(this, vectorBucketName);
			});
		}
	};
	VectorBucketScope = class extends VectorIndexApi {
		/**
		* @alpha
		*
		* Creates a helper that automatically scopes all index operations to the provided bucket.
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @example
		* ```typescript
		* const bucket = supabase.storage.vectors.from('embeddings-prod')
		* ```
		*/
		constructor(url, headers, vectorBucketName, fetch) {
			super(url, headers, fetch);
			this.vectorBucketName = vectorBucketName;
		}
		/**
		*
		* @alpha
		*
		* Creates a new vector index in this bucket
		* Convenience method that automatically includes the bucket name
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Index configuration (vectorBucketName is automatically set)
		* @returns Promise with empty response on success or error
		*
		* @example
		* ```typescript
		* const bucket = supabase.storage.vectors.from('embeddings-prod')
		* await bucket.createIndex({
		*   indexName: 'documents-openai',
		*   dataType: 'float32',
		*   dimension: 1536,
		*   distanceMetric: 'cosine',
		*   metadataConfiguration: {
		*     nonFilterableMetadataKeys: ['raw_text']
		*   }
		* })
		* ```
		*/
		createIndex(options) {
			const _super = Object.create(null, { createIndex: { get: () => super.createIndex } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.createIndex.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName }));
			});
		}
		/**
		*
		* @alpha
		*
		* Lists indexes in this bucket
		* Convenience method that automatically includes the bucket name
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Listing options (vectorBucketName is automatically set)
		* @returns Promise with response containing indexes array and pagination token or error
		*
		* @example
		* ```typescript
		* const bucket = supabase.storage.vectors.from('embeddings-prod')
		* const { data } = await bucket.listIndexes({ prefix: 'documents-' })
		* ```
		*/
		listIndexes() {
			const _super = Object.create(null, { listIndexes: { get: () => super.listIndexes } });
			return __awaiter(this, arguments, void 0, function* (options = {}) {
				return _super.listIndexes.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName }));
			});
		}
		/**
		*
		* @alpha
		*
		* Retrieves metadata for a specific index in this bucket
		* Convenience method that automatically includes the bucket name
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param indexName - Name of the index to retrieve
		* @returns Promise with index metadata or error
		*
		* @example
		* ```typescript
		* const bucket = supabase.storage.vectors.from('embeddings-prod')
		* const { data } = await bucket.getIndex('documents-openai')
		* console.log('Dimension:', data?.index.dimension)
		* ```
		*/
		getIndex(indexName) {
			const _super = Object.create(null, { getIndex: { get: () => super.getIndex } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.getIndex.call(this, this.vectorBucketName, indexName);
			});
		}
		/**
		*
		* @alpha
		*
		* Deletes an index from this bucket
		* Convenience method that automatically includes the bucket name
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param indexName - Name of the index to delete
		* @returns Promise with empty response on success or error
		*
		* @example
		* ```typescript
		* const bucket = supabase.storage.vectors.from('embeddings-prod')
		* await bucket.deleteIndex('old-index')
		* ```
		*/
		deleteIndex(indexName) {
			const _super = Object.create(null, { deleteIndex: { get: () => super.deleteIndex } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.deleteIndex.call(this, this.vectorBucketName, indexName);
			});
		}
		/**
		*
		* @alpha
		*
		* Access operations for a specific index within this bucket
		* Returns a scoped client for vector data operations
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param indexName - Name of the index
		* @returns Index-scoped client with vector data operations
		*
		* @example
		* ```typescript
		* const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
		*
		* // Insert vectors
		* await index.putVectors({
		*   vectors: [
		*     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
		*   ]
		* })
		*
		* // Query similar vectors
		* const { data } = await index.queryVectors({
		*   queryVector: { float32: [...] },
		*   topK: 5
		* })
		* ```
		*/
		index(indexName) {
			return new VectorIndexScope(this.url, this.headers, this.vectorBucketName, indexName, this.fetch);
		}
	};
	VectorIndexScope = class extends VectorDataApi {
		/**
		*
		* @alpha
		*
		* Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @example
		* ```typescript
		* const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
		* ```
		*/
		constructor(url, headers, vectorBucketName, indexName, fetch) {
			super(url, headers, fetch);
			this.vectorBucketName = vectorBucketName;
			this.indexName = indexName;
		}
		/**
		*
		* @alpha
		*
		* Inserts or updates vectors in this index
		* Convenience method that automatically includes bucket and index names
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Vector insertion options (bucket and index names automatically set)
		* @returns Promise with empty response on success or error
		*
		* @example
		* ```typescript
		* const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
		* await index.putVectors({
		*   vectors: [
		*     {
		*       key: 'doc-1',
		*       data: { float32: [0.1, 0.2, ...] },
		*       metadata: { title: 'Introduction', page: 1 }
		*     }
		*   ]
		* })
		* ```
		*/
		putVectors(options) {
			const _super = Object.create(null, { putVectors: { get: () => super.putVectors } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.putVectors.call(this, Object.assign(Object.assign({}, options), {
					vectorBucketName: this.vectorBucketName,
					indexName: this.indexName
				}));
			});
		}
		/**
		*
		* @alpha
		*
		* Retrieves vectors by keys from this index
		* Convenience method that automatically includes bucket and index names
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Vector retrieval options (bucket and index names automatically set)
		* @returns Promise with response containing vectors array or error
		*
		* @example
		* ```typescript
		* const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
		* const { data } = await index.getVectors({
		*   keys: ['doc-1', 'doc-2'],
		*   returnMetadata: true
		* })
		* ```
		*/
		getVectors(options) {
			const _super = Object.create(null, { getVectors: { get: () => super.getVectors } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.getVectors.call(this, Object.assign(Object.assign({}, options), {
					vectorBucketName: this.vectorBucketName,
					indexName: this.indexName
				}));
			});
		}
		/**
		*
		* @alpha
		*
		* Lists vectors in this index with pagination
		* Convenience method that automatically includes bucket and index names
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Listing options (bucket and index names automatically set)
		* @returns Promise with response containing vectors array and pagination token or error
		*
		* @example
		* ```typescript
		* const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
		* const { data } = await index.listVectors({
		*   maxResults: 500,
		*   returnMetadata: true
		* })
		* ```
		*/
		listVectors() {
			const _super = Object.create(null, { listVectors: { get: () => super.listVectors } });
			return __awaiter(this, arguments, void 0, function* (options = {}) {
				return _super.listVectors.call(this, Object.assign(Object.assign({}, options), {
					vectorBucketName: this.vectorBucketName,
					indexName: this.indexName
				}));
			});
		}
		/**
		*
		* @alpha
		*
		* Queries for similar vectors in this index
		* Convenience method that automatically includes bucket and index names
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Query options (bucket and index names automatically set)
		* @returns Promise with response containing matches array of similar vectors ordered by distance or error
		*
		* @example
		* ```typescript
		* const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
		* const { data } = await index.queryVectors({
		*   queryVector: { float32: [0.1, 0.2, ...] },
		*   topK: 5,
		*   filter: { category: 'technical' },
		*   returnDistance: true,
		*   returnMetadata: true
		* })
		* ```
		*/
		queryVectors(options) {
			const _super = Object.create(null, { queryVectors: { get: () => super.queryVectors } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.queryVectors.call(this, Object.assign(Object.assign({}, options), {
					vectorBucketName: this.vectorBucketName,
					indexName: this.indexName
				}));
			});
		}
		/**
		*
		* @alpha
		*
		* Deletes vectors by keys from this index
		* Convenience method that automatically includes bucket and index names
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @param options - Deletion options (bucket and index names automatically set)
		* @returns Promise with empty response on success or error
		*
		* @example
		* ```typescript
		* const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
		* await index.deleteVectors({
		*   keys: ['doc-1', 'doc-2', 'doc-3']
		* })
		* ```
		*/
		deleteVectors(options) {
			const _super = Object.create(null, { deleteVectors: { get: () => super.deleteVectors } });
			return __awaiter(this, void 0, void 0, function* () {
				return _super.deleteVectors.call(this, Object.assign(Object.assign({}, options), {
					vectorBucketName: this.vectorBucketName,
					indexName: this.indexName
				}));
			});
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/vectors/index.js
var init_vectors = __esmMin((() => {
	init_StorageVectorsClient();
	init_VectorBucketApi();
	init_VectorIndexApi();
	init_VectorDataApi();
	init_errors();
	init_helpers();
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/StorageClient.js
var StorageClient;
var init_StorageClient = __esmMin((() => {
	init_StorageFileApi();
	init_StorageBucketApi();
	init_StorageAnalyticsClient();
	init_vectors();
	StorageClient = class extends StorageBucketApi {
		/**
		* Creates a client for Storage buckets, files, analytics, and vectors.
		*
		* @category File Buckets
		* @example
		* ```ts
		* import { StorageClient } from '@supabase/storage-js'
		*
		* const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
		*   apikey: 'public-anon-key',
		* })
		* const avatars = storage.from('avatars')
		* ```
		*/
		constructor(url, headers = {}, fetch, opts) {
			super(url, headers, fetch, opts);
		}
		/**
		* Perform file operation in a bucket.
		*
		* @category File Buckets
		* @param id The bucket id to operate on.
		*
		* @example
		* ```typescript
		* const avatars = supabase.storage.from('avatars')
		* ```
		*/
		from(id) {
			return new StorageFileApi(this.url, this.headers, id, this.fetch);
		}
		/**
		*
		* @alpha
		*
		* Access vector storage operations.
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Vector Buckets
		* @returns A StorageVectorsClient instance configured with the current storage settings.
		*/
		get vectors() {
			return new StorageVectorsClient(this.url + "/vector", {
				headers: this.headers,
				fetch: this.fetch
			});
		}
		/**
		*
		* @alpha
		*
		* Access analytics storage operations using Iceberg tables.
		*
		* **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
		*
		* @category Analytics Buckets
		* @returns A StorageAnalyticsClient instance configured with the current storage settings.
		*/
		get analytics() {
			return new StorageAnalyticsClient(this.url + "/iceberg", this.headers, this.fetch);
		}
	};
}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/types.js
var init_types = __esmMin((() => {}));
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/index.js
var module_exports = /* @__PURE__ */ __exportAll({
	StorageAnalyticsClient: () => StorageAnalyticsClient,
	StorageApiError: () => StorageApiError,
	StorageClient: () => StorageClient,
	StorageError: () => StorageError,
	StorageUnknownError: () => StorageUnknownError,
	StorageVectorsApiError: () => StorageVectorsApiError,
	StorageVectorsClient: () => StorageVectorsClient,
	StorageVectorsError: () => StorageVectorsError,
	StorageVectorsErrorCode: () => StorageVectorsErrorCode,
	StorageVectorsUnknownError: () => StorageVectorsUnknownError,
	VectorBucketApi: () => VectorBucketApi,
	VectorBucketScope: () => VectorBucketScope,
	VectorDataApi: () => VectorDataApi,
	VectorIndexApi: () => VectorIndexApi,
	VectorIndexScope: () => VectorIndexScope,
	isPlainObject: () => isPlainObject,
	isStorageError: () => isStorageError,
	isStorageVectorsError: () => isStorageVectorsError,
	normalizeToFloat32: () => normalizeToFloat32,
	resolveFetch: () => resolveFetch,
	resolveResponse: () => resolveResponse,
	validateVectorDimension: () => validateVectorDimension
});
var init_module = __esmMin((() => {
	init_StorageClient();
	init_StorageAnalyticsClient();
	init_types();
	init_errors$1();
	init_vectors();
}));
//#endregion
export { module_exports as n, init_module as t };
