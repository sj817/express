// import type { ParsedQs } from 'qs'
// import type { Route } from '../route'
// import type { Response } from '@karinjs/express'
// import type { IncomingMessage } from 'node:http'
// import type { Options as RangeParserOptions, Ranges as RangeParserRanges, Result as RangeParserResult } from 'range-parser'

/**
 * 路由参数字典接口
 * 用于存储从 URL 路径中解析出的命名参数
 * @example
 * // 路由: /user/:id
 * // URL: /user/123
 * // params: { id: '123' }
 */
export interface ParamsDictionary {
  [key: string]: string
}

/**
 * 媒体类型接口
 * 表示 HTTP Accept 头中的媒体类型信息
 */
export interface MediaType {
  /** 完整的媒体类型值，例如 "application/json" */
  value: string
  /** 质量因子，范围从 0 到 1，表示客户端对该媒体类型的偏好程度 */
  quality: number
  /** 主类型，例如 "application"、"text" */
  type: string
  /** 子类型，例如 "json"、"html" */
  subtype: string
}

/**
 * 下一步处理函数接口
 * 用于在中间件中将控制权传递给下一个中间件或路由处理器
 */
export interface NextFunction {
  /**
   * 调用下一个中间件
   * @param err - 可选的错误对象。如果传入错误，将跳过所有常规中间件，直接调用错误处理中间件
   */
  (err?: any): void
  /**
   * 跳出当前路由器，将控制权传递给下一个路由器
   * @param deferToNext - 传入 "router" 字符串以跳出路由器
   * @see https://expressjs.com/en/guide/using-middleware.html#middleware.router
   */
  (deferToNext: 'router'): void
  /**
   * 跳出当前路由，将控制权传递给同一路径的下一个路由
   * @param deferToNext - 传入 "route" 字符串以跳出当前路由
   * @see https://expressjs.com/en/guide/using-middleware.html#middleware.application
   */
  (deferToNext: 'route'): void
}

/**
 * @param P  For most requests, this should be `ParamsDictionary`, but if you're
 * using this in a route handler for a route that uses a `RegExp` or a wildcard
 * `string` path (e.g. `'/user/*'`), then `req.params` will be an array, in
 * which case you should use `ParamsArray` instead.
 *
 * @see https://expressjs.com/en/api.html#req.params
 *
 * @example
 *     app.get('/user/:id', (req, res) => res.send(req.params.id)); // implicitly `ParamsDictionary`
 *     app.get<ParamsArray>(/user\/(.*)/, (req, res) => res.send(req.params[0]));
 *     app.get<ParamsArray>('/user/*', (req, res) => res.send(req.params[0]));
 */
// export interface Request<
//   P = ParamsDictionary,
//   ResBody = any,
//   ReqBody = any,
//   ReqQuery = ParsedQs,
//   LocalsObj extends Record<string, any> = Record<string, any>
// > extends IncomingMessage {
//   /**
//    * Return request header.
//    *
//    * The `Referrer` header field is special-cased,
//    * both `Referrer` and `Referer` are interchangeable.
//    *
//    * Examples:
//    *
//    *     req.get('Content-Type');
//    *     // => "text/plain"
//    *
//    *     req.get('content-type');
//    *     // => "text/plain"
//    *
//    *     req.get('Something');
//    *     // => undefined
//    *
//    * Aliased as `req.header()`.
//    */
//   get (name: 'set-cookie'): string[] | undefined
//   get (name: string): string | undefined

//   header (name: 'set-cookie'): string[] | undefined
//   header (name: string): string | undefined

//   /**
//    * Check if the given `type(s)` is acceptable, returning
//    * the best match when true, otherwise `undefined`, in which
//    * case you should respond with 406 "Not Acceptable".
//    *
//    * The `type` value may be a single mime type string
//    * such as "application/json", the extension name
//    * such as "json", a comma-delimted list such as "json, html, text/plain",
//    * or an array `["json", "html", "text/plain"]`. When a list
//    * or array is given the _best_ match, if any is returned.
//    *
//    * Examples:
//    *
//    *     // Accept: text/html
//    *     req.accepts('html');
//    *     // => "html"
//    *
//    *     // Accept: text/*, application/json
//    *     req.accepts('html');
//    *     // => "html"
//    *     req.accepts('text/html');
//    *     // => "text/html"
//    *     req.accepts('json, text');
//    *     // => "json"
//    *     req.accepts('application/json');
//    *     // => "application/json"
//    *
//    *     // Accept: text/*, application/json
//    *     req.accepts('image/png');
//    *     req.accepts('png');
//    *     // => false
//    *
//    *     // Accept: text/*;q=.5, application/json
//    *     req.accepts(['html', 'json']);
//    *     req.accepts('html, json');
//    *     // => "json"
//    */
//   accepts (): string[]
//   accepts (type: string): string | false
//   accepts (type: string[]): string | false
//   accepts (...type: string[]): string | false

//   /**
//    * Returns the first accepted charset of the specified character sets,
//    * based on the request's Accept-Charset HTTP header field.
//    * If none of the specified charsets is accepted, returns false.
//    *
//    * For more information, or if you have issues or concerns, see accepts.
//    */
//   acceptsCharsets (): string[]
//   acceptsCharsets (charset: string): string | false
//   acceptsCharsets (charset: string[]): string | false
//   acceptsCharsets (...charset: string[]): string | false

