import { createRequire } from "node:module";
import { EventEmitter } from "node:events";
import bodyParser from "body-parser";
import mixin from "merge-descriptors";
import once from "once";
import http, { IncomingMessage, METHODS } from "node:http";
import fs from "node:fs";
import path, { extname, isAbsolute, resolve } from "node:path";
import debugModule from "debug";
import { Route, Router, Router as Router$1, methods } from "router";
import finalhandler from "finalhandler";
import etag from "etag";
import qs from "qs";
import mime from "mime-types";
import proxyaddr, { all } from "proxy-addr";
import { Buffer as Buffer$1 } from "node:buffer";
import contentType from "content-type";
import querystring from "node:querystring";
import serveStatic from "serve-static";
import fresh from "fresh";
import typeis from "type-is";
import parse from "parseurl";
import accepts from "accepts";
import { isIP } from "node:net";
import parseRange from "range-parser";
import contentDisposition from "content-disposition";
import createError from "http-errors";
import encodeUrl from "encodeurl";
import escapeHtml from "escape-html";
import onFinished from "on-finished";
import statuses from "statuses";
import cookie from "cookie";
import vary from "vary";
import send from "send";
import { sign } from "cookie-signature";
import depd from "depd";

//#region rolldown:runtime
var __require = /* @__PURE__ */ createRequire(import.meta.url);

//#endregion
//#region src/view.ts
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* 模块依赖
* @private
*/
const debug$1 = debugModule("express:view");
/**
* 视图类
* @public
*/
var View = class {
	/** 默认引擎名称 */
	defaultEngine;
	/** 文件扩展名 */
	ext;
	/** 视图名称 */
	name;
	/** 视图根路径 */
	root;
	/** 视图引擎函数 */
	engine;
	/** 视图文件路径 */
	path;
	/**
	* 使用给定的 `name` 初始化一个新的 `View`
	*
	* 选项：
	*
	*   - `defaultEngine` 默认模板引擎名称
	*   - `engines` 模板引擎 require() 缓存
	*   - `root` 视图查找的根路径
	*
	* @param name - 视图名称
	* @param options - 视图选项
	* @public
	*/
	constructor(name, options) {
		const opts = options;
		this.defaultEngine = opts.defaultEngine;
		this.ext = path.extname(name);
		this.name = name;
		this.root = opts.root;
		if (!this.ext && !this.defaultEngine) throw new Error("No default engine was specified and no extension was provided.");
		let fileName = name;
		if (!this.ext) {
			this.ext = this.defaultEngine[0] !== "." ? "." + this.defaultEngine : this.defaultEngine;
			fileName += this.ext;
		}
		if (!opts.engines[this.ext]) {
			const mod = this.ext.slice(1);
			debug$1("require \"%s\"", mod);
			const fn = __require(mod).__express;
			if (typeof fn !== "function") throw new Error("Module \"" + mod + "\" does not provide a view engine.");
			opts.engines[this.ext] = fn;
		}
		this.engine = opts.engines[this.ext];
		this.path = this.lookup(fileName);
	}
	/**
	* 通过给定的 `name` 查找视图
	*
	* @param name - 视图名称
	* @returns 视图文件路径，如果未找到则返回 undefined
	* @private
	*/
	lookup(name) {
		let filePath;
		const roots = Array.isArray(this.root) ? this.root : [this.root];
		debug$1("lookup \"%s\"", name);
		for (let i = 0; i < roots.length && !filePath; i++) {
			const root = roots[i];
			const loc = path.resolve(root, name);
			const dir = path.dirname(loc);
			const file = path.basename(loc);
			filePath = this.resolve(dir, file);
		}
		return filePath;
	}
	/**
	* 使用给定的选项渲染视图
	*
	* @param options - 渲染选项
	* @param callback - 渲染完成后的回调函数
	* @private
	*/
	render(options, callback) {
		let sync = true;
		debug$1("render \"%s\"", this.path);
		this.engine(this.path, options, (err, rendered) => {
			if (!sync) return callback(err, rendered);
			return process.nextTick(() => {
				return callback(err, rendered);
			});
		});
		sync = false;
	}
	/**
	* 在给定目录中解析文件
	*
	* @param dir - 目录路径
	* @param file - 文件名
	* @returns 解析后的文件路径，如果未找到则返回 undefined
	* @private
	*/
	resolve(dir, file) {
		const ext = this.ext;
		let filePath = path.join(dir, file);
		let stat = tryStat(filePath);
		if (stat && stat.isFile()) return filePath;
		filePath = path.join(dir, path.basename(file, ext), "index" + ext);
		stat = tryStat(filePath);
		if (stat && stat.isFile()) return filePath;
	}
};
/**
* 尝试获取文件状态
*
* @param filePath - 文件路径
* @returns 文件状态对象，如果失败则返回 undefined
* @private
*/
function tryStat(filePath) {
	debug$1("stat \"%s\"", filePath);
	try {
		return fs.statSync(filePath);
	} catch (e) {
		return;
	}
}

