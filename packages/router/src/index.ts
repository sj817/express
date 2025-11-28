/**
 * Module dependencies.
 * @private
 */

import util from 'node:util'
import { Layer } from './layer'
import { Route } from './route'
import debugModule from 'debug'
import parseUrl from 'parseurl'
import { methods } from './types/iRouter'
import type { Request, Response } from '@karinjs/express'
import type { IRouterHandler, IRouterMatcher } from './types/iRouter'
import type { PathParams, NextFunction, RequestHandler, ErrorRequestHandler, RequestParamHandler } from './types'
/*!
 * router
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

const debug = debugModule('router')

/**
 * Module variables.
 * @private
 */

/**
 * Router 配置选项接口
 */
export interface RouterOptions {
  /** 是否区分大小写，默认为 false */
  caseSensitive?: boolean
  /** 是否合并参数，默认为 false */
  mergeParams?: boolean
  /** 是否启用严格模式，默认为 false */
  strict?: boolean
}

/**
 * 参数处理器映射类型
 */
type ParamsMap = Record<string, Array<RequestParamHandler>>

/**
 * Router 类
 * 处理 HTTP 请求的路由器
 */
class Router {
  all!: IRouterMatcher<this, 'all'>
  acl!: IRouterMatcher<this, 'acl'>
  bind!: IRouterMatcher<this, 'bind'>
  checkout!: IRouterMatcher<this, 'checkout'>
  connect!: IRouterMatcher<this, 'connect'>
  copy!: IRouterMatcher<this, 'copy'>
  delete!: IRouterMatcher<this, 'delete'>
  get!: IRouterMatcher<this, 'get'>
  head!: IRouterMatcher<this, 'head'>
  link!: IRouterMatcher<this, 'link'>
  lock!: IRouterMatcher<this, 'lock'>
  'm-search'!: IRouterMatcher<this, 'm-search'>
  merge!: IRouterMatcher<this, 'merge'>
  mkactivity!: IRouterMatcher<this, 'mkactivity'>
  mkcalendar!: IRouterMatcher<this, 'mkcalendar'>
  mkcol!: IRouterMatcher<this, 'mkcol'>
  move!: IRouterMatcher<this, 'move'>
  notify!: IRouterMatcher<this, 'notify'>
  options!: IRouterMatcher<this, 'options'>
  patch!: IRouterMatcher<this, 'patch'>
  post!: IRouterMatcher<this, 'post'>
  propfind!: IRouterMatcher<this, 'propfind'>
  proppatch!: IRouterMatcher<this, 'proppatch'>
  purge!: IRouterMatcher<this, 'purge'>
  put!: IRouterMatcher<this, 'put'>
  query!: IRouterMatcher<this, 'query'>
  rebind!: IRouterMatcher<this, 'rebind'>
  report!: IRouterMatcher<this, 'report'>
  search!: IRouterMatcher<this, 'search'>
  source!: IRouterMatcher<this, 'source'>
  subscribe!: IRouterMatcher<this, 'subscribe'>
  trace!: IRouterMatcher<this, 'trace'>
  unbind!: IRouterMatcher<this, 'unbind'>
  unlink!: IRouterMatcher<this, 'unlink'>
  unlock!: IRouterMatcher<this, 'unlock'>
  unsubscribe!: IRouterMatcher<this, 'unsubscribe'>

  /**
   * 使用给定的中间件函数，可选路径，默认为 "/"
   *
   * Use（类似 `.all`）将对任何 HTTP 方法运行，但不会为这些方法添加处理器，
   * 因此 OPTIONS 请求不会考虑 `.use` 函数，即使它们可以响应。
   *
   * 另一个区别是 _route_ 路径被剥离且对处理器函数不可见。
   * 这个特性的主要效果是挂载的处理器可以在没有任何代码更改的情况下操作，
   * 无论 "prefix" 路径名是什么。
   *
   * @param handler - 中间件函数或路径
   * @param handlers - 额外的中间件函数
   * @returns 返回 this 以支持链式调用
   * @public
   */
  use!: IRouterHandler<this> & IRouterMatcher<this>

  /** 是否区分大小写 */
  caseSensitive?: boolean
  /** 是否合并参数 */
  mergeParams?: boolean
  /** 参数处理器映射 */
  params: ParamsMap
  /**
   * 是否启用严格模式
   * @default false
   */
  strict: boolean
  /** 中间件层栈 */
  stack: Layer[]

