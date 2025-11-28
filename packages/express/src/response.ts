/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

import contentDisposition from 'content-disposition'
import createError from 'http-errors'
import encodeUrl from 'encodeurl'
import escapeHtml from 'escape-html'
import onFinished from 'on-finished'
import mime from 'mime-types'
import statuses from 'statuses'
import cookie from 'cookie'
import vary from 'vary'
import send from 'send'
import http from 'node:http'
import { sign } from 'cookie-signature'
import { setCharset, normalizeType, normalizeTypes } from './utils'
import { extname, resolve, isAbsolute as pathIsAbsolute } from 'node:path'
import depd from 'depd'

import type { SendOptions } from 'send'
import type { Request } from './request'
import type { CookieOptions, Locals, RequestHandler } from 'router'
import type { Application } from './application'

const deprecate = depd('express')

export type Errback = (err: Error) => void
export interface SendFileOptions extends SendOptions {
  /** Object containing HTTP headers to serve with the file. */
  headers?: Record<string, unknown>
}

export class Response<
  ResBody = any,
  LocalsObj extends Record<string, any> = Record<string, any>,
  StatusCode extends number = number
> extends http.ServerResponse {
  app!: Application
  declare req: Request
  // 在application中会有赋值
  locals!: LocalsObj & Locals
  charset: string = 'utf-8'

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
  status (code: StatusCode): this {
    // Check if the status code is not an integer
    if (!Number.isInteger(code)) {
      throw new TypeError(`Invalid status code: ${JSON.stringify(code)}. Status code must be an integer.`)
    }
    // Check if the status code is outside of Node's valid range
    if (code < 100 || code > 999) {
      throw new RangeError(`Invalid status code: ${JSON.stringify(code)}. Status code must be greater than 99 and less than 1000.`)
    }

    this.statusCode = code
    return this
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
  links<T extends Record<string, string | string[]>> (links: T): this {
    let link = this.get('Link') || ''
    if (link) link += ', '

    const str = Object.keys(links).map((rel) => {
      // Allow multiple links if links[rel] is an array
      if (Array.isArray(links[rel])) {
        return links[rel].map(function (singleLink) {
          return `<${singleLink}>; rel="${rel}"`
        }).join(', ')
      } else {
        return `<${links[rel]}>; rel="${rel}"`
      }
    }).join(', ')

    return this.set('Link', link + str)
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
  send (body: ResBody): this {
    {
      let chunk: any = body
      let encoding: BufferEncoding | undefined
      const req = this.req
      let type

      // settings
      const app = this.app

      switch (typeof chunk) {
        // string defaulting to html
        case 'string':
          if (!this.get('Content-Type')) {
            this.type('html')
          }
          break
        case 'boolean':
        case 'number':
        case 'object':
          if (chunk === null) {
            chunk = ''
          } else if (ArrayBuffer.isView(chunk)) {
            if (!this.get('Content-Type')) {
              this.type('bin')
            }
          } else {
            return this.json(chunk)
          }
          break
      }

      // write strings in utf-8
      if (typeof chunk === 'string') {
        encoding = 'utf8'
        type = this.get('Content-Type')

        // reflect this in content-type
        if (typeof type === 'string') {
          this.set('Content-Type', setCharset(type, 'utf-8'))
        }
      }

      // determine if ETag should be generated
      const etagFn = app.get('etag fn')
      const generateETag = !this.get('ETag') && typeof etagFn === 'function'

      // populate Content-Length
      let len
      if (chunk !== undefined) {
        if (Buffer.isBuffer(chunk)) {
          // get length of Buffer
          len = chunk.length
        } else if (!generateETag && chunk.length < 1000) {
          // just calculate length when no ETag + small chunk
          len = Buffer.byteLength(chunk, encoding)
        } else {
          // convert chunk to Buffer and calculate
          chunk = Buffer.from(chunk, encoding)
          encoding = undefined
          len = chunk.length
        }

        this.set('Content-Length', len)
      }

      // populate ETag
      let etag
      if (generateETag && len !== undefined) {
        if ((etag = etagFn(chunk, encoding))) {
          this.set('ETag', etag)
        }
      }

      // freshness
      if (req.fresh) this.statusCode = 304

      // strip irrelevant headers
      if (this.statusCode === 204 || this.statusCode === 304) {
        this.removeHeader('Content-Type')
        this.removeHeader('Content-Length')
        this.removeHeader('Transfer-Encoding')
        chunk = ''
      }

      // alter headers for 205
      if (this.statusCode === 205) {
        this.set('Content-Length', '0')
        this.removeHeader('Transfer-Encoding')
        chunk = ''
      }

      if (req.method === 'HEAD') {
        // skip body for HEAD
        this.end()
      } else {
        // respond
        if (encoding) {
          this.end(chunk, encoding)
        } else {
          this.end(chunk)
        }
      }

      return this
    };
  }

  json (obj: any): this {
    // settings
    const app = this.app
    const escape = app.get('json escape')
    const replacer = app.get('json replacer')
    const spaces = app.get('json spaces')
    const body = stringify(obj, replacer, spaces, escape)

    // content-type
    if (!this.get('Content-Type')) {
      this.set('Content-Type', 'application/json')
    }

    return this.send(body as any)
  }

  jsonp (obj: any): this {
    // settings
    const app = this.app
    const escape = app.get('json escape')
    const replacer = app.get('json replacer')
    const spaces = app.get('json spaces')
    let body = stringify(obj, replacer, spaces, escape)
    let callback = this.req.query[app.get('jsonp callback name')]

    // content-type
    if (!this.get('Content-Type')) {
      this.set('X-Content-Type-Options', 'nosniff')
      this.set('Content-Type', 'application/json')
    }

    // fixup callback
    if (Array.isArray(callback)) {
      callback = callback[0]
    }

    // jsonp
    if (typeof callback === 'string' && callback.length !== 0) {
      this.set('X-Content-Type-Options', 'nosniff')
      this.set('Content-Type', 'text/javascript')

      // restrict callback charset
      // eslint-disable-next-line no-useless-escape
      callback = callback.replace(/[^\[\]\w$.]/g, '')

      if (body === undefined) {
        // empty argument
        body = ''
      } else if (typeof body === 'string') {
        // replace chars not allowed in JavaScript that are in JSON
        body = body
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029')
      }

      // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
      // the typeof check is just to reduce client error noise
      body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');'
    }

    return this.send(body as any)
  }

  sendStatus (statusCode: StatusCode): this {
    const body = statuses.message[statusCode] || String(statusCode)

    this.status(statusCode)
    this.type('txt')

    return this.send(body as ResBody)
  }

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
  sendFile (path: string, fn?: Errback): void
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
  sendFile (path: string, options: SendFileOptions, fn?: Errback): void
  sendFile (path: string, options?: SendFileOptions | Errback, callback?: Errback): void {
    let done = callback
    const req = this.req
    const res = this
    const next = req.next!
    let opts: SendFileOptions = {}

    if (!path) {
      throw new TypeError('path argument is required to res.sendFile')
    }

    if (typeof path !== 'string') {
      throw new TypeError('path must be a string to res.sendFile')
    }

    // support function as second arg
    if (typeof options === 'function') {
      done = options
    } else if (options) {
      opts = options
    }

    if (!opts.root && !pathIsAbsolute(path)) {
      throw new TypeError('path must be absolute or specify root to res.sendFile')
    }

    // create file stream
    const pathname = encodeUrl(path)

    // wire application etag option to send
    opts.etag = this.app.enabled('etag')
    const file = send(req, pathname, opts)

    // transfer
    sendfile(res, file, opts, function (err) {
      if (done) return done(err)
      if (err && err.code === 'EISDIR') return next()

      // next() all but write errors
      if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write') {
        next(err)
      }
    })
  }

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
  download (path: string, fn?: Errback): this
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
  download (path: string, filename: string, fn?: Errback): this
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
  download (path: string, filename: string, options: SendFileOptions, fn?: Errback): this
  download (path: string, filename?: string | Errback, options?: SendFileOptions | Errback, callback?: Errback): this {
    let done = callback
    let name: string | null = typeof filename === 'string' ? filename : null
    let opts: SendFileOptions | null = null

    // support function as second or third arg
    if (typeof filename === 'function') {
      done = filename
      name = null
      opts = null
    } else if (typeof options === 'function') {
      done = options
      opts = null
    } else if (options && typeof options === 'object') {
      opts = options
    }

    // support optional filename, where options may be in it's place
    if (typeof filename === 'object' &&
      (typeof options === 'function' || options === undefined)) {
      name = null
      opts = filename as SendFileOptions
    }

    // set Content-Disposition when file is sent
    const headers: any = {
      'Content-Disposition': contentDisposition(name || path),
    }

    // merge user-provided headers
    if (opts && opts.headers) {
      const keys = Object.keys(opts.headers)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (key.toLowerCase() !== 'content-disposition') {
          headers[key] = opts.headers[key]
        }
      }
    }

    // merge user-provided options
    const finalOpts: SendFileOptions = Object.create(opts || {})
    finalOpts.headers = headers

    // Resolve the full path for sendFile
    const fullPath = !finalOpts.root
      ? resolve(path)
      : path

    // send file
    this.sendFile(fullPath, finalOpts, done)
    return this
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
  contentType (type: string): this {
    const ct = type.indexOf('/') === -1
      ? (mime.contentType(type) || 'application/octet-stream')
      : type

    return this.set('Content-Type', ct)
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
  type (type: string): this {
    return this.contentType(type)
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
  format (obj: Record<string, RequestHandler>): this {
    const req = this.req
    const next = req.next!

    const keys = Object.keys(obj).filter((v) => v !== 'default')
    const key = keys.length > 0 ? req.accepts(keys) : false

    this.vary('Accept')

    if (key) {
      this.set('Content-Type', normalizeType(key).value)
      obj[key](req, this, next)
    } else if (obj.default) {
      obj.default(req, this, next)
    } else {
      next(createError(406, {
        types: normalizeTypes(keys).map((o: any) => o.value),
      }))
    }

    return this
  }

  /**
   * 将 _Content-Disposition_ 头设置为带有可选 `filename` 的 _attachment_。
   */
  attachment (filename?: string): this {
    if (filename) {
      this.type(extname(filename))
    }

    this.set('Content-Disposition', contentDisposition(filename))

    return this
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
  append (field: string, val: string | string[]): this {
    const prev = this.get(field)
    let value: string | string[] = val

    if (prev) {
      // concat the new and prev vals
      value = Array.isArray(prev)
        ? prev.concat(val as any)
        : Array.isArray(val)
          ? [prev as string].concat(val)
          : [prev as string, val as string]
    }

    return this.set(field, value)
  }

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
  set (field: string, value: number | string | string[]): this

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
  set (field: 'Content-Type', value: string): this

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
  set (fieldObject: Record<string, string | string[]>): this
  set (field: string | Record<string, any>, val?: number | string | string[]): this {
    if (arguments.length === 2) {
      let value: string | string[] = Array.isArray(val)
        ? val.map(String)
        : String(val!)

      // add charset to content-type
      if (typeof field === 'string' && field.toLowerCase() === 'content-type') {
        if (Array.isArray(value)) {
          throw new TypeError('Content-Type cannot be set to an Array')
        }
        value = mime.contentType(value) || value
      }

      this.setHeader(field as string, value)
    } else {
      for (const key in field as Record<string, any>) {
        this.set(key, (field as any)[key])
      }
    }
    return this
  }

  header (field: string, value: string | string[]): this
  header (field: 'Content-Type', value: string): this
  header (fieldObject: Record<string, string | string[]>): this
  header (...args: any[]): this {
    // @ts-ignore 不想再写一遍了~ 放过我吧
    return this.set(...args)
  }

  /**
   * 获取头字段 `field` 的值。
   * @param field 要获取的 header 字段名
   *
   * @returns 如果该字段包含多个值，则返回一个用逗号连接的字符串。
   */
  get (field: string): string | number | string[] | undefined {
    return this.getHeader(field) as string | number | string[] | undefined
  }

  /**
   * 清除 cookie `name`。
   * @param name 要清除的 cookie 名称
   * @param options 可选的 cookie 选项
   */
  clearCookie (name: string, options?: CookieOptions): this {
    // Force cookie expiration by setting expires to the past
    const opts = { path: '/', ...options, expires: new Date(1) }
    // ensure maxAge is not passed
    delete opts.maxAge

    return this.cookie(name, '', opts)
  }

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
  cookie (name: string, value: string, options?: CookieOptions): this

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
  cookie (name: string, value: object, options?: CookieOptions): this

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
  cookie (name: string, value: unknown, options?: CookieOptions): this
  cookie (name: string, value: string | object | unknown, options?: CookieOptions): this {
    const opts = { ...options }
    const secret = this.req.secret
    const signed = opts.signed

    if (signed && !secret) {
      throw new Error('cookieParser("secret") required for signed cookies')
    }

    let val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value)
    if (signed) {
      val = 's:' + sign(val, secret!)
    }

    // Handle maxAge option
    if ('maxAge' in opts) {
      if (opts.maxAge === null || opts.maxAge === undefined) {
        delete opts.maxAge
      } else {
        const maxAge = opts.maxAge - 0

        if (isNaN(maxAge)) {
          throw new TypeError('option maxAge is invalid')
        }

        opts.expires = new Date(Date.now() + maxAge)
        opts.maxAge = Math.floor(maxAge / 1000)
      }
    }

    if (opts.path == null) {
      opts.path = '/'
    }

    this.append('Set-Cookie', cookie.serialize(name, String(val), opts))
    return this
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
  location (url: string): this {
    let loc = url

    // "back" is an alias for the referrer
    if (url === 'back') {
      loc = this.req.get('Referrer') || '/'
    }

    // set location
    return this.set('Location', encodeUrl(loc))
  }

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
  redirect (url: string): void

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
  redirect (status: number, url: string): void
  redirect (urlOrStatus: string | number, maybeUrl?: string): void {
    let status = 302
    let address: string

    // 支持 redirect(status, url) 形式
    if (typeof urlOrStatus === 'number' && maybeUrl !== undefined) {
      status = urlOrStatus
      address = maybeUrl
    } else {
      address = urlOrStatus as string
    }

    if (!address) {
      deprecate('Provide a url argument')
    }

    if (typeof address !== 'string') {
      deprecate('Url must be a string')
    }

    if (typeof status !== 'number') {
      deprecate('Status must be a number')
    }

    // 通过 res.location 处理 URL
    address = this.location(address).get('Location') as string

    let body = ''

    // 默认支持 text/html 响应
    this.format({
      text: () => {
        body = `${statuses.message[status]}. Redirecting to ${address}`
      },
      html: () => {
        const u = escapeHtml(address)
        body = `<p>${statuses.message[status]}. Redirecting to ${u}</p>`
      },
      default: () => {
        body = ''
      },
    })

    this.status(status as StatusCode)
    this.set('Content-Length', Buffer.byteLength(body))

    if (this.req.method === 'HEAD') {
      this.end()
    } else {
      this.end(body)
    }
  }

  /**
   * 将 `field` 添加到 Vary。如果已存在于 Vary 集中，则此调用会被简单地忽略。
   * @param field 要添加到 Vary 的字段名
   */
  vary (field: string): this {
    vary(this, field)

    return this
  }

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
  render (view: string, options?: object, callback?: (err: Error | null, html: string) => void): void

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
  render (view: string, callback?: (err: Error | null, html: string) => void): void
  render (view: string, options?: object | ((err: Error | null, html: string) => void), callback?: (err: Error | null, html: string) => void): void {
    const app = this.req.app
    let done: ((err: Error | null, html: string) => void) | undefined = callback
    let opts: Record<string, any> = {}

    // 支持 callback 作为第二个参数
    if (typeof options === 'function') {
      done = options as (err: Error | null, html: string) => void
      opts = {}
    } else if (options) {
      opts = options as Record<string, any>
    }

    // 合并 res.locals
    opts._locals = this.locals

    // 默认回调：自动发送响应
    done = done || ((err, str) => {
      if (err) return this.req.next!(err)
      this.send(str as ResBody)
    })

    // 调用 app.render 渲染视图
    app.render(view, opts, done)
  }
}

/**
 * 传输文件的辅助函数
 * @param res 响应对象
 * @param file 发送流
 * @param options 发送选项
 * @param callback 完成回调
 */
const sendfile = (
  res: Response,
  file: send.SendStream,
  options: SendFileOptions,
  callback: (err?: any) => void
) => {
  let done = false
  let streaming: boolean | undefined

  // request aborted
  function onaborted () {
    if (done) return
    done = true

    const err: any = new Error('Request aborted')
    err.code = 'ECONNABORTED'
    callback(err)
  }

  // directory
  function ondirectory () {
    if (done) return
    done = true

    const err: any = new Error('EISDIR, read')
    err.code = 'EISDIR'
    callback(err)
  }

  // errors
  function onerror (err: any) {
    if (done) return
    done = true
    callback(err)
  }

  // ended
  function onend () {
    if (done) return
    done = true
    callback()
  }

  // file
  function onfile () {
    streaming = false
  }

  // finished
  function onfinish (err?: any) {
    if (err && err.code === 'ECONNRESET') return onaborted()
    if (err) return onerror(err)
    if (done) return

    setImmediate(function () {
      if (streaming !== false && !done) {
        onaborted()
        return
      }

      if (done) return
      done = true
      callback()
    })
  }

  // streaming
  function onstream () {
    streaming = true
  }

  file.on('directory', ondirectory)
  file.on('end', onend)
  file.on('error', onerror)
  file.on('file', onfile)
  file.on('stream', onstream)
  onFinished(res, onfinish)

  if (options.headers) {
    // set headers on successful transfer
    file.on('headers', function headers (res: any) {
      const obj = options.headers!
      const keys = Object.keys(obj)

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        res.setHeader(k, obj[k])
      }
    })
  }

  // pipe
  file.pipe(res)
}

/**
 * 字符串化 JSON，类似于 JSON.stringify，但经过 v8 优化，
 * 能够转义可能触发 HTML 嗅探的字符。
 *
 * @private
 */
function stringify (value: any, replacer?: any, spaces?: number, escape?: boolean): string {
  // v8 checks arguments.length for optimizing simple call
  // https://bugs.chromium.org/p/v8/issues/detail?id=4730
  let json = replacer || spaces
    ? JSON.stringify(value, replacer, spaces)
    : JSON.stringify(value)

  if (escape && typeof json === 'string') {
    json = json.replace(/[<>&]/g, function (c) {
      switch (c.charCodeAt(0)) {
        case 0x3c:
          return '\\u003c'
        case 0x3e:
          return '\\u003e'
        case 0x26:
          return '\\u0026'
        /* istanbul ignore next: unreachable default */
        default:
          return c
      }
    })
  }

  return json
}

export const res: Response = Object.create(Response.prototype)