//#endregion
//#region src/utils.ts
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* Module dependencies.
* @api private
*/
/**
* A list of lowercased HTTP methods that are supported by Node.js.
* @api private
*/
const methods$1 = METHODS.map((method) => method.toLowerCase());
/**
* Return strong ETag for `body`.
*
* @param {String|Buffer} body
* @param {String} [encoding]
* @return {String}
* @api private
*/
const _etag = createETagGenerator({ weak: false });
/**
* Return weak ETag for `body`.
*
* @param {String|Buffer} body
* @param {String} [encoding]
* @return {String}
* @api private
*/
const wetag = createETagGenerator({ weak: true });
/**
* Normalize the given `type`, for example "html" becomes "text/html".
*
* @param {String} type
* @return {Object}
* @api private
*/
function normalizeType(type) {
	return ~type.indexOf("/") ? acceptParams(type) : {
		value: mime.lookup(type) || "application/octet-stream",
		params: {}
	};
}
/**
* Normalize `types`, for example "html" becomes "text/html".
*
* @param {Array} types
* @return {Array}
* @api private
*/
function normalizeTypes(types) {
	return types.map(normalizeType);
}
/**
* Parse accept params `str` returning an
* object with `.value`, `.quality` and `.params`.
*
* @param {String} str
* @return {Object}
* @api private
*/
function acceptParams(str) {
	const length = str.length;
	const colonIndex = str.indexOf(";");
	let index = colonIndex === -1 ? length : colonIndex;
	const ret = {
		value: str.slice(0, index).trim(),
		quality: 1,
		params: {}
	};
	while (index < length) {
		const splitIndex = str.indexOf("=", index);
		if (splitIndex === -1) break;
		const colonIndex$1 = str.indexOf(";", index);
		const endIndex = colonIndex$1 === -1 ? length : colonIndex$1;
		if (splitIndex > endIndex) {
			index = str.lastIndexOf(";", splitIndex - 1) + 1;
			continue;
		}
		const key = str.slice(index, splitIndex).trim();
		const value = str.slice(splitIndex + 1, endIndex).trim();
		if (key === "q") ret.quality = parseFloat(value);
		else ret.params[key] = value;
		index = endIndex + 1;
	}
	return ret;
}
/**
* Compile "etag" value to function.
*
* @param val
* @api private
*/
function compileETag(val) {
	let fn;
	if (typeof val === "function") return val;
	switch (val) {
		case true:
		case "weak": return wetag;
		case false: break;
		case "strong": return etag;
		default: throw new TypeError("unknown value for etag function: " + val);
	}
	return fn;
}
/**
* Compile "query parser" value to function.
*
* @param  {String|Function} val
* @return {Function}
* @api private
*/
function compileQueryParser(val) {
	let fn;
	if (typeof val === "function") return val;
	switch (val) {
		case true:
		case "simple": return querystring.parse;
		case false: break;
		case "extended": return parseExtendedQueryString;
		default: throw new TypeError("unknown value for query parser function: " + val);
	}
	return fn;
}
/**
* Compile "proxy trust" value to function.
*
* @param val
* @return {Function}
* @api private
*/
function compileTrust(val) {
	if (typeof val === "function") return val;
	if (val === true) return () => true;
	if (typeof val === "number") {
		const n = val;
		return (_, i) => i < n;
	}
	if (typeof val === "string") val = val.split(",").map((v) => v.trim());
	return proxyaddr.compile(val || []);
}
/**
* Set the charset in a given Content-Type string.
*
* @param {String} type
* @param {String} charset
* @return {String}
* @api private
*/
function setCharset(type, charset) {
	if (!type || !charset) return type;
	const parsed = contentType.parse(type);
	parsed.parameters.charset = charset;
	return contentType.format(parsed);
}
/**
* Create an ETag generator function, generating ETags with
* the given options.
*
* @param options
* @private
*/
function createETagGenerator(options) {
	return (body, encoding) => {
		if (Buffer$1.isBuffer(body)) return etag(body, options);
		return etag(Buffer$1.from(body, encoding), options);
	};
}
/**
* Parse an extended query string with qs.
*
* @param str
* @private
*/
function parseExtendedQueryString(str) {
	return qs.parse(str, { allowPrototypes: true });
}