  /**
   * 初始化 Router 实例
   * @param options - 路由器配置选项
   */
  constructor (options?: RouterOptions) {
    const opts = options || {}

    this.caseSensitive = opts.caseSensitive
    this.mergeParams = opts.mergeParams
    this.params = {}
    this.strict = opts.strict ?? false
    this.stack = []

    function router (req: Request, res: Response, next: NextFunction): void {
      // @ts-ignore
      router.handle(req, res, next)
    }

    Object.setPrototypeOf(router, this);

    // 为所有 HTTP 方法创建路由处理器
    [...methods, 'all'].forEach((method) => {
      // @ts-ignore
      router[method] = (path: PathParams, ...handlers: any[]) => {
        // @ts-ignore
        const route = router.route(path)
        // @ts-ignore
        route[method](...handlers)
        return router
      }
    })

    // @ts-ignore
    router.use = this._use.bind(router)

    return Object.assign(
      router,
      { prototype: Router.prototype }
    ) as unknown as RequestHandler & Router
  }

  /**
   * 将参数占位符 `name` 映射到给定的回调函数
   *
   * 参数映射用于为使用规范化占位符的路由提供前置条件。
   * 例如，_:user_id_ 参数可以自动从数据库加载用户信息，而无需任何额外代码。
   *
   * 回调函数使用与中间件相同的签名，唯一的区别是传递了占位符的值，
   * 在这种情况下是用户的 _id_。一旦调用了 `next()` 函数，就像中间件一样，
   * 它将继续执行路由或后续的参数函数。
   *
   * 就像在中间件中一样，您必须响应请求或调用 next 以避免请求停滞。
   *
   * @example
   * ```ts
   * router.param('user_id', function(req, res, next, id){
   *   User.find(id, function(err, user){
   *     if (err) {
   *       return next(err)
   *     } else if (!user) {
   *       return next(new Error('failed to load user'))
   *     }
   *     req.user = user
   *     next()
   *   })
   * })
   * ```
   *
   * @param name - 参数名称
   * @param fn - 回调函数
   * @returns 返回 this 以支持链式调用
   * @public
   */
  param (name: string, fn: RequestParamHandler): this {
    if (!name) {
      throw new TypeError('argument name is required')
    }

    if (typeof name !== 'string') {
      throw new TypeError('argument name must be a string')
    }

    if (!fn) {
      throw new TypeError('argument fn is required')
    }

    if (typeof fn !== 'function') {
      throw new TypeError('argument fn must be a function')
    }

    let params = this.params[name]

    if (!params) {
      params = this.params[name] = []
    }

    params.push(fn)

    return this
  }