//   /**
//    * Returns the first accepted encoding of the specified encodings,
//    * based on the request's Accept-Encoding HTTP header field.
//    * If none of the specified encodings is accepted, returns false.
//    *
//    * For more information, or if you have issues or concerns, see accepts.
//    */
//   acceptsEncodings (): string[]
//   acceptsEncodings (encoding: string): string | false
//   acceptsEncodings (encoding: string[]): string | false
//   acceptsEncodings (...encoding: string[]): string | false

//   /**
//    * Returns the first accepted language of the specified languages,
//    * based on the request's Accept-Language HTTP header field.
//    * If none of the specified languages is accepted, returns false.
//    *
//    * For more information, or if you have issues or concerns, see accepts.
//    */
//   acceptsLanguages (): string[]
//   acceptsLanguages (lang: string): string | false
//   acceptsLanguages (lang: string[]): string | false
//   acceptsLanguages (...lang: string[]): string | false

//   /**
//    * Parse Range header field, capping to the given `size`.
//    *
//    * Unspecified ranges such as "0-" require knowledge of your resource length. In
//    * the case of a byte range this is of course the total number of bytes.
//    * If the Range header field is not given `undefined` is returned.
//    * If the Range header field is given, return value is a result of range-parser.
//    * See more ./types/range-parser/index.d.ts
//    *
//    * NOTE: remember that ranges are inclusive, so for example "Range: users=0-3"
//    * should respond with 4 users when available, not 3.
//    */
//   range (size: number, options?: RangeParserOptions): RangeParserRanges | RangeParserResult | undefined

//   /**
//    * Return an array of Accepted media types
//    * ordered from highest quality to lowest.
//    */
//   accepted: MediaType[]

//   /**
//    * Check if the incoming request contains the "Content-Type"
//    * header field, and it contains the give mime `type`.
//    *
//    * Examples:
//    *
//    *      // With Content-Type: text/html; charset=utf-8
//    *      req.is('html');
//    *      req.is('text/html');
//    *      req.is('text/*');
//    *      // => true
//    *
//    *      // When Content-Type is application/json
//    *      req.is('json');
//    *      req.is('application/json');
//    *      req.is('application/*');
//    *      // => true
//    *
//    *      req.is('html');
//    *      // => false
//    */
//   is (type: string | string[]): string | false | null

//   /**
//    * Return the protocol string "http" or "https"
//    * when requested with TLS. When the "trust proxy"
//    * setting is enabled the "X-Forwarded-Proto" header
//    * field will be trusted. If you're running behind
//    * a reverse proxy that supplies https for you this
//    * may be enabled.
//    */
//   readonly protocol: string

//   /**
//    * Short-hand for:
//    *
//    *    req.protocol == 'https'
//    */
//   readonly secure: boolean

//   /**
//    * Return the remote address, or when
//    * "trust proxy" is `true` return
//    * the upstream addr.
//    *
//    * Value may be undefined if the `req.socket` is destroyed
//    * (for example, if the client disconnected).
//    */
//   readonly ip: string | undefined

//   /**
//    * When "trust proxy" is `true`, parse
//    * the "X-Forwarded-For" ip address list.
//    *
//    * For example if the value were "client, proxy1, proxy2"
//    * you would receive the array `["client", "proxy1", "proxy2"]`
//    * where "proxy2" is the furthest down-stream.
//    */
//   readonly ips: string[]

//   /**
//    * Return subdomains as an array.
//    *
//    * Subdomains are the dot-separated parts of the host before the main domain of
//    * the app. By default, the domain of the app is assumed to be the last two
//    * parts of the host. This can be changed by setting "subdomain offset".
//    *
//    * For example, if the domain is "tobi.ferrets.example.com":
//    * If "subdomain offset" is not set, req.subdomains is `["ferrets", "tobi"]`.
//    * If "subdomain offset" is 3, req.subdomains is `["tobi"]`.
//    */
//   readonly subdomains: string[]

//   /**
//    * Short-hand for `url.parse(req.url).pathname`.
//    */
//   readonly path: string

//   /**
//    * Contains the hostname derived from the `Host` HTTP header.
//    */
//   readonly hostname: string

//   /**
//    * Contains the host derived from the `Host` HTTP header.
//    */
//   readonly host: string

//   /**
//    * Check if the request is fresh, aka
//    * Last-Modified and/or the ETag
//    * still match.
//    */
//   readonly fresh: boolean

//   /**
//    * Check if the request is stale, aka
//    * "Last-Modified" and / or the "ETag" for the
//    * resource has changed.
//    */
//   readonly stale: boolean

//   /**
//    * Check if the request was an _XMLHttpRequest_.
//    */
//   readonly xhr: boolean

//   // body: { username: string; password: string; remember: boolean; title: string; };
//   body: ReqBody

//   // cookies: { string; remember: boolean; };
//   cookies: any

//   method: string

//   params: P

//   query: ReqQuery

//   route: Route

//   signedCookies: any

//   originalUrl: string

//   url: string

//   baseUrl: string

//   app: Application

//   /**
//    * After middleware.init executed, Request will contain res and next properties
//    * See: express/lib/middleware/init.js
//    */
//   res?: Response<ResBody, LocalsObj> | undefined
//   next?: NextFunction | undefined
// }