//#endregion
//#region src/application.ts
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* Module dependencies.
* @private
*/
const debug = debugModule("express:application");
/**
* Variable for trust proxy inheritance back-compat
* @private
*/
const trustProxyDefaultSymbol = "@@symbol:trust_proxy_default";
var Application = class extends EventEmitter {
	get;
	all;
	acl;
	bind;
	checkout;
	connect;
	copy;
	delete;
	head;
	link;
	lock;
	"m-search";
	merge;
	mkactivity;
	mkcalendar;
	mkcol;
	move;
	notify;
	options;
	patch;
	post;
	propfind;
	proppatch;
	purge;
	put;
	query;
	rebind;
	report;
	search;
	source;
	subscribe;
	trace;
	unbind;
	unlink;
	unlock;
	unsubscribe;
	#router = null;
	cache;
	engines;
	settings;
	locals;
	mountpath;
	parent;
	request;
	response;
	use;
	constructor() {
		super();
		this.use = this._use.bind(this);
		methods.forEach((method) => {
			this[method] = function(path$1, ...args) {
				if (method === "get" && args.length === 0) return this.set(path$1);
				const route = this.route(path$1);
				route[method].apply(route, args);
				return this;
			};
		});
	}
	/**
	* Initialize the server.
	*
	*   - setup default configuration
	*   - setup default middleware
	*   - setup route reflection methods
	*
	* @private
	*/
	init() {
		this.cache = Object.create(null);
		this.engines = Object.create(null);
		this.settings = Object.create(null);
		this.defaultConfiguration();
	}
	get router() {
		if (this.#router === null) this.#router = new Router$1({
			caseSensitive: this.enabled("case sensitive routing"),
			strict: this.enabled("strict routing")
		});
		return this.#router;
	}
	/**
	* Initialize application configuration.
	* @private
	*/
	defaultConfiguration() {
		const env = process.env.NODE_ENV || "development";
		this.enable("x-powered-by");
		this.set("etag", "weak");
		this.set("env", env);
		this.set("query parser", "simple");
		this.set("subdomain offset", 2);
		this.set("trust proxy", false);
		Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
			configurable: true,
			value: true
		});
		debug("booting in %s mode", env);
		this.on("mount", (parent) => {
			if (this.settings[trustProxyDefaultSymbol] === true && typeof parent.settings["trust proxy fn"] === "function") {
				delete this.settings["trust proxy"];
				delete this.settings["trust proxy fn"];
			}
			Object.setPrototypeOf(this.request, parent.request);
			Object.setPrototypeOf(this.response, parent.response);
			Object.setPrototypeOf(this.engines, parent.engines);
			Object.setPrototypeOf(this.settings, parent.settings);
		});
		this.locals = Object.create(null);
		this.mountpath = "/";
		this.locals.settings = this.settings;
		this.set("view", View);
		this.set("views", resolve("views"));
		this.set("jsonp callback name", "callback");
		if (env === "production") this.enable("view cache");
	}
	/**
	* Dispatch a req, res pair into the application. Starts pipeline processing.
	*
	* If no callback is provided, then default error handlers will respond
	* in the event of an error bubbling through the stack.
	*
	* @private
	* @description 这里接收的是原生的 http.IncomingMessage 和 http.ServerResponse 对象
	*/
	handle(req$1, res$1, callback) {
		const done = callback || finalhandler(req$1, res$1, {
			env: this.get("env"),
			onerror: logerror.bind(this)
		});
		if (this.enabled("x-powered-by")) res$1.setHeader("X-Powered-By", "Express");
		Object.setPrototypeOf(req$1, this.request);
		Object.setPrototypeOf(res$1, this.response);
		const request = req$1;
		const response = res$1;
		request.res = response;
		response.req = request;
		if (!response.locals) response.locals = Object.create(null);
		this.router.handle(request, response, done);
	}
	/**
	* Proxy `Router#use()` to add middleware to the app router.
	* See Router#use() documentation for details.
	*
	* If the _fn_ parameter is an express app, then it will be
	* mounted at the _route_ specified.
	*
	* @public
	*/
	_use(...args) {
		let offset = 0;
		let path$1 = "/";
		const fn = args[0];
		if (typeof fn !== "function") {
			let arg = fn;
			while (Array.isArray(arg) && arg.length !== 0) arg = arg[0];
			if (typeof arg !== "function") {
				offset = 1;
				path$1 = fn;
			}
		}
		const fns = args.slice(offset).flat(Infinity);
		if (fns.length === 0) throw new TypeError("app.use() requires a middleware function");
		const router = this.router;
		fns.forEach(function(fn$1) {
			if (!fn$1 || !fn$1.handle || !fn$1.set) return router.use(path$1, fn$1);
			debug(".use app under %s", path$1);
			fn$1.mountpath = path$1;
			fn$1.parent = this;
			router.use(path$1, (req$1, res$1, next) => {
				const orig = req$1.app;
				fn$1.handle(req$1, res$1, (err) => {
					Object.setPrototypeOf(req$1, orig.request);
					Object.setPrototypeOf(res$1, orig.response);
					next(err);
				});
			});
			fn$1.emit("mount", this);
		}, this);
		return this;
	}
	/**
	* Proxy to the app `Router#route()`
	* Returns a new `Route` instance for the _path_.
	*
	* Routes are isolated middleware stacks for specific paths.
	* See the Route api docs for details.
	*
	* @public
	*/
	route(path$1) {
		return this.router.route(path$1);
	}
	/**
	
	* 注册给定的模板引擎回调函数 `fn`
	* 作为 `ext`。
	*
	* 默认情况下，Express 会根据文件扩展名 `require()` 来引入引擎。
	* 例如，如果您尝试渲染
	* 一个“foo.ejs”文件，Express 将在内部调用以下代码：
	*
	* app.engine('ejs', require('ejs').__express);
	*
	* 对于不提供 `.__express` 的引擎，
	* 或者如果您希望将不同的扩展名“映射”到模板引擎，
	* 您可以使用此方法。例如，将 EJS 模板引擎映射到
	* “.html” 文件：
	*
	* app.engine('html', require('ejs').renderFile);
	*
	* 在这种情况下，EJS 提供了一个 `.renderFile()` 方法，其
	* 签名与 Express 期望的签名相同：`(path, options, callback)`，
	* 但请注意，它在内部将此方法别名为 `ejs.__express`，
	* 因此，如果您使用的是 `.ejs` 扩展名，则无需进行任何操作。
	*
	* 某些模板引擎不遵循此约定，
	* [Consolidate.js](https://github.com/tj/consolidate.js)
	* 创建此库的目的是将所有流行的 Node 模板
	* 引擎映射到遵循此约定，从而使它们能够
	* 在 Express 中无缝运行。
	*
	* @param ext - 文件扩展名
	* @param fn - 渲染引擎函数
	* @public
	*/
	engine(ext, fn) {
		if (typeof fn !== "function") throw new Error("callback function required");
		const extension = ext[0] !== "." ? "." + ext : ext;
		this.engines[extension] = fn;
		return this;
	}
	/**
	* 代理到 `Router#param()`，并添加了一个 API 功能：`_name_` 参数
	* 可以是名称数组。
	*
	* 有关更多详细信息，请参阅 Router#param() 文档。
	*
	* @param name - 参数名称或名称数组
	* @param fn - 处理程序函数
	* @public
	*/
	param(name, fn) {
		if (Array.isArray(name)) {
			for (let i = 0; i < name.length; i++) this.param(name[i], fn);
			return this;
		}
		this.router.param(name, fn);
		return this;
	}
	/**
	* 将 `setting` 赋值给 `val`，或者返回 `setting` 的值
	*
	* @example
	* ```ts
	* app.set('foo', 'bar');
	* app.get('foo');
	* // => "bar"
	* app.set('foo', ['bar', 'baz']);
	* app.get('foo');
	* // => ["bar", "baz"]
	* ```
	*
	* 挂载的服务器会继承其父服务器的设置
	*/
	/**
	* Express 应用的配置方法
	*
	* 该方法用于设置或获取应用的配置项。
	*
	* 用法：
	* ```ts
	* app.set('foo', 'bar');  // 设置配置项
	* const val = app.set('foo'); // 获取配置项，返回 'bar'
	* ```
	*
	* 注意：
	* - 挂载的子应用会继承父应用的配置。
	* - 特定的配置项（如 'etag', 'query parser', 'trust proxy'）会触发对应的函数编译。
	*
	* @param setting - 配置项名称
	* @param val - 配置值，可选。如果未提供，则返回当前值
	* @returns 如果提供了 val，返回 `this` 以支持链式调用；否则返回配置值
	*/
	set(setting, val) {
		if (arguments.length === 1) return this.settings[setting];
		debug("set \"%s\" to %o", setting, val);
		this.settings[setting] = val;
		switch (setting) {
			case "etag":
				this.set("etag fn", compileETag(val));
				break;
			case "query parser":
				this.set("query parser fn", compileQueryParser(val));
				break;
			case "trust proxy":
				this.set("trust proxy fn", compileTrust(val));
				Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
					configurable: true,
					value: false
				});
				break;
		}
		return this;
	}
	/**
	* 返回应用的绝对路径名
	*
	* 基于挂载它的父应用计算。
	*
	* 例如，如果该应用挂载在 "/admin" 下，而 "/admin" 又挂载在 "/blog" 下，
	* 则返回值为 "/blog/admin"。
	*
	* @returns 应用的绝对路径
	* @private
	*/
	path() {
		return this.parent ? this.parent.path() + this.mountpath : "";
	}
	/**
	* Check if `setting` is enabled (truthy).
	*
	*    app.enabled('foo')
	*    // => false
	*
	*    app.enable('foo')
	*    app.enabled('foo')
	*    // => true
	*
	* @param setting
	* @public
	*/
	enabled(setting) {
		return Boolean(this.set(setting));
	}
	/**
	* Check if `setting` is disabled.
	*
	*    app.disabled('foo')
	*    // => true
	*
	*    app.enable('foo')
	*    app.disabled('foo')
	*    // => false
	*
	* @param setting
	* @public
	*/
	disabled(setting) {
		return !this.set(setting);
	}
	/**
	* Enable `setting`.
	*
	* @param setting
	* @return for chaining
	* @public
	*/
	enable(setting) {
		return this.set(setting, true);
	}
	/**
	* Disable `setting`.
	*
	* @param setting
	* @return for chaining
	* @public
	*/
	disable(setting) {
		return this.set(setting, false);
	}
	render(name, options, callback) {
		const cache = this.cache;
		let done = callback;
		const engines = this.engines;
		let opts = options;
		let view;
		if (typeof options === "function") {
			done = options;
			opts = {};
		}
		const renderOptions = {
			...this.locals,
			...opts._locals,
			...opts
		};
		if (renderOptions.cache == null) renderOptions.cache = this.enabled("view cache");
		if (renderOptions.cache) view = cache[name];
		if (!view) {
			view = new (this.get("view"))(name, {
				defaultEngine: this.get("view engine"),
				root: this.get("views"),
				engines
			});
			if (!view.path) {
				const dirs = Array.isArray(view.root) && view.root.length > 1 ? "directories \"" + view.root.slice(0, -1).join("\", \"") + "\" or \"" + view.root[view.root.length - 1] + "\"" : "directory \"" + view.root + "\"";
				const err = /* @__PURE__ */ new Error("Failed to lookup view \"" + name + "\" in views " + dirs);
				err.view = view;
				return done(err);
			}
			if (renderOptions.cache) cache[name] = view;
		}
		tryRender(view, renderOptions, done);
	}
	listen(...args) {
		const server = http.createServer(this);
		if (typeof args[args.length - 1] === "function") {
			const done = args[args.length - 1] = once(args[args.length - 1]);
			server.once("error", done);
		}
		return server.listen.apply(server, args);
	}
};
/**
* Log error using console.error.
*
* @param {Error} err
* @private
*/
function logerror(err) {
	/* istanbul ignore next */
	if (this.settings["env"] !== "test") console.error(err.stack || err.toString());
}
/**
* Try rendering a view.
* @private
*/
function tryRender(view, options, callback) {
	try {
		view.render(options, callback);
	} catch (err) {
		callback(err);
	}
}
const application = new Application();

