import { EventEmitter } from "node:events";
import bodyParser from "body-parser";
import http, { IncomingMessage } from "node:http";
import * as router7 from "router";
import { CookieOptions, IRouterHandler, IRouterMatcher, Locals, MediaType, NextFunction, ParamsDictionary, PathParams, RequestHandler, RequestHandlerParams, RequestParamHandler, Route, Route as Route$1, Router, Router as Router$1 } from "router";
import * as qs0 from "qs";
import { ParsedQs } from "qs";
import serveStatic from "serve-static";
import parseRange from "range-parser";
import { SendOptions } from "send";
import { CipherKey } from "node:crypto";
import * as connect0 from "connect";

//#region src/application.types.d.ts
type ApplicationRequestHandler<T> = IRouterHandler<T> & IRouterMatcher<T> & ((...handlers: RequestHandlerParams[]) => T);
//#endregion
//#region src/response.d.ts
type Errback = (err: Error) => void;
interface SendFileOptions extends SendOptions {
  /** Object containing HTTP headers to serve with the file. */
  headers?: Record<string, unknown>;
}
declare class Response<ResBody = any, LocalsObj extends Record<string, any> = Record<string, any>, StatusCode extends number = number> extends http.ServerResponse {
  app: Application;
  req: Request;
  locals: LocalsObj & Locals;
  charset: string;
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
  status(code: StatusCode): this;
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
  links<T extends Record<string, string | string[]>>(links: T): this;
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
  send(body: ResBody): this;
  json(obj: any): this;
  jsonp(obj: any): this;
  sendStatus(statusCode: StatusCode): this;
  /**
   * 传输给定 `path` 的文件。
   *
   * 自动设置 _Content-Type_ 响应头字段。
   * 当传输完成或发生错误时，会调用回调函数 `fn(err)`。
   *
   * @param path - 要传输的文件路径（必须是绝对路径）
   * @param fn - 可选的回调函数，在传输完成或发生错误时调用
   *
   * @example
   * ```ts
   * res.sendFile('/absolute/path/to/file.pdf', function(err){
   *   if (err) {
   *     console.error(err);
   *   } else {
   *     console.log('文件已发送');
   *   }
   * });
   * ```
   */
  sendFile(path: string, fn?: Errback): void;
  /**
   * 传输给定 `path` 的文件，支持自定义选项。
   *
   * 自动设置 _Content-Type_ 响应头字段。
   * 当传输完成或发生错误时，会调用回调函数 `fn(err)`。
   * 如果你希望尝试响应，请务必检查 `res.headersSent`，
   * 因为头和一些数据可能已经被传输。
   *
   * @param path - 要传输的文件路径（可以是相对路径，如果指定了 `options.root`）
   * @param options - 传输选项
   * @param options.maxAge - 浏览器缓存的最大时间（毫秒），默认为 0。可以是字符串，由 `ms` 库解析
   * @param options.root - 相对文件路径的根目录
   * @param options.headers - 与文件一起发送的额外 HTTP 头对象
   * @param options.dotfiles - 如何处理 dotfiles。可以是 `"allow"`、`"deny"` 或 `"ignore"`，默认为 `"ignore"`
   * @param fn - 可选的回调函数，在传输完成或发生错误时调用
   *
   * @remarks
   * 其他选项会传递给底层的 `send` 模块。
   *
   * @example
   * ```ts
   * app.get('/user/:uid/photos/:file', function(req, res){
   *   var uid = req.params.uid
   *     , file = req.params.file;
   *
   *   req.user.mayViewFilesFrom(uid, function(yes){
   *     if (yes) {
   *       res.sendFile('/uploads/' + uid + '/' + file, {
   *         maxAge: '1d',
   *         root: '/path/to/root',
   *         dotfiles: 'deny'
   *       });
   *     } else {
   *       res.send(403, 'Sorry! you cant see that.');
   *     }
   *   });
   * });
   * ```
   */
  sendFile(path: string, options: SendFileOptions, fn?: Errback): void;
  /**
   * 将给定 `path` 的文件作为附件传输。
   *
   * 自动设置 `Content-Disposition` 头为 "attachment"。
   * 当数据传输完成或发生错误时，会调用回调函数 `fn(err)`。
   *
   * @param path - 要下载的文件路径
   * @param fn - 可选的回调函数，在传输完成或发生错误时调用
   *
   * @remarks
   * 此方法使用 `res.sendFile()`。
   *
   * @example
   * ```ts
   * res.download('/report-12345.pdf', function(err){
   *   if (err) {
   *     // 处理错误，但请注意响应可能已部分发送
   *     // 所以检查 res.headersSent
   *   }
   * });
   * ```
   */
  download(path: string, fn?: Errback): this;
  /**
   * 将给定 `path` 的文件作为附件传输，使用自定义文件名。
   *
   * 自动设置 `Content-Disposition` 头为 "attachment"，并使用提供的文件名。
   * 当数据传输完成或发生错误时，会调用回调函数 `fn(err)`。
   *
   * @param path - 要下载的文件路径
   * @param filename - 下载时显示给用户的文件名
   * @param fn - 可选的回调函数，在传输完成或发生错误时调用
   *
   * @remarks
   * 此方法使用 `res.sendFile()`。
   *
   * @example
   * ```ts
   * res.download('/report-12345.pdf', 'report.pdf', function(err){
   *   if (err) {
   *     // 处理错误
   *   } else {
   *     console.log('文件已下载');
   *   }
   * });
   * ```
   */
  download(path: string, filename: string, fn?: Errback): this;
  /**
   * 将给定 `path` 的文件作为附件传输，支持自定义选项。
   *
   * 自动设置 `Content-Disposition` 头为 "attachment"。
   * 可选择提供 `options` 对象，其参数与 `res.sendFile()` 相同。
   * 此函数会覆盖作为头选项传递的任何 `Content-Disposition` 头。
   *
   * @param path - 要下载的文件路径
   * @param filename - 下载时显示给用户的文件名
   * @param options - 传输选项，与 `sendFile()` 的选项相同
   * @param options.maxAge - 浏览器缓存的最大时间（毫秒）
   * @param options.root - 相对文件路径的根目录
   * @param options.headers - 与文件一起发送的额外 HTTP 头对象
   * @param fn - 可选的回调函数，在传输完成或发生错误时调用
   *
   * @remarks
   * 此方法使用 `res.sendFile()`。如果你打算响应，请务必检查 `res.headersSent`。
   *
   * @example
   * ```ts
   * res.download('/report-12345.pdf', 'report.pdf', {
   *   maxAge: '1d',
   *   root: '/files',
   *   headers: {
   *     'x-sent': 'true'
   *   }
   * }, function(err){
   *   if (err) {
   *     // 处理错误
   *   }
   * });
   * ```
   */
  download(path: string, filename: string, options: SendFileOptions, fn?: Errback): this;
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
  contentType(type: string): this;
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
  type(type: string): this;
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
  format(obj: Record<string, RequestHandler>): this;
  /**
   * 将 _Content-Disposition_ 头设置为带有可选 `filename` 的 _attachment_。
   */
  attachment(filename?: string): this;
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
  append(field: string, val: string | string[]): this;
  /**
   * 设置响应头 `field` 为 `value`。
   *
   * 当 `field` 为 `"Content-Type"` 时，如果未指定 charset，
   * 会自动使用 `mime.contentType()` 添加 charset。
   *
   * @param field 要设置的 header 字段名
   * @param value 对应的 header 值，可以是字符串或字符串数组
   * @returns 返回 `this`，以便链式调用
   */
  set(field: string, value: number | string | string[]): this;
  /**
   * 设置响应头 `"Content-Type"` 为指定的字符串。
   *
   * @remarks
   * Content-Type 不能是数组类型。
   * 如果未指定 charset，会自动使用 `mime.contentType()` 补全。
   *
   * @param field 固定为 `"Content-Type"`
   * @param value 要设置的 Content-Type 值
   * @returns 返回 `this`，以便链式调用
   */
  set(field: 'Content-Type', value: string): this;
  /**
   * 批量设置响应头。
   *
   * @example
   * ```ts
   * res.set({
   *   Accept: 'text/plain',
   *   'X-API-Key': 'tobi'
   * });
   * ```
   *
   * @param fieldObject 一个对象，键为 header 字段名，值为字符串或字符串数组
   * @returns 返回 `this`，以便链式调用
   */
  set(fieldObject: Record<string, string | string[]>): this;
  header(field: string, value: string | string[]): this;
  header(field: 'Content-Type', value: string): this;
  header(fieldObject: Record<string, string | string[]>): this;
  /**
   * 获取头字段 `field` 的值。
   * @param field 要获取的 header 字段名
   *
   * @returns 如果该字段包含多个值，则返回一个用逗号连接的字符串。
   */
  get(field: string): string | number | string[] | undefined;
  /**
   * 清除 cookie `name`。
   * @param name 要清除的 cookie 名称
   * @param options 可选的 cookie 选项
   */
  clearCookie(name: string, options?: CookieOptions): this;
  /**
   * 设置一个字符串类型的 Cookie。
   *
   * @remarks
   * 字符串值会原样存储。
   * 如果 options.signed 为 true，会对值进行签名。
   * path 默认值为 '/'。
   *
   * @example
   * ```ts
   * res.cookie('username', 'tobi');
   * res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true });
   * ```
   *
   * @param name Cookie 名称
   * @param value Cookie 值（字符串）
   * @param options 可选的 Cookie 配置
   * @returns 返回 `this`，支持链式调用
   */
  cookie(name: string, value: string, options?: CookieOptions): this;
  /**
   * 设置一个对象类型的 Cookie，会自动 JSON 序列化，并加 `'j:'` 前缀。
   *
   * @remarks
   * 如果 options.signed 为 true，会对序列化后的值进行签名。
   * maxAge 会自动转换为 expires（毫秒转秒）。
   * path 默认值为 '/'。
   *
   * @example
   * ```ts
   * res.cookie('user', { name: 'tobi', role: 'admin' });
   * res.cookie('session', { id: 123 }, { signed: true });
   * ```
   *
   * @param name Cookie 名称
   * @param value Cookie 值（对象，会自动序列化）
   * @param options 可选的 Cookie 配置
   * @returns 返回 `this`，支持链式调用
   */
  cookie(name: string, value: object, options?: CookieOptions): this;
  /**
   * 通用 Cookie 设置，支持任意类型值（会被转换为字符串）。
   *
   * @remarks
   * 用于非字符串或非对象的值，会自动执行 `String(value)`。
   * 如果 options.signed 为 true，会对字符串化后的值进行签名。
   * maxAge 会自动转换为 expires（毫秒转秒）。
   * path 默认值为 '/'。
   *
   * @example
   * ```ts
   * res.cookie('count', 12345);
   * res.cookie('flag', true, { httpOnly: true });
   * ```
   *
   * @param name Cookie 名称
   * @param value Cookie 值，可以是任意类型
   * @param options 可选的 Cookie 配置
   * @returns 返回 `this`，支持链式调用
   */
  cookie(name: string, value: unknown, options?: CookieOptions): this;
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
  location(url: string): this;
  /**
   * 重定向到指定的 URL，默认使用 HTTP 状态码 302。
   *
   * @remarks
   * 地址会经过 `res.location()` 处理，所以相对路径、挂载应用等都会正确处理。
   *
   * @example
   * ```ts
   * res.redirect('/foo/bar');
   * res.redirect('http://example.com');
   * res.redirect('../login'); // 如果当前路径是 /blog/post/1，则变为 /blog/login
   * ```
   *
   * @param url 要重定向到的目标 URL
   */
  redirect(url: string): void;
  /**
   * 使用指定的 HTTP 状态码重定向到目标 URL。
   *
   * @remarks
   * 状态码必须为数字，例如 301、302 等。
   * 地址会经过 `res.location()` 处理。
   *
   * @example
   * ```ts
   * res.redirect(301, 'http://example.com');
   * res.redirect(307, '/login');
   * ```
   *
   * @param status HTTP 状态码
   * @param url 要重定向到的目标 URL
   */
  redirect(status: number, url: string): void;
  /**
   * 将 `field` 添加到 Vary。如果已存在于 Vary 集中，则此调用会被简单地忽略。
   * @param field 要添加到 Vary 的字段名
   */
  vary(field: string): this;
  /**
   * 渲染指定的视图（view），并可选择传入渲染选项和回调函数。
   *
   * @remarks
   * - 如果提供回调函数，渲染完成后不会自动发送响应，需要在回调中自行处理。
   * - 如果未提供回调函数，默认返回 HTTP 200 状态，并将渲染结果作为 text/html 响应发送。
   * - 渲染选项会自动合并 `res.locals` 到 `_locals` 中。
   *
   * @example
   * ```ts
   * // 使用选项渲染
   * res.render('index', { title: '首页' });
   *
   * // 使用回调处理渲染结果
   * res.render('index', { title: '首页' }, (err, html) => {
   *   if (err) throw err;
   *   console.log(html);
   * });
   *
   * // 回调作为第二个参数
   * res.render('index', (err, html) => {
   *   if (err) throw err;
   *   res.send(html);
   * });
   * ```
   *
   * @param view 要渲染的视图名称
   * @param options 渲染选项，可选
   * @param callback 渲染完成后的回调函数，可选
   */
  render(view: string, options?: object, callback?: (err: Error | null, html: string) => void): void;
  /**
   * 渲染指定的视图，并提供回调函数。
   *
   * @remarks
   * 该重载支持回调作为第二个参数，无需显式传入 options。
   *
   * @example
   * ```ts
   * res.render('index', (err, html) => {
   *   if (err) throw err;
   *   res.send(html);
   * });
   * ```
   *
   * @param view 要渲染的视图名称
   * @param callback 渲染完成后的回调函数
   */
  render(view: string, callback?: (err: Error | null, html: string) => void): void;
}
declare const res: Response;
//#endregion
//#region src/application.d.ts
declare class Application<LocalsObj extends Record<string, any> = Record<string, any>> extends EventEmitter {
  get: ((name: string) => any) & IRouterMatcher<this, 'get'>;
  all: IRouterMatcher<this, 'all'>;
  acl: IRouterMatcher<this, 'acl'>;
  bind: IRouterMatcher<this, 'bind'>;
  checkout: IRouterMatcher<this, 'checkout'>;
  connect: IRouterMatcher<this, 'connect'>;
  copy: IRouterMatcher<this, 'copy'>;
  delete: IRouterMatcher<this, 'delete'>;
  head: IRouterMatcher<this, 'head'>;
  link: IRouterMatcher<this, 'link'>;
  lock: IRouterMatcher<this, 'lock'>;
  'msearch': IRouterMatcher<this, 'm-search'>;
  merge: IRouterMatcher<this, 'merge'>;
  mkactivity: IRouterMatcher<this, 'mkactivity'>;
  mkcalendar: IRouterMatcher<this, 'mkcalendar'>;
  mkcol: IRouterMatcher<this, 'mkcol'>;
  move: IRouterMatcher<this, 'move'>;
  notify: IRouterMatcher<this, 'notify'>;
  options: IRouterMatcher<this, 'options'>;
  patch: IRouterMatcher<this, 'patch'>;
  post: IRouterMatcher<this, 'post'>;
  propfind: IRouterMatcher<this, 'propfind'>;
  proppatch: IRouterMatcher<this, 'proppatch'>;
  purge: IRouterMatcher<this, 'purge'>;
  put: IRouterMatcher<this, 'put'>;
  query: IRouterMatcher<this, 'query'>;
  rebind: IRouterMatcher<this, 'rebind'>;
  report: IRouterMatcher<this, 'report'>;
  search: IRouterMatcher<this, 'search'>;
  source: IRouterMatcher<this, 'source'>;
  subscribe: IRouterMatcher<this, 'subscribe'>;
  trace: IRouterMatcher<this, 'trace'>;
  unbind: IRouterMatcher<this, 'unbind'>;
  unlink: IRouterMatcher<this, 'unlink'>;
  unlock: IRouterMatcher<this, 'unlock'>;
  unsubscribe: IRouterMatcher<this, 'unsubscribe'>;
  _router: ReturnType<typeof Router$1> | null;
  cache: Record<string, any>;
  engines: Record<string, any>;
  settings: any;
  locals: LocalsObj & Locals;
  mountpath: string | string[];
  parent?: Application;
  request: Request;
  response: Response;
  use: ApplicationRequestHandler<this>;
  /**
   * Initialize the server.
   *
   *   - setup default configuration
   *   - setup default middleware
   *   - setup route reflection methods
   *
   * @private
   */
  init(): void;
  get router(): router7.RequestHandler<router7.ParamsDictionary, any, any, qs0.ParsedQs, Record<string, any>> & router7.IRouter;
  /**
   * Initialize application configuration.
   * @private
   */
  defaultConfiguration(): void;
  /**
   * Dispatch a req, res pair into the application. Starts pipeline processing.
   *
   * If no callback is provided, then default error handlers will respond
   * in the event of an error bubbling through the stack.
   *
   * @private
   * @description 这里接收的是原生的 http.IncomingMessage 和 http.ServerResponse 对象
   */
  handle(req: http.IncomingMessage, res: http.ServerResponse, callback?: (finalErr?: any) => void): void;
  /**
   * Proxy `Router#use()` to add middleware to the app router.
   * See Router#use() documentation for details.
   *
   * If the _fn_ parameter is an express app, then it will be
   * mounted at the _route_ specified.
   *
   * @public
   */
  _use(...args: any[]): this;
  /**
   * Proxy to the app `Router#route()`
   * Returns a new `Route` instance for the _path_.
   *
   * Routes are isolated middleware stacks for specific paths.
   * See the Route api docs for details.
   *
   * @public
   */
  route(path: PathParams): router7.Route<PathParams>;
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
  engine(ext: string, fn: (path: string, options: object, callback: (e: any, rendered?: string) => void) => void): this;
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
  param(name: string | string[], fn: RequestParamHandler): this;
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
  set(setting: string, val?: any): any;
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
  path(): string;
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
  enabled(setting: string): boolean;
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
  disabled(setting: string): boolean;
  /**
   * Enable `setting`.
   *
   * @param setting
   * @return for chaining
   * @public
   */
  enable(setting: string): this;
  /**
   * Disable `setting`.
   *
   * @param setting
   * @return for chaining
   * @public
   */
  disable(setting: string): this;
  /**
   * 渲染指定模板并返回渲染后的 HTML 字符串（带模板数据）
   *
   * 该方法用于渲染应用的视图模板，并通过回调函数获取渲染结果。
   * 与 `res.render` 不同的是，`app.render` 并不会直接发送响应，
   * 而是将渲染后的 HTML 通过回调提供给调用者。
   *
   * @example
   * ```ts
   * app.render('email', { name: 'Tobi' }, (err, html) => {
   *   if (err) throw err;
   *   console.log(html);
   * });
   * ```
   *
   * @param name - 要渲染的模板名称
   * @param options - 模板上下文数据对象
   * @param callback - 渲染完成回调，接收错误对象和渲染后的 HTML
   * @returns 无返回值
   */
  render(name: string, options: Record<string, any>, callback: (err: Error | null, html: string) => void): void;
  /**
   * 渲染指定模板并返回渲染后的 HTML 字符串（不带模板数据）
   *
   * 该方法用于渲染应用的视图模板，并通过回调函数获取渲染结果。
   * 如果不需要传入模板数据，可使用此重载。
   *
   * @example
   * ```ts
   * app.render('email', (err, html) => {
   *   if (err) throw err;
   *   console.log(html);
   * });
   * ```
   *
   * @param name - 要渲染的模板名称
   * @param callback - 渲染完成回调，接收错误对象和渲染后的 HTML
   * @returns 无返回值
   */
  render(name: string, callback: (err: Error | null, html: string) => void): void;
  /**
   * 在指定端口、主机名和队列长度上启动 HTTP 服务
   *
   * @param port - 监听的端口号
   * @param hostname - 主机名或 IP 地址
   * @param backlog - 等待队列长度
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen(port: number, hostname: string, backlog: number, callback?: (error?: Error) => void): http.Server;
  /**
   * 在指定端口和主机名上启动 HTTP 服务
   *
   * @param port - 监听的端口号
   * @param hostname - 主机名或 IP 地址
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen(port: number, hostname: string, callback?: (error?: Error) => void): http.Server;
  /**
   * 在指定端口上启动 HTTP 服务
   *
   * @param port - 监听的端口号
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen(port: number, callback?: (error?: Error) => void): http.Server;
  /**
   * 启动 HTTP 服务，系统自动选择端口
   *
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen(callback?: (error?: Error) => void): http.Server;
  /**
   * 通过 UNIX 域套接字路径或命名管道启动 HTTP 服务
   *
   * @param path - UNIX 域套接字路径或命名管道
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen(path: string, callback?: (error?: Error) => void): http.Server;
  /**
   * 通过已存在的 handle（文件描述符、Socket 或其他对象）启动 HTTP 服务
   *
   * @param handle - 文件描述符、Socket 或其他支持的句柄
   * @param listeningListener - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen(handle: any, listeningListener?: (error?: Error) => void): http.Server;
}
declare const application: Application<Record<string, any>>;
//#endregion
//#region src/request.d.ts
declare class Request<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs, LocalsObj extends Record<string, any> = Record<string, any>> extends IncomingMessage {
  app: Application;
  res: Response<ResBody, LocalsObj>;
  params: P;
  body: ReqBody;
  cookies: any;
  route: Route$1;
  secret?: CipherKey;
  signedCookies: any;
  baseUrl: string;
  originalUrl: string;
  next?: NextFunction;
  accepted: MediaType[];
  method: string;
  url: string;
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
  constructor(socket: any);
  get(name: 'set-cookie'): string[] | undefined;
  get(name: string): string | undefined;
  header(name: 'set-cookie'): string[] | undefined;
  header(name: string): string | undefined;
  private _header;
  /**
   * 检查给定的 `type(s)` 是否可接受，如果可接受则返回
   * 最佳匹配，否则返回 `undefined`，在这种情况下
   * 你应该返回 406 "Not Acceptable".
   *
   * `type` 值可以是单个 MIME 类型字符串
   * 如 "application/json"，扩展名
   * 如 "json"，逗号分隔的列表如 "json, html, text/plain"，
   * 参数列表如 `"json", "html", "text/plain"`，
   * 或数组 `["json", "html", "text/plain"]`。当给定列表
   * 或数组时，如果有的话，返回_最佳_匹配。
   *
   * 示例：
   *
   *     // Accept: text/html
   *     req.accepts('html');
   *     // => "html"
   *
   *     // Accept: text/*, application/json
   *     req.accepts('html');
   *     // => "html"
   *     req.accepts('text/html');
   *     // => "text/html"
   *     req.accepts('json, text');
   *     // => "json"
   *     req.accepts('application/json');
   *     // => "application/json"
   *
   *     // Accept: text/*, application/json
   *     req.accepts('image/png');
   *     req.accepts('png');
   *     // => undefined
   *
   *     // Accept: text/*;q=.5, application/json
   *     req.accepts(['html', 'json']);
   *     req.accepts('html', 'json');
   *     req.accepts('html, json');
   *     // => "json"
   */
  accepts(): string[];
  accepts(type: string): string | false;
  accepts(type: string[]): string | false;
  accepts(...type: string[]): string | false;
  /**
   * 检查给定的 `encoding` 是否被接受。
   */
  acceptsEncodings(): string[];
  acceptsEncodings(encoding: string): string | false;
  acceptsEncodings(encoding: string[]): string | false;
  acceptsEncodings(...encoding: string[]): string | false;
  /**
   * 检查给定的 `charset` 是否可接受，
   * 否则你应该返回 406 "Not Acceptable".
   */
  acceptsCharsets(): string[];
  acceptsCharsets(charset: string): string | false;
  acceptsCharsets(charset: string[]): string | false;
  acceptsCharsets(...charset: string[]): string | false;
  /**
   * 检查给定的 `lang` 是否可接受，
   * 否则你应该返回 406 "Not Acceptable".
   */
  acceptsLanguages(): string[];
  acceptsLanguages(lang: string): string | false;
  acceptsLanguages(lang: string[]): string | false;
  acceptsLanguages(...lang: string[]): string | false;
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
  range(size: number, options?: {
    combine?: boolean;
  }): parseRange.Result | parseRange.Ranges | undefined;
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
  is(...types: string[]): string | false | null;
  /**
   * 解析 `req.url` 的查询字符串。
   *
   * 这使用 "query parser" 设置将原始
   * 字符串解析为对象。
   */
  get query(): ReqQuery;
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
  get protocol(): string;
  /**
   * 简写形式：
   *
   *    req.protocol === 'https'
   */
  get secure(): boolean;
  /**
   * 从受信任的代理返回远程地址。
   *
   * 这是套接字上的远程地址，除非
   * 设置了 "trust proxy".
   */
  get ip(): string;
  /**
   * 当设置 "trust proxy" 时，受信任的代理地址 + 客户端。
   *
   * 例如，如果值为 "client, proxy1, proxy2"
   * 你将收到数组 `["client", "proxy1", "proxy2"]`
   * 其中 "proxy2" 是最远的下游，"proxy1" 和
   * "proxy2" 是受信任的。
   */
  get ips(): string[];
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
  get subdomains(): string[];
  /**
   * `url.parse(req.url).pathname` 的简写形式。
   */
  get path(): string;
  /**
   * 解析 "Host" 头字段为主机。
   *
   * 当 "trust proxy" 设置信任套接字
   * 地址时，"X-Forwarded-Host" 头字段将
   * 被信任。
   */
  get host(): string | undefined;
  /**
   * 解析 "Host" 头字段为主机名。
   *
   * 当 "trust proxy" 设置信任套接字
   * 地址时，"X-Forwarded-Host" 头字段将
   * 被信任。
   */
  get hostname(): string | undefined;
  /**
   * 检查请求是否新鲜，即
   * Last-Modified 或 ETag
   * 仍然匹配。
   */
  get fresh(): boolean;
  /**
   * 检查请求是否陈旧，即
   * 资源的 "Last-Modified" 和/或 "ETag"
   * 已更改。
   */
  get stale(): boolean;
  /**
   * 检查请求是否为 _XMLHttpRequest_。
   */
  get xhr(): boolean;
}
declare const req: Request;
//#endregion
//#region src/express.d.ts
/**
 * Create an express application.
 *
 * @api public
 */
declare function createApplication(): any;
declare const express: typeof createApplication & {
  application: Application<any>;
  request: Request<router7.ParamsDictionary, any, any, qs0.ParsedQs, Record<string, any>>;
  response: Response<any, Record<string, any>, number>;
  Route: typeof Route;
  Router: {
    (options?: router7.RouterOptions): router7.RequestHandler & router7.IRouter;
    new (options?: router7.RouterOptions): router7.RequestHandler & router7.IRouter;
    prototype: router7.IRouter;
    Route: typeof Route;
  };
  json: (options?: bodyParser.OptionsJson) => connect0.NextHandleFunction;
  raw: (options?: bodyParser.Options) => connect0.NextHandleFunction;
  static: typeof serveStatic;
  text: (options?: bodyParser.OptionsText) => connect0.NextHandleFunction;
  urlencoded: (options?: bodyParser.OptionsUrlencoded) => connect0.NextHandleFunction;
};
//#endregion
export { type Application, type Request, type Response, Route, Router, application, express as default, express, req as request, res as response };