  /**
   * 将请求和响应分发到路由器
   *
   * @param req - 请求对象
   * @param res - 响应对象
   * @param callback - 回调函数
   * @private
   */
  handle (req: Request, res: Response, callback: NextFunction): void {
    if (!callback) {
      throw new TypeError('argument callback is required')
    }

    debug('dispatching %s %s', req.method, req.url)

    let idx = 0
    let methods: string[] | undefined
    const protohost = getProtohost(req.url) || ''
    let removed = ''
    const self = this
    let slashAdded = false
    let sync = 0
    const paramcalled: Record<string, any> = {}

    // middleware and routes
    const stack = this.stack

    // manage inter-router variables
    const parentParams = req.params
    const parentUrl = req.baseUrl || ''
    let done = restore(callback, req, 'baseUrl', 'next', 'params')

    // setup next layer
    req.next = next

    // for options requests, respond with a default if nothing else responds
    if (req.method === 'OPTIONS') {
      methods = []
      done = wrap(done, generateOptionsResponder(res, methods))
    }

    // setup basic req values
    req.baseUrl = parentUrl
    req.originalUrl = req.originalUrl || req.url

    next()

    function next (err?: any): void {
      let layerError = err === 'route'
        ? null
        : err

      // remove added slash
      if (slashAdded) {
        req.url = req.url.slice(1)
        slashAdded = false
      }

      // restore altered req.url
      if (removed.length !== 0) {
        req.baseUrl = parentUrl
        req.url = protohost + removed + req.url.slice(protohost.length)
        removed = ''
      }

      // signal to exit router
      if (layerError === 'router') {
        setImmediate(done as any, null)
        return
      }

      // no more matching layers
      if (idx >= stack.length) {
        setImmediate(done, layerError)
        return
      }

      // max sync stack
      if (++sync > 100) {
        setImmediate(next, err)
        return
      }

      // get pathname of request
      const path = getPathname(req)

      if (path == null) {
        return done(layerError)
      }

      // find next matching layer
      let layer: Layer | undefined
      let match: boolean | Error | undefined
      let route: Route | undefined

      while (match !== true && idx < stack.length) {
        layer = stack[idx++]
        match = matchLayer(layer, path)
        route = layer.route

        if (typeof match !== 'boolean') {
          // hold on to layerError
          layerError = layerError || match
        }

        if (match !== true) {
          continue
        }

        if (!route) {
          // process non-route handlers normally
          continue
        }

        if (layerError) {
          // routes do not match with a pending error
          match = false
          continue
        }

        const method = req.method
        const hasMethod = route._handlesMethod(method)

        // build up automatic options response
        if (!hasMethod && method === 'OPTIONS' && methods) {
          methods.push.apply(methods, route._methods())
        }

        // don't even bother matching route
        if (!hasMethod && method !== 'HEAD') {
          match = false
        }
      }

      // no match
      if (match !== true) {
        return done(layerError)
      }

      // store route for dispatch on change
      if (route) {
        req.route = route
      }

      // Capture one-time layer values
      req.params = self.mergeParams
        ? mergeParams(layer!.params, parentParams) || {}
        : layer!.params || {}
      const layerPath = layer!.path

      // this should be done for the layer
      processParams(self.params, layer!, paramcalled, req, res, function (err?: any) {
        if (err) {
          next(layerError || err)
        } else if (route) {
          layer!.handleRequest(req, res, next)
        } else {
          trimPrefix(layer!, layerError, layerPath, path)
        }

        sync = 0
      })
    }

    function trimPrefix (layer: Layer, layerError: any, layerPath: string | undefined, path: string): void {
      if (layerPath && layerPath.length !== 0) {
        // Validate path is a prefix match
        if (layerPath !== path.substring(0, layerPath.length)) {
          next(layerError)
          return
        }

        // Validate path breaks on a path separator
        const c = path[layerPath.length]
        if (c && c !== '/') {
          next(layerError)
          return
        }

        // Trim off the part of the url that matches the route
        // middleware (.use stuff) needs to have the path stripped
        debug('trim prefix (%s) from url %s', layerPath, req.url)
        removed = layerPath
        req.url = protohost + req.url.slice(protohost.length + removed.length)

        // Ensure leading slash
        if (!protohost && req.url[0] !== '/') {
          req.url = '/' + req.url
          slashAdded = true
        }

        // Setup base URL (no trailing slash)
        req.baseUrl = parentUrl + (removed[removed.length - 1] === '/'
          ? removed.substring(0, removed.length - 1)
          : removed)
      }

      debug('%s %s : %s', layer.name, layerPath, req.originalUrl)

      if (layerError) {
        layer.handleError(layerError, req, res, next)
      } else {
        layer.handleRequest(req, res, next)
      }
    }
  }

  /**
   * @description 类型过于复杂，已经在构造器实现绑定
   */
  private _use (handler: any, ...handlers: any[]): this {
    let offset = 0
    let path: PathParams = '/'

    // default path to '/'
    // disambiguate router.use([handler])
    if (typeof handler !== 'function') {
      let arg = handler

      while (Array.isArray(arg) && arg.length !== 0) {
        arg = arg[0]
      }

      // first arg is the path
      if (typeof arg !== 'function') {
        offset = 1
        path = handler
      }
    }

    const allHandlers = [handler, ...handlers]
    const callbacks = allHandlers.slice(offset).flat(Infinity) as Array<RequestHandler | ErrorRequestHandler>

    if (callbacks.length === 0) {
      throw new TypeError('argument handler is required')
    }

    for (let i = 0; i < callbacks.length; i++) {
      const fn = callbacks[i]

      if (typeof fn !== 'function') {
        throw new TypeError('argument handler must be a function')
      }

      // add the middleware
      debug('use %o %s', path, fn.name || '<anonymous>')

      const layer = new Layer(path, {
        sensitive: this.caseSensitive,
        strict: false,
        end: false,
      }, fn)

      layer.route = undefined

      this.stack.push(layer)
    }

    return this
  }