//#endregion
//#region src/request.ts
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* 模块依赖
* @private
*/
var Request = class extends IncomingMessage {
	app;
	res;
	params;
	body;
	cookies;
	route;
	secret;
	signedCookies;
	baseUrl = "";
	originalUrl = "";
	next;
	accepted;
	/**
	* 返回请求头。
	*
	* `Referrer` 头字段是特殊情况，
	* `Referrer` 和 `Referer` 可以互换使用。
	*
	* 示例：
	*
	*     req.get('Content-Type');
	*     // => "text/plain"
	*
	*     req.get('content-type');
	*     // => "text/plain"
	*
	*     req.get('Something');
	*     // => undefined
	*
	* 别名为 `req.header()`.
	*/
	constructor(socket) {
		super(socket);
		this.socket = socket;
		this.params = {};
		this.accepted = [];
	}
	get(name) {
		return this._header(name);
	}
	header(name) {
		return this._header(name);
	}
	_header(name) {
		if (!name) throw new TypeError("name argument is required to req.get");
		if (typeof name !== "string") throw new TypeError("name must be a string to req.get");
		const lc = name.toLowerCase();
		switch (lc) {
			case "referer":
			case "referrer": return this.headers.referrer || this.headers.referer;
			default: return this.headers[lc];
		}
	}
	accepts(...types) {
		return accepts(this).types(...types);
	}
	acceptsEncodings(...encodings) {
		return accepts(this).encodings(...encodings);
	}
	acceptsCharsets(...charsets) {
		return accepts(this).charsets(...charsets);
	}
	acceptsLanguages(...languages) {
		return accepts(this).languages(...languages);
	}
	/**
	* 解析 Range 头字段，限制到给定的 `size`.
	*
	* 未指定的范围（如 "0-"）需要知道你的资源长度。在
	* 字节范围的情况下，这当然是总字节数。如果未给出
	* Range 头字段，则返回 `undefined`，当无法满足时返回 `-1`，
	* 当语法无效时返回 `-2`.
	*
	* 当返回范围时，数组有一个 "type" 属性，它是所需的
	* 范围类型（最常见的是 "bytes"）。每个数组元素都是一个对象，
	* 具有范围部分的 "start" 和 "end" 属性。
	*
	* "combine" 选项可以设置为 `true`，重叠和相邻的范围
	* 将被合并为单个范围。
	*
	* 注意：记住范围是包含的，所以例如 "Range: users=0-3"
	* 在可用时应该返回 4 个用户，而不是 3 个。
	*/
	range(size, options) {
		const range = this.get("Range");
		if (!range) return;
		return parseRange(size, range, options);
	}
	/**
	* 检查传入的请求是否包含 "Content-Type"
	* 头字段，以及它是否包含给定的 MIME `type`.
	*
	* 示例：
	*
	*      // 当 Content-Type: text/html; charset=utf-8
	*      req.is('html');
	*      req.is('text/html');
	*      req.is('text/*');
	*      // => true
	*
	*      // 当 Content-Type 是 application/json
	*      req.is('json');
	*      req.is('application/json');
	*      req.is('application/*');
	*      // => true
	*
	*      req.is('html');
	*      // => false
	*/
	is(...types) {
		let arr = types;
		if (!Array.isArray(types)) {
			arr = new Array(arguments.length);
			for (let i = 0; i < arr.length; i++) arr[i] = arguments[i];
		}
		return typeis(this, arr);
	}
	/**
	* 解析 `req.url` 的查询字符串。
	*
	* 这使用 "query parser" 设置将原始
	* 字符串解析为对象。
	*/
	get query() {
		const queryparse = this.app.get("query parser fn");
		if (!queryparse) return Object.create(null);
		const querystring$1 = parse(this)?.query;
		return queryparse(querystring$1);
	}
	/**
	* 返回协议字符串 "http" 或 "https"
	* 当使用 TLS 请求时。当 "trust proxy"
	* 设置信任套接字地址时，
	* "X-Forwarded-Proto" 头字段将被信任
	* 并在存在时使用。
	*
	* 如果你在反向代理后面运行，该代理
	* 为你提供 https，可以启用此功能。
	*/
	get protocol() {
		const proto = this.socket.encrypted ? "https" : "http";
		if (!this.app.get("trust proxy fn")(this.socket.remoteAddress, 0)) return proto;
		const header = this.get("X-Forwarded-Proto") || proto;
		const index = header.indexOf(",");
		return index !== -1 ? header.substring(0, index).trim() : header.trim();
	}
	/**
	* 简写形式：
	*
	*    req.protocol === 'https'
	*/
	get secure() {
		return this.protocol === "https";
	}
	/**
	* 从受信任的代理返回远程地址。
	*
	* 这是套接字上的远程地址，除非
	* 设置了 "trust proxy".
	*/
	get ip() {
		const trust = this.app.get("trust proxy fn");
		return proxyaddr(this, trust);
	}
	/**
	* 当设置 "trust proxy" 时，受信任的代理地址 + 客户端。
	*
	* 例如，如果值为 "client, proxy1, proxy2"
	* 你将收到数组 `["client", "proxy1", "proxy2"]`
	* 其中 "proxy2" 是最远的下游，"proxy1" 和
	* "proxy2" 是受信任的。
	*/
	get ips() {
		const trust = this.app.get("trust proxy fn");
		const addrs = all(this, trust);
		addrs.reverse().pop();
		return addrs;
	}
	/**
	* 以数组形式返回子域。
	*
	* 子域是主机在应用程序主域之前的点分隔部分。
	* 默认情况下，应用程序的域被假定为主机的最后两个
	* 部分。这可以通过设置 "subdomain offset" 来更改。
	*
	* 例如，如果域是 "tobi.ferrets.example.com"：
	* 如果未设置 "subdomain offset"，req.subdomains 是 `["ferrets", "tobi"]`.
	* 如果 "subdomain offset" 是 3，req.subdomains 是 `["tobi"]`.
	*/
	get subdomains() {
		const hostname = this.hostname;
		if (!hostname) return [];
		const offset = this.app.get("subdomain offset");
		return (!isIP(hostname) ? hostname.split(".").reverse() : [hostname]).slice(offset);
	}
	/**
	* `url.parse(req.url).pathname` 的简写形式。
	*/
	get path() {
		return parse(this)?.pathname || "";
	}
	/**
	* 解析 "Host" 头字段为主机。
	*
	* 当 "trust proxy" 设置信任套接字
	* 地址时，"X-Forwarded-Host" 头字段将
	* 被信任。
	*/
	get host() {
		const trust = this.app.get("trust proxy fn");
		let val = this.get("X-Forwarded-Host");
		if (!val || !trust(this.socket.remoteAddress, 0)) val = this.get("Host");
		else if (val.indexOf(",") !== -1) val = val.substring(0, val.indexOf(",")).trimEnd();
		return val || "";
	}
	/**
	* 解析 "Host" 头字段为主机名。
	*
	* 当 "trust proxy" 设置信任套接字
	* 地址时，"X-Forwarded-Host" 头字段将
	* 被信任。
	*/
	get hostname() {
		const host = this.host;
		if (!host) return "";
		const offset = host[0] === "[" ? host.indexOf("]") + 1 : 0;
		const index = host.indexOf(":", offset);
		return index !== -1 ? host.substring(0, index) : host;
	}
	/**
	* 检查请求是否新鲜，即
	* Last-Modified 或 ETag
	* 仍然匹配。
	*/
	get fresh() {
		const method = this.method;
		const res$1 = this.res;
		const status = res$1.statusCode;
		if (method !== "GET" && method !== "HEAD") return false;
		if (status >= 200 && status < 300 || status === 304) return fresh(this.headers, {
			etag: res$1.get("ETag"),
			"last-modified": res$1.get("Last-Modified")
		});
		return false;
	}
	/**
	* 检查请求是否陈旧，即
	* 资源的 "Last-Modified" 和/或 "ETag"
	* 已更改。
	*/
	get stale() {
		return !this.fresh;
	}
	/**
	* 检查请求是否为 _XMLHttpRequest_。
	*/
	get xhr() {
		return (this.get("X-Requested-With") || "").toLowerCase() === "xmlhttprequest";
	}
};
const req = Object.create(Request.prototype);

