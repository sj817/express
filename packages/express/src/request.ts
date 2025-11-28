/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * 模块依赖
 * @private
 */
import fresh from 'fresh'
import typeis from 'type-is'
import parse from 'parseurl'
import accepts from 'accepts'
import { isIP } from 'node:net'
import parseRange from 'range-parser'
import { IncomingMessage } from 'node:http'
import proxyaddr, { all } from 'proxy-addr'

import type { ParsedQs } from 'qs'
import type { MediaType, NextFunction, ParamsDictionary, Route } from 'router'
import type { Application } from './application'
import type { CipherKey } from 'node:crypto'
import type { Response } from './response'

type Header = string | string[] | undefined
type _Header<T extends 'set-cookie' | string> = T extends 'set-cookie' ? string[] | undefined : string | undefined

export class Request<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  LocalsObj extends Record<string, any> = Record<string, any>
> extends IncomingMessage {
  app!: Application
  res!: Response<ResBody, LocalsObj>
  params: P
  body!: ReqBody
  // TODO: 类型完善
  cookies: any
  route!: Route
  secret?: CipherKey
  signedCookies: any
  baseUrl: string = ''
  originalUrl: string = ''
  next?: NextFunction
  accepted: MediaType[]
  declare method: string
  declare url: string

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

  constructor (socket: any) {
    super(socket)
    this.socket = socket
    this.params = {} as P
    this.accepted = []
  }

  get (name: 'set-cookie'): string[] | undefined
  get (name: string): string | undefined
  get (name: string): Header {
    return this._header(name)
  }

  header (name: 'set-cookie'): string[] | undefined
  header (name: string): string | undefined
  header (name: string): Header {
    return this._header(name)
  }

  private _header<T extends 'set-cookie' | string> (name: T): _Header<T> {
    if (!name) {
      throw new TypeError('name argument is required to req.get')
    }

    if (typeof name !== 'string') {
      throw new TypeError('name must be a string to req.get')
    }

    const lc = name.toLowerCase()

    switch (lc) {
      case 'referer':
      case 'referrer':
        return (this.headers.referrer || this.headers.referer) as _Header<T>
      default:
        return this.headers[lc] as _Header<T>
    }
  }

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
  accepts (): string[]
  accepts (type: string): string | false
  accepts (type: string[]): string | false
  accepts (...type: string[]): string | false
  accepts (...types: any[]): string | string[] | false {
    const accept = accepts(this)
    return accept.types(...types)
  }

  /**
   * 检查给定的 `encoding` 是否被接受。
   */
  acceptsEncodings (): string[]
  acceptsEncodings (encoding: string): string | false
  acceptsEncodings (encoding: string[]): string | false
  acceptsEncodings (...encoding: string[]): string | false
  acceptsEncodings (...encodings: any[]): string | string[] | false {
    const accept = accepts(this)
    return accept.encodings(...encodings)
  }

  /**
   * 检查给定的 `charset` 是否可接受，
   * 否则你应该返回 406 "Not Acceptable".
   */
  acceptsCharsets (): string[]
  acceptsCharsets (charset: string): string | false
  acceptsCharsets (charset: string[]): string | false
  acceptsCharsets (...charset: string[]): string | false
  acceptsCharsets (...charsets: any[]): string | string[] | false {
    const accept = accepts(this)
    return accept.charsets(...charsets)
  }

  /**
   * 检查给定的 `lang` 是否可接受，
   * 否则你应该返回 406 "Not Acceptable".
   */
  acceptsLanguages (): string[]
  acceptsLanguages (lang: string): string | false
  acceptsLanguages (lang: string[]): string | false
  acceptsLanguages (...lang: string[]): string | false
  acceptsLanguages (...languages: any[]): string | string[] | false {
    return accepts(this).languages(...languages)
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
  range (size: number, options?: { combine?: boolean }) {
    const range = this.get('Range')
    if (!range) return
    return parseRange(size, range, options)
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
  is (...types: string[]): string | false | null {
    let arr = types

    // 支持扁平化参数
    if (!Array.isArray(types)) {
      arr = new Array(arguments.length)
      for (let i = 0; i < arr.length; i++) {
        arr[i] = arguments[i]
      }
    }

    return typeis(this, arr)
  }

  /**
   * 解析 `req.url` 的查询字符串。
   *
   * 这使用 "query parser" 设置将原始
   * 字符串解析为对象。
   */
  get query (): ReqQuery {
    const queryparse = this.app.get('query parser fn')

    if (!queryparse) {
      // 解析已禁用
      return Object.create(null)
    }

    const querystring = parse(this)?.query

    return queryparse(querystring)
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
  get protocol (): string {
    const proto = (this.socket as any).encrypted ? 'https' : 'http'
    const trust = this.app.get('trust proxy fn')

    if (!trust(this.socket.remoteAddress, 0)) {
      return proto
    }

    // 注意：X-Forwarded-Proto 通常只是一个
    //       单一值，但这是为了安全起见。
    const header = this.get('X-Forwarded-Proto') || proto
    const index = header.indexOf(',')

    return index !== -1 ? header.substring(0, index).trim() : header.trim()
  }

  /**
   * 简写形式：
   *
   *    req.protocol === 'https'
   */
  get secure (): boolean {
    return this.protocol === 'https'
  }

  /**
   * 从受信任的代理返回远程地址。
   *
   * 这是套接字上的远程地址，除非
   * 设置了 "trust proxy".
   */
  get ip (): string {
    const trust = this.app.get('trust proxy fn')
    return proxyaddr(this, trust)
  }

  /**
   * 当设置 "trust proxy" 时，受信任的代理地址 + 客户端。
   *
   * 例如，如果值为 "client, proxy1, proxy2"
   * 你将收到数组 `["client", "proxy1", "proxy2"]`
   * 其中 "proxy2" 是最远的下游，"proxy1" 和
   * "proxy2" 是受信任的。
   */
  get ips (): string[] {
    const trust = this.app.get('trust proxy fn')
    const addrs = all(this, trust)

    // 反转顺序（从最远 -> 最近）
    // 并移除套接字地址
    addrs.reverse().pop()

    return addrs
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
  get subdomains (): string[] {
    const hostname = this.hostname

    if (!hostname) return []

    const offset = this.app.get('subdomain offset')
    const subdomains = !isIP(hostname) ? hostname.split('.').reverse() : [hostname]

    return subdomains.slice(offset)
  }

  /**
   * `url.parse(req.url).pathname` 的简写形式。
   */
  get path (): string {
    return parse(this)?.pathname || ''
  }

  /**
   * 解析 "Host" 头字段为主机。
   *
   * 当 "trust proxy" 设置信任套接字
   * 地址时，"X-Forwarded-Host" 头字段将
   * 被信任。
   */
  get host (): string {
    const trust = this.app.get('trust proxy fn')
    let val = this.get('X-Forwarded-Host')

    if (!val || !trust(this.socket.remoteAddress, 0)) {
      val = this.get('Host')
    } else if (val.indexOf(',') !== -1) {
      // 注意：X-Forwarded-Host 通常只是一个
      //       单一值，但这是为了安全起见。
      val = val.substring(0, val.indexOf(',')).trimEnd()
    }

    return val || ''
  }

  /**
   * 解析 "Host" 头字段为主机名。
   *
   * 当 "trust proxy" 设置信任套接字
   * 地址时，"X-Forwarded-Host" 头字段将
   * 被信任。
   */
  get hostname (): string {
    const host = this.host

    if (!host) return ''

    // IPv6 字面量支持
    const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0
    const index = host.indexOf(':', offset)

    return index !== -1 ? host.substring(0, index) : host
  }

  /**
   * 检查请求是否新鲜，即
   * Last-Modified 或 ETag
   * 仍然匹配。
   */
  get fresh (): boolean {
    const method = this.method
    const res = this.res
    const status = res.statusCode

    // 仅对 GET 或 HEAD 进行弱新鲜度验证
    if (method !== 'GET' && method !== 'HEAD') return false

    // 根据 rfc2616 14.26，2xx 或 304
    if ((status >= 200 && status < 300) || status === 304) {
      return fresh(this.headers, {
        etag: res.get('ETag'),
        'last-modified': res.get('Last-Modified'),
      })
    }

    return false
  }

  /**
   * 检查请求是否陈旧，即
   * 资源的 "Last-Modified" 和/或 "ETag"
   * 已更改。
   */
  get stale (): boolean {
    return !this.fresh
  }

  /**
   * 检查请求是否为 _XMLHttpRequest_。
   */
  get xhr (): boolean {
    const val = this.get('X-Requested-With') || ''
    return val.toLowerCase() === 'xmlhttprequest'
  }
}

export const req: Request = Object.create(Request.prototype)
