/*!
 * router
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

import util from 'node:util'
import debugModule from 'debug'
import * as pathRegexp from 'path-to-regexp'
import type { PathParams, NextFunction, ErrorRequestHandler, RequestHandler } from './types'
import type { Request, Response } from '../index'

/**
 * Module dependencies.
 * @private
 */
const debug = debugModule('router:layer')

/**
 * Module variables.
 * @private
 */

const TRAILING_SLASH_REGEXP = /\/+$/
const MATCHING_GROUP_REGEXP = /\((?:\?<(.*?)>)?(?!\?)/g

/**
 * 路径匹配结果接口
 */
export interface MatchResult {
  /** 匹配的参数对象 */
  params: Record<string, string>
  /** 匹配的路径字符串 */
  path: string
}

/**
 * 路径匹配器函数类型
 */
export type PathMatcher = (path: string) => MatchResult | false

/**
 * Layer 配置选项接口
 */
export interface LayerOptions {
  /** 是否启用严格模式，默认为 false */
  strict?: boolean
  /** 是否区分大小写，默认为 false */
  sensitive?: boolean
  /** 是否匹配路径末尾，默认为 true */
  end?: boolean
}

/**
 * 路径键接口
 */
export interface PathKey {
  /** 参数名称或索引 */
  name: string | number
  /** 参数在正则表达式中的位置 */
  offset: number
}

/**
 * Layer 类
 * 表示路由器中的一个中间件层
 */
export class Layer {
  /** 处理函数 */
  handle: RequestHandler | ErrorRequestHandler
  /** 函数名称 */
  name: string
  /** 匹配的参数对象 */
  params: Record<string, string> | undefined
  /** 参数键数组 */
  keys: string[]
  /** 匹配的路径 */
  path: string | undefined
  /** 是否为根路径且非结束匹配 */
  slash: boolean
  /** 路径匹配器数组 */
  matchers: PathMatcher[]
  // TODO
  route?: any
  /**
   * HTTP 方法名称
   * @description 动态设置
   */
  method?: string
  // TODO: 存疑 暂时没看到内部有设置、使用这个属性
  regexp?: RegExp

  constructor (
    path: PathParams,
    options: LayerOptions,
    fn: RequestHandler | ErrorRequestHandler
  ) {
    debug('new %o', path)
    const opts = options || {}

    this.handle = fn
    this.keys = []
    this.name = fn.name || '<anonymous>'
    this.params = undefined
    this.path = undefined
    this.slash = path === '/' && opts.end === false

    const matcher = (_path: string | RegExp): PathMatcher => {
      if (_path instanceof RegExp) {
        const keys: PathKey[] = []
        let name: string | number = 0
        let m: RegExpExecArray | null

        // eslint-disable-next-line no-cond-assign
        while (m = MATCHING_GROUP_REGEXP.exec(_path.source)) {
          keys.push({
            name: m[1] || name++,
            offset: m.index,
          })
        }

        return function regexpMatcher (p: string): MatchResult | false {
          const match = _path.exec(p)
          if (!match) {
            return false
          }

          const params: Record<string, string> = {}
          for (let i = 1; i < match.length; i++) {
            const key = keys[i - 1]
            const prop = key.name
            const val = decodeParam(match[i])

            if (val !== undefined) {
              params[String(prop)] = val
            }
          }

          return {
            params,
            path: match[0],
          }
        }
      }

      return pathRegexp.match((opts.strict ? _path : loosen(_path)), {
        sensitive: opts.sensitive,
        end: opts.end,
        trailing: !opts.strict,
        decode: decodeParam,
      })
    }

    this.matchers = Array.isArray(path) ? path.map(matcher) : [matcher(path)]
  }

  /**
   * 处理层的错误
   * @param error - 错误对象
   * @param req - 请求对象
   * @param res - 响应对象
   * @param next - 下一步处理函数
   */
  handleError (error: any, req: Request, res: Response, next: NextFunction): void {
    const fn = this.handle

    const isErrorHandler = (fn: this['handle']): fn is ErrorRequestHandler => fn.length === 4
    // not a standard error handler
    if (isErrorHandler(fn) === false) return next(error)

    try {
      // invoke function
      const ret = fn(error, req, res, next)
      // wait for returned promise
      if (!util.types.isPromise(ret)) return
      ret.then(null, (error) => next(error || new Error('Rejected promise')))
    } catch (err) {
      next(err)
    }
  }

  /**
   * 处理层的请求
   * @param req - 请求对象
   * @param res - 响应对象
   * @param next - 下一步处理函数
   */
  handleRequest (req: Request, res: Response, next: NextFunction): void {
    const fn = this.handle

    /** 通过is来强制推导类型 */
    const isStandardHandler = (fn: this['handle']): fn is RequestHandler => fn.length <= 3

    // not a standard request handler
    if (isStandardHandler(fn) === false) return next()

    try {
      const ret = fn(req, res, next)
      if (!util.types.isPromise(ret)) return
      ret.then(null, (error) => next(error || new Error('Rejected promise')))
    } catch (err) {
      next(err)
    }
  }

  /**
   * 检查路径是否匹配，如果匹配则填充 .params
   * @param path - 要匹配的路径
   * @returns 是否匹配
   */
  match (path: string | null | undefined): boolean {
    let match: MatchResult | false = false

    if (path != null) {
      // fast path non-ending match for / (any path matches)
      if (this.slash) {
        this.params = {}
        this.path = ''
        return true
      }

      let i = 0
      while (!match && i < this.matchers.length) {
        // match the path
        match = this.matchers[i](path)
        i++
      }
    }

    if (!match) {
      this.params = undefined
      this.path = undefined
      return false
    }

    // store values
    this.params = match.params
    this.path = match.path
    this.keys = Object.keys(match.params)

    return true
  }
}

/**
 * 解码参数值
 * @param val - 要解码的值
 * @returns 解码后的值
 */
function decodeParam (val: string): string {
  if (typeof val !== 'string' || val.length === 0) {
    return val
  }

  try {
    return decodeURIComponent(val)
  } catch (err) {
    if (err instanceof URIError) {
      const error = err as any
      error.message = 'Failed to decode param \'' + val + '\''
      error.status = 400
    }

    throw err
  }
}

/**
 * 放松给定路径以用于 path-to-regexp 匹配
 * @param path - 路径
 * @returns 放松后的路径
 */
function loosen (path: string | RegExp): string | RegExp
function loosen (path: Array<string | RegExp>): Array<string | RegExp>
function loosen (path: string | RegExp | Array<string | RegExp>): string | RegExp | Array<string | RegExp> {
  if (path instanceof RegExp || path === '/') {
    return path
  }

  return Array.isArray(path)
    ? path.map((p) => loosen(p) as string | RegExp)
    : String(path).replace(TRAILING_SLASH_REGEXP, '')
}