//#endregion
//#region src/response.ts
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* Module dependencies.
* @private
*/
const deprecate = depd("express");
var Response = class extends http.ServerResponse {
	app;
	locals;
	charset = "utf-8";
	/**
	* Set the HTTP status code for the response.
	*
	* Expects an integer value between 100 and 999 inclusive.
	* Throws an error if the provided status code is not an integer or if it's outside the allowable range.
	*
	* @param code - The HTTP status code to set.
	* @return - Returns itself for chaining methods.
	* @throws {TypeError} If `code` is not an integer.
	* @throws {RangeError} If `code` is outside the range 100 to 999.
	* @public
	*/
	status(code) {
		if (!Number.isInteger(code)) throw new TypeError(`Invalid status code: ${JSON.stringify(code)}. Status code must be an integer.`);
		if (code < 100 || code > 999) throw new RangeError(`Invalid status code: ${JSON.stringify(code)}. Status code must be greater than 99 and less than 1000.`);
		this.statusCode = code;
		return this;
	}
	/**
	* Set Link header field with the given links.
	*
	* @example
	* ```ts
	* res.links({
	*   next: 'http://api.example.com/users?page=2',
	*   last: 'http://api.example.com/users?page=5',
	*   pages: [
	*     'http://api.example.com/users?page=1',
	*     'http://api.example.com/users?page=2'
	*   ]
	* });
	* ```
	*/
	links(links) {
		let link = this.get("Link") || "";
		if (link) link += ", ";
		const str = Object.keys(links).map((rel) => {
			if (Array.isArray(links[rel])) return links[rel].map(function(singleLink) {
				return `<${singleLink}>; rel="${rel}"`;
			}).join(", ");
			else return `<${links[rel]}>; rel="${rel}"`;
		}).join(", ");
		return this.set("Link", link + str);
	}
	/**
	* Send a response.
	*
	* @example
	* ```ts
	* res.send(new Buffer('wahoo'));
	* res.send({ some: 'json' });
	* res.send('<p>some html</p>');
	* res.status(404).send('Sorry, cant find that');
	* ```
	*/
	send(body) {
		{
			let chunk = body;
			let encoding;
			const req$1 = this.req;
			let type;
			const app = this.app;
			switch (typeof chunk) {
				case "string":
					if (!this.get("Content-Type")) this.type("html");
					break;
				case "boolean":
				case "number":
				case "object":
					if (chunk === null) chunk = "";
					else if (ArrayBuffer.isView(chunk)) {
						if (!this.get("Content-Type")) this.type("bin");
					} else return this.json(chunk);
					break;
			}
			if (typeof chunk === "string") {
				encoding = "utf8";
				type = this.get("Content-Type");
				if (typeof type === "string") this.set("Content-Type", setCharset(type, "utf-8"));
			}
			const etagFn = app.get("etag fn");
			const generateETag = !this.get("ETag") && typeof etagFn === "function";
			let len;
			if (chunk !== void 0) {
				if (Buffer.isBuffer(chunk)) len = chunk.length;
				else if (!generateETag && chunk.length < 1e3) len = Buffer.byteLength(chunk, encoding);
				else {
					chunk = Buffer.from(chunk, encoding);
					encoding = void 0;
					len = chunk.length;
				}
				this.set("Content-Length", len);
			}
			let etag$1;
			if (generateETag && len !== void 0) {
				if (etag$1 = etagFn(chunk, encoding)) this.set("ETag", etag$1);
			}
			if (req$1.fresh) this.statusCode = 304;
			if (this.statusCode === 204 || this.statusCode === 304) {
				this.removeHeader("Content-Type");
				this.removeHeader("Content-Length");
				this.removeHeader("Transfer-Encoding");
				chunk = "";
			}
			if (this.statusCode === 205) {
				this.set("Content-Length", "0");
				this.removeHeader("Transfer-Encoding");
				chunk = "";
			}
			if (req$1.method === "HEAD") this.end();
			else if (encoding) this.end(chunk, encoding);
			else this.end(chunk);
			return this;
		}
	}
	json(obj) {
		const app = this.app;
		const escape = app.get("json escape");
		const body = stringify(obj, app.get("json replacer"), app.get("json spaces"), escape);
		if (!this.get("Content-Type")) this.set("Content-Type", "application/json");
		return this.send(body);
	}
	jsonp(obj) {
		const app = this.app;
		const escape = app.get("json escape");
		let body = stringify(obj, app.get("json replacer"), app.get("json spaces"), escape);
		let callback = this.req.query[app.get("jsonp callback name")];
		if (!this.get("Content-Type")) {
			this.set("X-Content-Type-Options", "nosniff");
			this.set("Content-Type", "application/json");
		}
		if (Array.isArray(callback)) callback = callback[0];
		if (typeof callback === "string" && callback.length !== 0) {
			this.set("X-Content-Type-Options", "nosniff");
			this.set("Content-Type", "text/javascript");
			callback = callback.replace(/[^\[\]\w$.]/g, "");
			if (body === void 0) body = "";
			else if (typeof body === "string") body = body.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
			body = "/**/ typeof " + callback + " === 'function' && " + callback + "(" + body + ");";
		}
		return this.send(body);
	}
	sendStatus(statusCode) {
		const body = statuses.message[statusCode] || String(statusCode);
		this.status(statusCode);
		this.type("txt");
		return this.send(body);
	}
	sendFile(path$1, options, callback) {
		let done = callback;
		const req$1 = this.req;
		const res$1 = this;
		const next = req$1.next;
		let opts = {};
		if (!path$1) throw new TypeError("path argument is required to res.sendFile");
		if (typeof path$1 !== "string") throw new TypeError("path must be a string to res.sendFile");
		if (typeof options === "function") done = options;
		else if (options) opts = options;
		if (!opts.root && !isAbsolute(path$1)) throw new TypeError("path must be absolute or specify root to res.sendFile");
		const pathname = encodeUrl(path$1);
		opts.etag = this.app.enabled("etag");
		sendfile(res$1, send(req$1, pathname, opts), opts, function(err) {
			if (done) return done(err);
			if (err && err.code === "EISDIR") return next();
			if (err && err.code !== "ECONNABORTED" && err.syscall !== "write") next(err);
		});
	}
	download(path$1, filename, options, callback) {
		let done = callback;
		let name = typeof filename === "string" ? filename : null;
		let opts = null;
		if (typeof filename === "function") {
			done = filename;
			name = null;
			opts = null;
		} else if (typeof options === "function") {
			done = options;
			opts = null;
		} else if (options && typeof options === "object") opts = options;
		if (typeof filename === "object" && (typeof options === "function" || options === void 0)) {
			name = null;
			opts = filename;
		}
		const headers = { "Content-Disposition": contentDisposition(name || path$1) };
		if (opts && opts.headers) {
			const keys = Object.keys(opts.headers);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (key.toLowerCase() !== "content-disposition") headers[key] = opts.headers[key];
			}
		}
		const finalOpts = Object.create(opts || {});
		finalOpts.headers = headers;
		const fullPath = !finalOpts.root ? resolve(path$1) : path$1;
		this.sendFile(fullPath, finalOpts, done);
		return this;
	}
	/**
	* 当 `type` 不包含 "/" 时，通过 `mime.contentType()` 设置 _Content-Type_ 响应头，
	* 否则将 Content-Type 设置为 `type`。
	* 当通过 `mime.contentType()` 找不到映射时，类型设置为
	* "application/octet-stream"。
	*
	* @example
	* ```ts
	* res.type('.html');
	* res.type('html');
	* res.type('json');
	* res.type('application/json');
	* res.type('png');
	* ```
	*/
	contentType(type) {
		const ct = type.indexOf("/") === -1 ? mime.contentType(type) || "application/octet-stream" : type;
		return this.set("Content-Type", ct);
	}
	/**
	* 设置响应头 `Content-Type`。
	*
	* 当 `type` 中不包含 "/" 时，会通过 `mime.lookup()` 来查找对应的 MIME 类型并设置。
	* 否则，直接将 `Content-Type` 设置为 `type`。
	*
	* @example
	* ```ts
	* res.type('.html');
	* res.type('html');
	* res.type('json');
	* res.type('application/json');
	* res.type('png');
	* ```
	*
	* @param type 要设置的内容类型，可以是扩展名（如 `.html`）或完整 MIME 类型（如 `application/json`）。
	*/
	type(type) {
		return this.contentType(type);
	}
	/**
	* 使用 `obj` 的 mime-type 回调响应可接受的格式。
	*
	* 此方法使用 `req.accepted`，一个按质量值排序的可接受类型数组。
	* 当 "Accept" 不存在时，调用 _第一个_ 回调，
	* 否则使用第一个匹配。当没有执行匹配时，
	* 服务器响应 406 "Not Acceptable"。
	*
	* Content-Type 会为你设置，但是如果你选择，
	* 你可以在回调中使用 `res.type()` 或 `res.set('Content-Type', ...)` 更改它。
	*
	* @param obj - MIME 类型到处理函数的映射对象
	*
	* @example
	* ```ts
	* res.format({
	*   'text/plain': function(){
	*     res.send('hey');
	*   },
	*
	*   'text/html': function(){
	*     res.send('<p>hey</p>');
	*   },
	*
	*   'application/json': function () {
	*     res.send({ message: 'hey' });
	*   }
	* });
	* ```
	*
	* 除了规范化的 MIME 类型，你还可以使用映射到这些类型的扩展名：
	*
	* @example
	* ```ts
	* res.format({
	*   text: function(){
	*     res.send('hey');
	*   },
	*
	*   html: function(){
	*     res.send('<p>hey</p>');
	*   },
	*
	*   json: function(){
	*     res.send({ message: 'hey' });
	*   }
	* });
	* ```
	*
	* 默认情况下，如果没有匹配，Express 会将带有 `.status` 为 406 的 `Error`
	* 传递给 `next(err)`。如果你提供 `.default` 回调，它将被调用。
	*/
	format(obj) {
		const req$1 = this.req;
		const next = req$1.next;
		const keys = Object.keys(obj).filter((v) => v !== "default");
		const key = keys.length > 0 ? req$1.accepts(keys) : false;
		this.vary("Accept");
		if (key) {
			this.set("Content-Type", normalizeType(key).value);
			obj[key](req$1, this, next);
		} else if (obj.default) obj.default(req$1, this, next);
		else next(createError(406, { types: normalizeTypes(keys).map((o) => o.value) }));
		return this;
	}
	/**
	* 将 _Content-Disposition_ 头设置为带有可选 `filename` 的 _attachment_。
	*/
	attachment(filename) {
		if (filename) this.type(extname(filename));
		this.set("Content-Disposition", contentDisposition(filename));
		return this;
	}
	/**
	* 向头字段 `field` 追加值 `val`。
	*
	* @example
	* ```ts
	* res.append('Link', ['<http://localhost/>', '<http://localhost:3000/>']);
	* res.append('Set-Cookie', 'foo=bar; Path=/; HttpOnly');
	* res.append('Warning', '199 Miscellaneous warning');
	* ```
	*/
	append(field, val) {
		const prev = this.get(field);
		let value = val;
		if (prev) value = Array.isArray(prev) ? prev.concat(val) : Array.isArray(val) ? [prev].concat(val) : [prev, val];
		return this.set(field, value);
	}
	set(field, val) {
		if (arguments.length === 2) {
			let value = Array.isArray(val) ? val.map(String) : String(val);
			if (typeof field === "string" && field.toLowerCase() === "content-type") {
				if (Array.isArray(value)) throw new TypeError("Content-Type cannot be set to an Array");
				value = mime.contentType(value) || value;
			}
			this.setHeader(field, value);
		} else for (const key in field) this.set(key, field[key]);
		return this;
	}
	header(...args) {
		return this.set(...args);
	}
	/**
	* 获取头字段 `field` 的值。
	* @param field 要获取的 header 字段名
	*
	* @returns 如果该字段包含多个值，则返回一个用逗号连接的字符串。
	*/
	get(field) {
		const value = this.getHeader(field);
		return Array.isArray(value) ? value.join(", ") : value?.toString();
	}
	/**
	* 清除 cookie `name`。
	* @param name 要清除的 cookie 名称
	* @param options 可选的 cookie 选项
	*/
	clearCookie(name, options) {
		const opts = {
			path: "/",
			...options,
			expires: /* @__PURE__ */ new Date(1)
		};
		delete opts.maxAge;
		return this.cookie(name, "", opts);
	}
	cookie(name, value, options) {
		const opts = { ...options };
		const secret = this.req.secret;
		const signed = opts.signed;
		if (signed && !secret) throw new Error("cookieParser(\"secret\") required for signed cookies");
		let val = typeof value === "object" ? "j:" + JSON.stringify(value) : String(value);
		if (signed) val = "s:" + sign(val, secret);
		if (opts.maxAge != null) {
			const maxAge = opts.maxAge - 0;
			if (!isNaN(maxAge)) {
				opts.expires = new Date(Date.now() + maxAge);
				opts.maxAge = Math.floor(maxAge / 1e3);
			}
		}
		if (opts.path == null) opts.path = "/";
		this.append("Set-Cookie", cookie.serialize(name, String(val), opts));
		return this;
	}
	/**
	* 设置响应的 `Location` 头为指定的 URL。
	*
	* @remarks
	* 可以传入绝对路径、相对路径或完整 URL：
	*
	* @example
	* ```ts
	* res.location('/foo/bar');
	* res.location('http://example.com');
	* res.location('../login'); // 如果当前路径是 /blog/post/1，则变为 /blog/login
	* ```
	*
	* 挂载应用时：
	* - 如果传入的路径 **不以 "/" 开头**，则会相对于挂载点。例如应用挂载在 `/blog`：
	*
	* ```ts
	* res.location('login'); // 结果为 /blog/login
	* ```
	*
	* - 如果路径以 "/" 开头，则仍为根路径：
	*
	* ```ts
	* res.location('/login'); // 结果为 /login
	* ```
	*
	* @param url 目标 URL，可以是相对路径或完整 URL
	* @returns 返回 `this`，支持链式调用
	*/
	location(url) {
		let loc = url;
		if (url === "back") loc = this.req.get("Referrer") || "/";
		return this.set("Location", encodeUrl(loc));
	}
	redirect(urlOrStatus, maybeUrl) {
		let status = 302;
		let address;
		if (typeof urlOrStatus === "number" && maybeUrl !== void 0) {
			status = urlOrStatus;
			address = maybeUrl;
		} else address = urlOrStatus;
		if (!address) deprecate("Provide a url argument");
		if (typeof address !== "string") deprecate("Url must be a string");
		if (typeof status !== "number") deprecate("Status must be a number");
		address = this.location(address).get("Location");
		let body = "";
		this.format({
			text: () => {
				body = `${statuses.message[status]}. Redirecting to ${address}`;
			},
			html: () => {
				const u = escapeHtml(address);
				body = `<p>${statuses.message[status]}. Redirecting to ${u}</p>`;
			},
			default: () => {
				body = "";
			}
		});
		this.status(status);
		this.set("Content-Length", Buffer.byteLength(body));
		if (this.req.method === "HEAD") this.end();
		else this.end(body);
	}
	/**
	* 将 `field` 添加到 Vary。如果已存在于 Vary 集中，则此调用会被简单地忽略。
	* @param field 要添加到 Vary 的字段名
	*/
	vary(field) {
		vary(this, field);
		return this;
	}
	render(view, options, callback) {
		const app = this.req.app;
		let done = callback;
		let opts = {};
		if (typeof options === "function") {
			done = options;
			opts = {};
		} else if (options) opts = options;
		opts._locals = this.locals;
		done = done || ((err, str) => {
			if (err) return this.req.next(err);
			this.send(str);
		});
		app.render(view, opts, done);
	}
};
/**
* 传输文件的辅助函数
* @param res 响应对象
* @param file 发送流
* @param options 发送选项
* @param callback 完成回调
*/
const sendfile = (res$1, file, options, callback) => {
	let done = false;
	let streaming;
	function onaborted() {
		if (done) return;
		done = true;
		const err = /* @__PURE__ */ new Error("Request aborted");
		err.code = "ECONNABORTED";
		callback(err);
	}
	function ondirectory() {
		if (done) return;
		done = true;
		const err = /* @__PURE__ */ new Error("EISDIR, read");
		err.code = "EISDIR";
		callback(err);
	}
	function onerror(err) {
		if (done) return;
		done = true;
		callback(err);
	}
	function onend() {
		if (done) return;
		done = true;
		callback();
	}
	function onfile() {
		streaming = false;
	}
	function onfinish(err) {
		if (err && err.code === "ECONNRESET") return onaborted();
		if (err) return onerror(err);
		if (done) return;
		setImmediate(function() {
			if (streaming !== false && !done) {
				onaborted();
				return;
			}
			if (done) return;
			done = true;
			callback();
		});
	}
	function onstream() {
		streaming = true;
	}
	file.on("directory", ondirectory);
	file.on("end", onend);
	file.on("error", onerror);
	file.on("file", onfile);
	file.on("stream", onstream);
	onFinished(res$1, onfinish);
	if (options.headers) file.on("headers", function headers(res$2) {
		const obj = options.headers;
		const keys = Object.keys(obj);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			res$2.setHeader(k, obj[k]);
		}
	});
	file.pipe(res$1);
};
/**
* 字符串化 JSON，类似于 JSON.stringify，但经过 v8 优化，
* 能够转义可能触发 HTML 嗅探的字符。
*
* @private
*/
function stringify(value, replacer, spaces, escape) {
	let json = replacer || spaces ? JSON.stringify(value, replacer, spaces) : JSON.stringify(value);
	if (escape && typeof json === "string") json = json.replace(/[<>&]/g, function(c) {
		switch (c.charCodeAt(0)) {
			case 60: return "\\u003c";
			case 62: return "\\u003e";
			case 38: return "\\u0026";
			default: return c;
		}
	});
	return json;
}
const res = Object.create(Response.prototype);

//#endregion
//#region src/express.ts
/*!
* express
* Copyright(c) 2009-2013 TJ Holowaychuk
* Copyright(c) 2013 Roman Shtylman
* Copyright(c) 2014-2015 Douglas Christopher Wilson
* MIT Licensed
*/
/**
* Module dependencies.
*/
/**
* Create an express application.
*
* @api public
*/
function createApplication() {
	const app = function(req$1, res$1, next) {
		app.handle(req$1, res$1, next);
	};
	mixin(app, EventEmitter.prototype, false);
	mixin(app, Application.prototype, false);
	app.request = Object.create(req, { app: {
		configurable: true,
		enumerable: true,
		writable: true,
		value: app
	} });
	app.response = Object.create(res, { app: {
		configurable: true,
		enumerable: true,
		writable: true,
		value: app
	} });
	app.init();
	return app;
}
const express = Object.assign(createApplication, {
	application,
	request: req,
	response: res,
	Route,
	Router,
	json: bodyParser.json,
	raw: bodyParser.raw,
	static: serveStatic,
	text: bodyParser.text,
	urlencoded: bodyParser.urlencoded
});
console.log(express);

//#endregion
export { Route, Router, application, express as default, express, req as request, res as response };