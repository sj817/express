/*!
 * router
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */
import { Layer } from './layer'
import debugModule from 'debug'
import { methods } from './types/iRouter'
import type {
  PathParams,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
  IRouterHandler,
} from './types'
import type { Request, Response } from '@karinjs/express'

const debug = debugModule('router:route')

/**
 * Route 类
 * 表示一个路由，包含路径和多个处理该路径的中间件层
 */
export class Route<T extends PathParams = PathParams> {
  declare 'acl': IRouterHandler<this, T>
  declare 'bind': IRouterHandler<this, T>
  declare 'checkout': IRouterHandler<this, T>
  declare 'connect': IRouterHandler<this, T>
  declare 'copy': IRouterHandler<this, T>
  declare 'delete': IRouterHandler<this, T>
  declare 'get': IRouterHandler<this, T>
  declare 'head': IRouterHandler<this, T>
  declare 'link': IRouterHandler<this, T>
  declare 'lock': IRouterHandler<this, T>
  declare 'm-search': IRouterHandler<this, T>
  declare 'merge': IRouterHandler<this, T>
  declare 'mkactivity': IRouterHandler<this, T>
  declare 'mkcalendar': IRouterHandler<this, T>
  declare 'mkcol': IRouterHandler<this, T>
  declare 'move': IRouterHandler<this, T>
  declare 'notify': IRouterHandler<this, T>
  declare 'options': IRouterHandler<this, T>
  declare 'patch': IRouterHandler<this, T>
  declare 'post': IRouterHandler<this, T>
  declare 'propfind': IRouterHandler<this, T>
  declare 'proppatch': IRouterHandler<this, T>
  declare 'purge': IRouterHandler<this, T>
  declare 'put': IRouterHandler<this, T>
  declare 'query': IRouterHandler<this, T>
  declare 'rebind': IRouterHandler<this, T>
  declare 'report': IRouterHandler<this, T>
  declare 'search': IRouterHandler<this, T>
  declare 'source': IRouterHandler<this, T>
  declare 'subscribe': IRouterHandler<this, T>
  declare 'trace': IRouterHandler<this, T>
  declare 'unbind': IRouterHandler<this, T>
  declare 'unlink': IRouterHandler<this, T>
  declare 'unlock': IRouterHandler<this, T>
  declare 'unsubscribe': IRouterHandler<this, T>

  /** 路由路径 */
  path: PathParams
  /** 中间件层栈 */
  stack: Layer[]
  /** 支持的 HTTP 方法映射 */
  methods: Record<string, boolean>

  /**
   * 初始化 Route 实例
   * @param path - 路由路径
   */
  constructor (path: PathParams) {
    debug('new %o', path)
    this.path = path
    this.stack = []

    // route handlers for various http methods
    this.methods = Object.create(null)

    methods.forEach((method) => {
      // @ts-ignore
      this[method] = (
        ...handlers: Array<RequestHandler | ErrorRequestHandler>
      ) => this._method(method, ...handlers)
    })
  }

  /**
   * 为指定的 HTTP 方法添加处理器
   * @param method - HTTP 方法名称
   * @param handlers - 处理器函数或函数数组
   * @returns 返回 this 以支持链式调用
   * @private
   */
  private _method (method: typeof methods[number], ...handlers: Array<RequestHandler | ErrorRequestHandler>): Route {
    // 将所有处理器展平为一维数组
    const callbacks = handlers.flat(Infinity) as Array<RequestHandler | ErrorRequestHandler>

    if (callbacks.length === 0) {
      throw new TypeError('argument handler is required')
    }

    for (let i = 0; i < callbacks.length; i++) {
      const fn = callbacks[i]

      if (typeof fn !== 'function') {
        throw new TypeError('argument handler must be a function')
      }

      debug('%s %s', method, this.path)

      const layer = new Layer('/', {}, fn)
      layer.method = method

      this.methods[method] = true
      this.stack.push(layer)
    }

    return this as unknown as Route
  }

  /**
   * 检查路由是否处理指定的 HTTP 方法
   * @param method - HTTP 方法名称
   * @returns 是否处理该方法
   * @private
   */
  _handlesMethod (method: string): boolean {
    if (this.methods._all) {
      return true
    }

    // normalize name
    let name = typeof method === 'string'
      ? method.toLowerCase()
      : method

    if (name === 'head' && !this.methods.head) {
      name = 'get'
    }

    return Boolean(this.methods[name])
  }

  /**
   * 获取路由支持的 HTTP 方法列表
   * @returns HTTP 方法名称数组（大写）
   * @private
   */
  _methods (): string[] {
    const methods = Object.keys(this.methods)

    // append automatic head
    if (this.methods.get && !this.methods.head) {
      methods.push('head')
    }

    for (let i = 0; i < methods.length; i++) {
      // make upper case
      methods[i] = methods[i].toUpperCase()
    }

    return methods
  }

  /**
   * 将请求分发到此路由的处理器
   * @param req - 请求对象
   * @param res - 响应对象
   * @param done - 完成回调函数
   * @private
   */
  dispatch (req: Request, res: Response, done: NextFunction): void {
    let idx = 0
    const stack = this.stack
    let sync = 0

    if (stack.length === 0) {
      return done()
    }

    let method = typeof req.method === 'string'
      ? req.method.toLowerCase()
      : req.method

    if (method === 'head' && !this.methods.head) {
      method = 'get'
    }

    req.route = this as unknown as Route

    next()

    function next (err?: any): void {
      // signal to exit route
      if (err && err === 'route') {
        return done()
      }

      // signal to exit router
      if (err && err === 'router') {
        return done(err)
      }

      // no more matching layers
      if (idx >= stack.length) {
        return done(err)
      }

      // max sync stack
      if (++sync > 100) {
        setImmediate(next, err)
        return
      }

      let layer: Layer | undefined
      let match: boolean | undefined

      // find next matching layer
      while (match !== true && idx < stack.length) {
        layer = stack[idx++]
        match = !layer.method || layer.method === method
      }

      // no match
      if (match !== true) {
        return done(err)
      }

      if (err) {
        layer!.handleError(err, req, res, next)
      } else {
        layer!.handleRequest(req, res, next)
      }

      sync = 0
    }
  }

  /**
   * 为所有 HTTP 方法添加处理器
   *
   * 行为类似中间件，可以响应或调用 `next` 继续处理
   *
   * 可以使用多次 `.all` 调用来添加多个处理器
   *
   * @example
   * ```ts
   * function check_something(req, res, next){
   *   next()
   * }
   *
   * function validate_user(req, res, next){
   *   next()
   * }
   *
   * route
   *   .all(validate_user)
   *   .all(check_something)
   *   .get(function(req, res, next){
   *     res.send('hello world')
   *   })
   * ```
   *
   * @param handlers - 处理器函数或函数数组
   * @returns 返回 this 以支持链式调用
   */
  all (...handlers: Array<RequestHandler | ErrorRequestHandler>): this {
    // 将所有处理器展平为一维数组
    const callbacks = handlers.flat(Infinity) as Array<RequestHandler | ErrorRequestHandler>

    if (callbacks.length === 0) {
      throw new TypeError('argument handler is required')
    }

    for (let i = 0; i < callbacks.length; i++) {
      const fn = callbacks[i]

      if (typeof fn !== 'function') {
        throw new TypeError('argument handler must be a function')
      }

      const layer = new Layer('/', {}, fn)
      layer.method = undefined

      this.methods._all = true
      this.stack.push(layer)
    }

    return this
  }
}
