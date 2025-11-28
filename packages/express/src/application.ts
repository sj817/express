/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

import http from 'node:http'
import { View } from './view'
import { resolve } from 'node:path'
import { Router, methods } from 'router'
import finalhandler from 'finalhandler'
import { EventEmitter } from 'node:events'
import debugModule from 'debug'
import { compileETag, compileQueryParser, compileTrust, once } from './utils'

import type { IRouterMatcher, Locals, PathParams, RequestParamHandler } from 'router'
import type { ApplicationRequestHandler } from './application.types'
import type { Request } from './request'
import type { Response } from './response'

const debug = debugModule('express:application')

/**
 * Variable for trust proxy inheritance back-compat
 * @private
 */
const trustProxyDefaultSymbol = '@@symbol:trust_proxy_default'

export class Application<
  LocalsObj extends Record<string, any> = Record<string, any>
> extends EventEmitter {
  get!: ((name: string) => any) & IRouterMatcher<this, 'get'>

  declare all: IRouterMatcher<this, 'all'>
  declare acl: IRouterMatcher<this, 'acl'>
  declare bind: IRouterMatcher<this, 'bind'>
  declare checkout: IRouterMatcher<this, 'checkout'>
  declare connect: IRouterMatcher<this, 'connect'>
  declare copy: IRouterMatcher<this, 'copy'>
  declare delete: IRouterMatcher<this, 'delete'>
  declare head: IRouterMatcher<this, 'head'>
  declare link: IRouterMatcher<this, 'link'>
  declare lock: IRouterMatcher<this, 'lock'>
  declare 'msearch': IRouterMatcher<this, 'm-search'>
  declare merge: IRouterMatcher<this, 'merge'>
  declare mkactivity: IRouterMatcher<this, 'mkactivity'>
  declare mkcalendar: IRouterMatcher<this, 'mkcalendar'>
  declare mkcol: IRouterMatcher<this, 'mkcol'>
  declare move: IRouterMatcher<this, 'move'>
  declare notify: IRouterMatcher<this, 'notify'>
  declare options: IRouterMatcher<this, 'options'>
  declare patch: IRouterMatcher<this, 'patch'>
  declare post: IRouterMatcher<this, 'post'>
  declare propfind: IRouterMatcher<this, 'propfind'>
  declare proppatch: IRouterMatcher<this, 'proppatch'>
  declare purge: IRouterMatcher<this, 'purge'>
  declare put: IRouterMatcher<this, 'put'>
  declare query: IRouterMatcher<this, 'query'>
  declare rebind: IRouterMatcher<this, 'rebind'>
  declare report: IRouterMatcher<this, 'report'>
  declare search: IRouterMatcher<this, 'search'>
  declare source: IRouterMatcher<this, 'source'>
  declare subscribe: IRouterMatcher<this, 'subscribe'>
  declare trace: IRouterMatcher<this, 'trace'>
  declare unbind: IRouterMatcher<this, 'unbind'>
  declare unlink: IRouterMatcher<this, 'unlink'>
  declare unlock: IRouterMatcher<this, 'unlock'>
  declare unsubscribe: IRouterMatcher<this, 'unsubscribe'>

  _router: ReturnType<typeof Router> | null = null
  cache!: Record<string, any>
  engines!: Record<string, any>
  settings!: any
  locals!: LocalsObj & Locals
  mountpath!: string | string[]
  parent?: Application
  request!: Request
  response!: Response

  use!: ApplicationRequestHandler<this>

  /**
   * Initialize the server.
   *
   *   - setup default configuration
   *   - setup default middleware
   *   - setup route reflection methods
   *
   * @private
   */
  init () {
    this.cache = Object.create(null)
    this.engines = Object.create(null)
    this.settings = Object.create(null)

    this.defaultConfiguration()
  }

  get router () {
    if (!this._router) {
      this._router = new Router({
        caseSensitive: this.enabled('case sensitive routing'),
        strict: this.enabled('strict routing'),
      })
    }

    return this._router
  }

  /**
   * Initialize application configuration.
   * @private
   */
  defaultConfiguration () {
    const env = process.env.NODE_ENV || 'development'

    // default settings
    this.enable('x-powered-by')
    this.set('etag', 'weak')
    this.set('env', env)
    this.set('query parser', 'simple')
    this.set('subdomain offset', 2)
    this.set('trust proxy', false)

    // trust proxy inherit back-compat
    Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
      configurable: true,
      value: true,
    })

    debug('booting in %s mode', env)

    this.on('mount', (parent: Application) => {
      // inherit trust proxy
      if (this.settings[trustProxyDefaultSymbol] === true &&
        typeof parent.settings['trust proxy fn'] === 'function') {
        delete this.settings['trust proxy']
        delete this.settings['trust proxy fn']
      }

      // inherit protos
      Object.setPrototypeOf(this.request, parent.request)
      Object.setPrototypeOf(this.response, parent.response)
      Object.setPrototypeOf(this.engines, parent.engines)
      Object.setPrototypeOf(this.settings, parent.settings)
    })

    // setup locals
    this.locals = Object.create(null)

    // top-most app is mounted at /
    this.mountpath = '/'

    // default locals
    // @ts-ignore
    this.locals.settings = this.settings

    // default configuration
    this.set('view', View)
    this.set('views', resolve('views'))
    this.set('jsonp callback name', 'callback')

    if (env === 'production') {
      this.enable('view cache')
    }
  };

  /**
   * Dispatch a req, res pair into the application. Starts pipeline processing.
   *
   * If no callback is provided, then default error handlers will respond
   * in the event of an error bubbling through the stack.
   *
   * @private
   * @description 这里接收的是原生的 http.IncomingMessage 和 http.ServerResponse 对象
   */
  handle (req: http.IncomingMessage, res: http.ServerResponse, callback?: (finalErr?: any) => void) {
    // final handler
    const done = callback || finalhandler(req, res, {
      env: this.get('env'),
      onerror: logerror.bind(this),
    })

    // set powered by header
    if (this.enabled('x-powered-by')) {
      res.setHeader('X-Powered-By', 'Express')
    }

    // alter the prototypes
    Object.setPrototypeOf(req, this.request)
    Object.setPrototypeOf(res, this.response)

    // 类型断言：在设置原型链之后，req 和 res 已经具有 Request 和 Response 的属性和方法
    const request = req as Request
    const response = res as Response

    // set circular references
    request.res = response
    response.req = request

    // setup locals
    if (!response.locals) {
      response.locals = Object.create(null)
    }

    this.router.handle(request, response, done)
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
  _use (...args: any[]) {
    let offset = 0
    let path = '/'

    // default path to '/'
    // disambiguate app.use([fn])
    const fn = args[0]

    if (typeof fn !== 'function') {
      let arg = fn

      while (Array.isArray(arg) && arg.length !== 0) {
        arg = arg[0]
      }

      // first arg is the path
      if (typeof arg !== 'function') {
        offset = 1
        path = fn
      }
    }

    const fns = args.slice(offset).flat(Infinity)

    if (fns.length === 0) {
      throw new TypeError('app.use() requires a middleware function')
    }

    // get router
    const router = this.router
    const self = this

    fns.forEach((fn: any) => {
      // non-express app
      if (!fn || !fn.handle || !fn.set) {
        return router.use(path, fn)
      }

      debug('.use app under %s', path)
      fn.mountpath = path
      fn.parent = self

      // restore .app property on req and res
      router.use(path, (req: any, res: any, next: any) => {
        const orig = req.app
        fn.handle(req, res, (err: any) => {
          Object.setPrototypeOf(req, orig.request)
          Object.setPrototypeOf(res, orig.response)
          next(err)
        })
      })

      // mounted an app
      fn.emit('mount', self)
    })

    return this
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
  route (path: PathParams) {
    return this.router.route(path)
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
  engine (ext: string, fn: (path: string, options: object, callback: (e: any, rendered?: string) => void) => void) {
    if (typeof fn !== 'function') {
      throw new Error('callback function required')
    }

    // get file extension
    const extension = ext[0] !== '.' ? '.' + ext : ext

    // store engine
    this.engines[extension] = fn

    return this
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
  param (name: string | string[], fn: RequestParamHandler) {
    if (Array.isArray(name)) {
      for (let i = 0; i < name.length; i++) {
        this.param(name[i], fn)
      }

      return this
    }

    this.router.param(name, fn)
    return this
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
  // TODO: 类型定义改进
  // get (setting: string): any
  // get (...args: any[]): any {
  //   if (args.length === 1 && typeof args[0] === 'string') {
  //     return this.set(args[0])
  //   }
  //   // This will be overridden by methods.forEach below
  //   throw new Error('Route GET method will be added by methods.forEach')
  // }

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
  set (setting: string, val?: any): any {
    // TODO: 这里可以实现重载 然后返回不同的类型
    if (arguments.length === 1) {
      // app.get(setting)
      return this.settings[setting]
    }

    debug('set "%s" to %o', setting, val)

    // set value
    this.settings[setting] = val

    // trigger matched settings
    switch (setting) {
      case 'etag':
        this.set('etag fn', compileETag(val))
        break
      case 'query parser':
        this.set('query parser fn', compileQueryParser(val))
        break
      case 'trust proxy':
        this.set('trust proxy fn', compileTrust(val))

        // trust proxy inherit back-compat
        Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
          configurable: true,
          value: false,
        })

        break
    }

    return this
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

  path (): string {
    return this.parent ? this.parent.path() + this.mountpath : ''
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
  enabled (setting: string): boolean {
    return Boolean(this.set(setting))
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
  disabled (setting: string): boolean {
    return !this.set(setting)
  }

  /**
   * Enable `setting`.
   *
   * @param setting
   * @return for chaining
   * @public
   */
  enable (setting: string): this {
    return this.set(setting, true)
  }

  /**
   * Disable `setting`.
   *
   * @param setting
   * @return for chaining
   * @public
   */
  disable (setting: string): this {
    return this.set(setting, false)
  }

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
  render (name: string, options: Record<string, any>, callback: (err: Error | null, html: string) => void): void

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
  render (name: string, callback: (err: Error | null, html: string) => void): void
  render (name: string, options?: any, callback?: any) {
    const cache = this.cache
    let done = callback
    const engines = this.engines
    let opts = options
    let view

    // support callback function as second arg
    if (typeof options === 'function') {
      done = options
      opts = {}
    }

    // merge options
    const renderOptions = { ...this.locals, ...opts._locals, ...opts }

    // set .cache unless explicitly provided
    if (renderOptions.cache == null) {
      renderOptions.cache = this.enabled('view cache')
    }

    // primed cache
    if (renderOptions.cache) {
      view = cache[name]
    }

    // view
    if (!view) {
      const View = this.get('view')

      view = new View(name, {
        defaultEngine: this.get('view engine'),
        root: this.get('views'),
        engines,
      })

      if (!view.path) {
        const dirs = Array.isArray(view.root) && view.root.length > 1
          ? 'directories "' + view.root.slice(0, -1).join('", "') + '" or "' + view.root[view.root.length - 1] + '"'
          : 'directory "' + view.root + '"'
        const err = new Error('Failed to lookup view "' + name + '" in views ' + dirs)
        // @ts-ignore
        err.view = view
        return done(err)
      }

      // prime the cache
      if (renderOptions.cache) {
        cache[name] = view
      }
    }

    // render
    tryRender(view, renderOptions, done)
  }

  /**
   * 在指定端口、主机名和队列长度上启动 HTTP 服务
   *
   * @param port - 监听的端口号
   * @param hostname - 主机名或 IP 地址
   * @param backlog - 等待队列长度
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen (port: number, hostname: string, backlog: number, callback?: (error?: Error) => void): http.Server

  /**
   * 在指定端口和主机名上启动 HTTP 服务
   *
   * @param port - 监听的端口号
   * @param hostname - 主机名或 IP 地址
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen (port: number, hostname: string, callback?: (error?: Error) => void): http.Server

  /**
   * 在指定端口上启动 HTTP 服务
   *
   * @param port - 监听的端口号
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen (port: number, callback?: (error?: Error) => void): http.Server

  /**
   * 启动 HTTP 服务，系统自动选择端口
   *
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen (callback?: (error?: Error) => void): http.Server

  /**
   * 通过 UNIX 域套接字路径或命名管道启动 HTTP 服务
   *
   * @param path - UNIX 域套接字路径或命名管道
   * @param callback - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen (path: string, callback?: (error?: Error) => void): http.Server

  /**
   * 通过已存在的 handle（文件描述符、Socket 或其他对象）启动 HTTP 服务
   *
   * @param handle - 文件描述符、Socket 或其他支持的句柄
   * @param listeningListener - 可选，监听完成回调，可能带错误对象
   * @returns 返回 Node.js http.Server 实例
   */
  listen (handle: any, listeningListener?: (error?: Error) => void): http.Server
  listen (...args: any[]): http.Server {
    const server = http.createServer(this as any)
    if (typeof args[args.length - 1] === 'function') {
      const done = args[args.length - 1] = once(args[args.length - 1])
      server.once('error', done)
    }
    return (server.listen as any).apply(server, args)
  }
}

/**
 * Log error using console.error.
 *
 * @param {Error} err
 * @private
 */

function logerror (this: Application, err: any) {
  /* istanbul ignore next */
  if (this.settings['env'] !== 'test') console.error(err.stack || err.toString())
}

/**
 * Try rendering a view.
 * @private
 */

function tryRender (view: any, options: any, callback: any) {
  try {
    view.render(options, callback)
  } catch (err) {
    callback(err)
  }
}

methods.forEach((method) => {
  // @ts-ignore
  Application.prototype[method] = function (this: Application, path: string, ...args: any[]) {
    if (method === 'get' && args.length === 0) {
      // app.get(setting)
      return this.set(path)
    }

    const route = this.route(path)
    route[method].apply(route, args)
    return this
  }
})

Application.prototype.use = Application.prototype._use

export const application = new Application()