  route<T extends PathParams> (prefix: T): Route<T>
  route (prefix: PathParams): Route

  /**
   * 为给定路径创建新的 Route
   *
   * 每个路由包含一个单独的中间件栈和 VERB 处理器。
   *
   * 有关向路由添加处理器和中间件的详细信息，请参阅 Route API 文档。
   *
   * @param path - 路由路径
   * @returns Route 实例
   * @public
   */
  route (path: PathParams): Route {
    const route = new Route(path)

    const layer = new Layer(path, {
      sensitive: this.caseSensitive,
      strict: this.strict,
      end: true,
    }, handle)

    function handle (req: Request, res: Response, next: NextFunction): void {
      route.dispatch(req, res, next)
    }

    layer.route = route

    this.stack.push(layer)
    return route
  }
}

/**
 * 生成将创建 OPTIONS 响应的回调
 *
 * @param res - 响应对象
 * @param methods - HTTP 方法数组
 * @returns 回调函数
 * @private
 */
function generateOptionsResponder (res: Response, methods: string[]): (fn: NextFunction, err?: any) => void {
  return function onDone (fn: NextFunction, err?: any): void {
    if (err || methods.length === 0) {
      return fn(err)
    }

    trySendOptionsResponse(res, methods, fn)
  }
}

/**
 * 获取请求的路径名
 *
 * @param req - 请求对象
 * @returns 路径名或 undefined
 * @private
 */
function getPathname (req: Request): string | undefined | null {
  try {
    return parseUrl(req)?.pathname
  } catch (err) {
    return undefined
  }
}

/**
 * 获取 URL 的协议 + 主机
 *
 * @param url - URL 字符串
 * @returns 协议 + 主机或 undefined
 * @private
 */
function getProtohost (url: string): string | undefined {
  if (typeof url !== 'string' || url.length === 0 || url[0] === '/') {
    return undefined
  }

  const searchIndex = url.indexOf('?')
  const pathLength = searchIndex !== -1
    ? searchIndex
    : url.length
  const fqdnIndex = url.substring(0, pathLength).indexOf('://')

  return fqdnIndex !== -1
    ? url.substring(0, url.indexOf('/', 3 + fqdnIndex))
    : undefined
}

/**
 * 匹配路径到层
 *
 * @param layer - Layer 实例
 * @param path - 路径字符串
 * @returns 是否匹配或错误
 * @private
 */
function matchLayer (layer: Layer, path: string): boolean | Error {
  try {
    return layer.match(path)
  } catch (err) {
    return err as Error
  }
}

/**
 * 合并参数与父参数
 *
 * @param params - 参数对象
 * @param parent - 父参数对象
 * @returns 合并后的参数对象
 * @private
 */
function mergeParams (params: Record<string, any> | undefined, parent: Record<string, any> | undefined): Record<string, any> {
  if (typeof parent !== 'object' || !parent) {
    return params || {}
  }

  // make copy of parent for base
  const obj = Object.assign({}, parent)

  if (!params) {
    return obj
  }

  // simple non-numeric merging
  if (!(0 in params) || !(0 in parent)) {
    return Object.assign(obj, params)
  }

  let i = 0
  let o = 0

  // determine numeric gap in params
  while (i in params) {
    i++
  }

  // determine numeric gap in parent
  while (o in parent) {
    o++
  }

  // offset numeric indices in params before merge
  for (i--; i >= 0; i--) {
    params[i + o] = params[i]

    // create holes for the merge when necessary
    if (i < o) {
      delete params[i]
    }
  }

  return Object.assign(obj, params)
}

/**
 * 处理层的参数
 *
 * @param params - 参数处理器映射
 * @param layer - Layer 实例
 * @param called - 已调用的参数映射
 * @param req - 请求对象
 * @param res - 响应对象
 * @param done - 完成回调
 * @private
 */
