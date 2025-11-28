import type { ParsedQs } from 'qs'
import type { Request, Response } from '@karinjs/express'
import type { NextFunction, ParamsDictionary } from './request'

/**
 * 请求参数处理器类型
 * 用于处理路由参数的中间件函数
 * @param req - 请求对象
 * @param res - 响应对象
 * @param next - 下一步处理函数
 * @param value - 路由参数的值
 * @param name - 路由参数的名称
 * @returns 可以返回任意类型，通常为 void 或 Promise<void>
 */
export type RequestParamHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
  value: any,
  name: string
) => void | Promise<void>

/**
 * 请求处理器接口
 * 用于处理 HTTP 请求的标准中间件函数
 * @template P - 路由参数类型，默认为 ParamsDictionary
 * @template ResBody - 响应体类型，默认为 any
 * @template ReqBody - 请求体类型，默认为 any
 * @template ReqQuery - 查询参数类型，默认为 ParsedQs
 * @template LocalsObj - 本地变量对象类型，默认为 Record<string, any>
 * @param req - 请求对象
 * @param res - 响应对象
 * @param next - 下一步处理函数
 * @returns 可以返回任意类型，通常为 void 或 Promise<void>
 */
export interface RequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  LocalsObj extends Record<string, any> = Record<string, any>
> {
  (
    req: Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>,
    res: Response<ResBody, LocalsObj>,
    next: NextFunction,
  ): unknown
}

/**
 * 请求处理器参数类型
 * 可以是单个请求处理器、错误处理器或它们的数组
 * @template P - 路由参数类型，默认为 ParamsDictionary
 * @template ResBody - 响应体类型，默认为 any
 * @template ReqBody - 请求体类型，默认为 any
 * @template ReqQuery - 查询参数类型，默认为 ParsedQs
 * @template LocalsObj - 本地变量对象类型，默认为 Record<string, any>
 */
export type RequestHandlerParams<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  LocalsObj extends Record<string, any> = Record<string, any>
> =
  | RequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>
  | ErrorRequestHandler<P, ResBody, ReqBody, ReqQuery, LocalsObj>
  | Array<RequestHandler<P> | ErrorRequestHandler<P>>

/**
 * 错误请求处理器类型
 * 用于处理 Express 应用中的错误的特殊中间件函数
 * @template P - 路由参数类型，默认为 ParamsDictionary
 * @template ResBody - 响应体类型，默认为 any
 * @template ReqBody - 请求体类型，默认为 any
 * @template ReqQuery - 查询参数类型，默认为 ParsedQs
 * @template LocalsObj - 本地变量对象类型，默认为 Record<string, any>
 * @param err - 错误对象
 * @param req - 请求对象
 * @param res - 响应对象
 * @param next - 下一步处理函数
 * @returns 可以返回任意类型，通常为 void 或 Promise<void>
 */
export type ErrorRequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  LocalsObj extends Record<string, any> = Record<string, any>
> = (
  err: any,
  req: Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>,
  res: Response<ResBody, LocalsObj>,
  next: NextFunction,
) => unknown