function processParams (
  params: ParamsMap,
  layer: Layer,
  called: Record<string, any>,
  req: Request,
  res: Response,
  done: NextFunction
): void {
  // captured parameters from the layer, keys and values
  const keys = layer.keys

  // fast track
  if (!keys || keys.length === 0) {
    return done()
  }

  let i = 0
  let paramIndex = 0
  let key: string
  let paramVal: any
  let paramCallbacks: RequestParamHandler[]
  let paramCalled: any

  // process params in order
  // param callbacks can be async
  function param (err?: any): void {
    if (err) {
      return done(err)
    }

    if (i >= keys.length) {
      return done()
    }

    paramIndex = 0
    key = keys[i++]
    paramVal = req.params[key]
    paramCallbacks = params[key]
    paramCalled = called[key]

    if (paramVal === undefined || !paramCallbacks) {
      return param()
    }

    // param previously called with same value or error occurred
    if (paramCalled && (paramCalled.match === paramVal ||
      (paramCalled.error && paramCalled.error !== 'route'))) {
      // restore value
      req.params[key] = paramCalled.value

      // next param
      return param(paramCalled.error)
    }

    called[key] = paramCalled = {
      error: null,
      match: paramVal,
      value: paramVal,
    }

    paramCallback()
  }

  // single param callbacks
  function paramCallback (err?: any): void {
    const fn = paramCallbacks[paramIndex++]

    // store updated value
    paramCalled.value = req.params[key]

    if (err) {
      // store error
      paramCalled.error = err
      param(err)
      return
    }

    if (!fn) return param()

    try {
      const ret = fn(req, res, paramCallback, paramVal, key)
      if (util.types.isPromise(ret)) {
        Promise.resolve(ret).then(null, (error: any) => paramCallback(error || new Error('Rejected promise')))
      }
    } catch (e) {
      paramCallback(e)
    }
  }

  param()
}

/**
 * 在函数执行后恢复对象属性
 *
 * @param fn - 函数
 * @param obj - 对象
 * @param props - 属性名称
 * @returns 包装函数
 * @private
 */
function restore (fn: NextFunction, obj: any, ...props: string[]): NextFunction {
  const vals = new Array(props.length)

  for (let i = 0; i < props.length; i++) {
    vals[i] = obj[props[i]]
  }

  return function (this: any, ...args: any[]): any {
    // restore vals
    for (let i = 0; i < props.length; i++) {
      obj[props[i]] = vals[i]
    }

    return (fn as any).apply(this, args)
  }
}

/**
 * 发送 OPTIONS 响应
 *
 * @param res - 响应对象
 * @param methods - HTTP 方法数组
 * @private
 */
function sendOptionsResponse (res: Response, methods: string[]): void {
  const options: Record<string, boolean> = Object.create(null)

  // build unique method map
  for (let i = 0; i < methods.length; i++) {
    options[methods[i]] = true
  }

  // construct the allow list
  const allow = Object.keys(options).sort().join(', ')

  // send response
  res.setHeader('Allow', allow)
  res.setHeader('Content-Length', Buffer.byteLength(allow))
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(allow)
}

/**
 * 尝试发送 OPTIONS 响应
 *
 * @param res - 响应对象
 * @param methods - HTTP 方法数组
 * @param next - 下一步处理函数
 * @private
 */
function trySendOptionsResponse (res: Response, methods: string[], next: NextFunction): void {
  try {
    sendOptionsResponse(res, methods)
  } catch (err) {
    next(err)
  }
}

/**
 * 包装函数
 *
 * @param old - 旧函数
 * @param fn - 新函数
 * @returns 代理函数
 * @private
 */
function wrap (old: NextFunction, fn: (old: NextFunction, ...args: any[]) => void): NextFunction {
  return function proxy (this: any, ...args: any[]): void {
    const newArgs: any[] = [old, ...args]
      ; (fn as any).apply(this, newArgs)
  }
}

/**
 * 创建 Router 实例的工厂函数
 */
function createRouter (this: Router, options?: RouterOptions): RequestHandler & Router {
  return new Router(options) as RequestHandler & Router
}

const RouterExport = Object.assign(
  createRouter,
  {
    prototype: Router.prototype,
    Route,
  }
) as unknown as {
  (options?: RouterOptions): RequestHandler & Router
  new(options?: RouterOptions): RequestHandler & Router
  prototype: typeof Router.prototype
  Route: typeof Route
}

export { RouterExport as Router, Route }
export interface Routers extends Route { }
export type { Router as IRouter }
export * from './types'
